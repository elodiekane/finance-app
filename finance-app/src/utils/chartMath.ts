/**
 * Pure chart math utilities used by dashboard views and chart components.
 * Kept in their own module so they can be unit-tested independently of React.
 */

import type { HistoryPoint } from '../types/finance';

// ─── % return ────────────────────────────────────────────────────────────────

/**
 * Percentage return from the first close to the last close in a series.
 * Returns null when there are fewer than 2 data points.
 */
export function pctReturn(points: HistoryPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].close;
  const last  = points[points.length - 1].close;
  if (first === 0) return null;
  return ((last - first) / first) * 100;
}

// ─── Quarter stats ────────────────────────────────────────────────────────────

export interface QuarterStats {
  startPrice: number;
  endPrice:   number;
  pct:        number;
  qHigh:      number;
  qLow:       number;
  avgVol:     number;
}

/**
 * Summarise a quarter's history: start/end price, total return %,
 * period high/low, and average daily volume.
 * Returns null for empty input.
 */
export function quarterStats(points: HistoryPoint[]): QuarterStats | null {
  if (points.length === 0) return null;
  const first = points[0];
  const last  = points[points.length - 1];
  const pct   = first.close === 0 ? 0 : ((last.close - first.close) / first.close) * 100;
  const qHigh = Math.max(...points.map(p => p.high));
  const qLow  = Math.min(...points.map(p => p.low));
  const avgVol = Math.round(points.reduce((s, p) => s + p.volume, 0) / points.length);
  return { startPrice: first.close, endPrice: last.close, pct, qHigh, qLow, avgVol };
}

// ─── Normalised rows (for NormalisedLineChart) ────────────────────────────────

export interface ChartRow {
  date: string;
  [symbol: string]: number | string;
}

/**
 * Rebase each ticker series to 0 % at its first data point, then merge all
 * tickers into rows keyed by date.  Used by NormalisedLineChart.
 */
export function toNormalisedRows(data: HistoryPoint[], symbols: string[]): ChartRow[] {
  const baseline: Record<string, number> = {};
  for (const pt of data) {
    if (symbols.includes(pt.symbol) && baseline[pt.symbol] === undefined) {
      baseline[pt.symbol] = pt.close;
    }
  }

  const byDate = new Map<string, ChartRow>();
  for (const pt of data) {
    if (!symbols.includes(pt.symbol)) continue;
    const base = baseline[pt.symbol];
    if (!base) continue;
    const pct = ((pt.close - base) / base) * 100;
    const row: ChartRow = byDate.get(pt.date) ?? { date: pt.date };
    row[pt.symbol] = Math.round(pct * 100) / 100;
    byDate.set(pt.date, row);
  }

  return Array.from(byDate.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
}
