import type { Quote, HistoryPoint, TimeWindow } from '../types/finance';
import { normalizeQuote, normalizeHistory } from '../utils/normalizeQuote';
import { DEFAULT_TICKERS } from '../constants';

// ─── Configuration ────────────────────────────────────────────────────────────

/** Simulated network latency in ms.  Set to 0 in tests via MOCK_LATENCY=0. */
const MOCK_LATENCY = (() => {
  // process.env is available in Node (Jest, proxy) but not in the browser bundle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.MOCK_LATENCY) as string | undefined;
  if (env !== undefined && env !== '') return parseInt(env, 10);
  return 60;
})();

async function delay(ms = MOCK_LATENCY): Promise<void> {
  if (ms > 0) await new Promise(r => setTimeout(r, ms));
}

// ─── Static quotes ────────────────────────────────────────────────────────────

/**
 * Representative snapshots for each ticker.
 * Fields mirror the Yahoo Finance quote object so normalizeQuote() applies
 * exactly the same path as it does for live data.
 */
const MOCK_QUOTES: Record<string, Record<string, unknown>> = {
  IBM: {
    shortName:                  'International Business Machines',
    currency:                   'USD',
    fullExchangeName:           'NYSE',
    regularMarketPrice:         171.20,
    regularMarketChange:        2.35,
    regularMarketChangePercent: 1.39,
    regularMarketOpen:          169.10,
    regularMarketDayHigh:       172.50,
    regularMarketDayLow:        168.80,
    regularMarketPreviousClose: 168.85,
    regularMarketVolume:        4_200_000,
    regularMarketTime:          1_710_000_000,
    averageDailyVolume3Month:   4_500_000,
    marketCap:                  155_000_000_000,
    fiftyTwoWeekHigh:           199.18,
    fiftyTwoWeekLow:            122.51,
  },
  MSFT: {
    shortName:                  'Microsoft Corporation',
    currency:                   'USD',
    fullExchangeName:           'NasdaqGS',
    regularMarketPrice:         415.80,
    regularMarketChange:        -1.20,
    regularMarketChangePercent: -0.29,
    regularMarketOpen:          416.50,
    regularMarketDayHigh:       417.00,
    regularMarketDayLow:        413.50,
    regularMarketPreviousClose: 417.00,
    regularMarketVolume:        18_500_000,
    regularMarketTime:          1_710_000_000,
    averageDailyVolume3Month:   20_000_000,
    marketCap:                  3_090_000_000_000,
    fiftyTwoWeekHigh:           468.35,
    fiftyTwoWeekLow:            309.45,
  },
  ORCL: {
    shortName:                  'Oracle Corporation',
    currency:                   'USD',
    fullExchangeName:           'NYSE',
    regularMarketPrice:         124.30,
    regularMarketChange:        0.85,
    regularMarketChangePercent: 0.69,
    regularMarketOpen:          123.70,
    regularMarketDayHigh:       125.10,
    regularMarketDayLow:        123.20,
    regularMarketPreviousClose: 123.45,
    regularMarketVolume:        7_800_000,
    regularMarketTime:          1_710_000_000,
    averageDailyVolume3Month:   8_200_000,
    marketCap:                  340_000_000_000,
    fiftyTwoWeekHigh:           141.79,
    fiftyTwoWeekLow:            99.26,
  },
  SAP: {
    shortName:                  'SAP SE',
    currency:                   'USD',
    fullExchangeName:           'NYSE',
    regularMarketPrice:         198.70,
    regularMarketChange:        3.10,
    regularMarketChangePercent: 1.59,
    regularMarketOpen:          196.20,
    regularMarketDayHigh:       199.20,
    regularMarketDayLow:        195.80,
    regularMarketPreviousClose: 195.60,
    regularMarketVolume:        1_100_000,
    regularMarketTime:          1_710_000_000,
    averageDailyVolume3Month:   1_250_000,
    marketCap:                  230_000_000_000,
    fiftyTwoWeekHigh:           218.44,
    fiftyTwoWeekLow:            130.17,
  },
  CRM: {
    shortName:                  'Salesforce, Inc.',
    currency:                   'USD',
    fullExchangeName:           'NYSE',
    regularMarketPrice:         280.50,
    regularMarketChange:        -2.40,
    regularMarketChangePercent: -0.85,
    regularMarketOpen:          282.10,
    regularMarketDayHigh:       283.00,
    regularMarketDayLow:        279.10,
    regularMarketPreviousClose: 282.90,
    regularMarketVolume:        5_600_000,
    regularMarketTime:          1_710_000_000,
    averageDailyVolume3Month:   5_900_000,
    marketCap:                  270_000_000_000,
    fiftyTwoWeekHigh:           318.71,
    fiftyTwoWeekLow:            193.00,
  },
};

// ─── Seeded pseudo-random history ─────────────────────────────────────────────

/**
 * Deterministic LCG pseudo-random number generator.
 * Using a seed based on symbol ensures each ticker always produces the same
 * series shape, making the quarter view tell a coherent story.
 */
function seedRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function symbolSeed(symbol: string): number {
  return symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

/**
 * Generate a realistic-looking OHLCV history for `days` trading days ending
 * today.  The series is deterministic per symbol so repeated calls are stable.
 */
function generateHistory(
  symbol: string,
  basePrice: number,
  days: number,
): Array<Record<string, unknown>> {
  const rng   = seedRng(symbolSeed(symbol) + days);
  const rows: Array<Record<string, unknown>> = [];
  let price = basePrice;

  // Walk backwards from today so we can skip weekends correctly
  const dates: string[] = [];
  const cursor = new Date();
  while (dates.length <= days) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      dates.unshift(`${y}-${m}-${d}`);
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  for (const date of dates) {
    const dailyMove = (rng() - 0.48) * 0.022;    // slight upward bias
    const intradayRange = rng() * 0.015 + 0.003;  // 0.3–1.8% spread

    const open    = price;
    price         = price * (1 + dailyMove);
    const high    = Math.max(open, price) * (1 + intradayRange / 2);
    const low     = Math.min(open, price) * (1 - intradayRange / 2);
    const close   = price;
    const volume  = Math.round((rng() * 0.6 + 0.7) * 5_000_000);

    rows.push({
      date,
      open:    Math.round(open    * 100) / 100,
      high:    Math.round(high    * 100) / 100,
      low:     Math.round(low     * 100) / 100,
      close:   Math.round(close   * 100) / 100,
      adjClose: Math.round(close  * 100) / 100,
      volume,
    });
  }

  return rows;
}

// ─── Window → day count ───────────────────────────────────────────────────────

const WINDOW_DAYS: Record<TimeWindow, number> = {
  day:     2,    // 2 trading days gives at least 1 data point
  '7d':    7,
  quarter: 90,
};

// ─── Exported mock adapter ────────────────────────────────────────────────────

export async function mockGetQuote(symbol: string): Promise<Quote> {
  await delay();

  const raw = MOCK_QUOTES[symbol.toUpperCase()];
  if (!raw) {
    throw new Error(`Unknown ticker: ${symbol}`);
  }
  return normalizeQuote(symbol.toUpperCase(), raw);
}

export async function mockGetHistory(
  symbol: string,
  window: TimeWindow,
): Promise<HistoryPoint[]> {
  await delay();

  const upper = symbol.toUpperCase();
  const raw   = MOCK_QUOTES[upper];
  if (!raw) {
    throw new Error(`Unknown ticker: ${symbol}`);
  }

  const base = Number(raw.regularMarketPrice);
  const days = WINDOW_DAYS[window];
  const rows = generateHistory(upper, base, days);
  return normalizeHistory(upper, rows);
}

/** All ticker symbols supported by the mock adapter */
export const MOCK_SUPPORTED_SYMBOLS = new Set(
  DEFAULT_TICKERS.map(t => t.symbol),
);

/** Direct access to the raw mock quotes (used in tests) */
export { MOCK_QUOTES as _MOCK_QUOTES };
