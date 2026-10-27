import type { Quote, HistoryPoint } from '../types/finance';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

function optNum(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return isFinite(n) ? n : undefined;
}

/**
 * Normalise a raw date value from Yahoo Finance into a plain YYYY-MM-DD string.
 * yahoo-finance2 returns `Date` objects from `.historical()`; the proxy may
 * forward them as ISO strings or epoch numbers.  All three forms are handled.
 */
export function normaliseDateValue(raw: unknown): string {
  if (raw instanceof Date) {
    // Use local-calendar date of the Date object to match the trading date.
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof raw === 'number') {
    // Epoch milliseconds — convert via local calendar
    return normaliseDateValue(new Date(raw));
  }
  if (typeof raw === 'string') {
    // Already YYYY-MM-DD — keep as-is to avoid timezone drift
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // ISO string with time component — take the date part using local time
    return normaliseDateValue(new Date(raw));
  }
  return '';
}

// ─── Quote ───────────────────────────────────────────────────────────────────

/**
 * Convert a raw Yahoo Finance quote object into the domain Quote model.
 * All fields that may be missing are handled gracefully; unknown extras are
 * silently ignored so new Yahoo Finance fields don't break the app.
 */
export function normalizeQuote(
  symbol: string,
  raw: Record<string, unknown>,
): Quote {
  return {
    symbol,
    name:     String(raw.shortName ?? raw.longName ?? raw.displayName ?? symbol),
    currency: String(raw.currency ?? 'USD'),
    exchange: String(raw.fullExchangeName ?? raw.exchange ?? ''),
    price:    num(raw.regularMarketPrice),
    change:   num(raw.regularMarketChange),
    changePercent: num(raw.regularMarketChangePercent),
    volume:   num(raw.regularMarketVolume),
    avgVolume: optNum(raw.averageDailyVolume3Month ?? raw.averageDailyVolume10Day),
    marketCap: optNum(raw.marketCap),
    open:      optNum(raw.regularMarketOpen),
    dayHigh:   optNum(raw.regularMarketDayHigh),
    dayLow:    optNum(raw.regularMarketDayLow),
    previousClose: optNum(raw.regularMarketPreviousClose),
    fiftyTwoWeekHigh: optNum(raw.fiftyTwoWeekHigh),
    fiftyTwoWeekLow:  optNum(raw.fiftyTwoWeekLow),
    updatedAt: raw.regularMarketTime !== undefined
      ? num(raw.regularMarketTime) * 1000   // Yahoo returns Unix seconds
      : undefined,
  };
}

// ─── History ─────────────────────────────────────────────────────────────────

/**
 * Convert raw Yahoo Finance historical rows into HistoryPoint[].
 *
 * Accepts the objects returned by yahoo-finance2's `.historical()` method
 * (which carries `Date` objects) as well as plain JSON rows forwarded from
 * the proxy (which carry strings or epoch numbers).
 *
 * Rows with a missing or invalid date, or a non-positive close price, are
 * filtered out.  The result is always sorted ascending by date.
 */
export function normalizeHistory(
  symbol: string,
  rows: Array<Record<string, unknown>>,
): HistoryPoint[] {
  return rows
    .filter(r => {
      if (r.date === undefined && r.Date === undefined) return false;
      const close = num(r.close ?? r.adjclose ?? r.adjClose);
      return close > 0;
    })
    .map(r => {
      const rawDate = r.date ?? r.Date;
      const date    = normaliseDateValue(rawDate);
      return {
        date,
        symbol,
        open:    num(r.open),
        high:    num(r.high),
        low:     num(r.low),
        close:   num(r.close),
        adjClose: optNum(r.adjclose ?? r.adjClose),
        volume:  num(r.volume),
      };
    })
    .filter(pt => pt.date !== '')
    .sort((a, b) => a.date.localeCompare(b.date));
}
