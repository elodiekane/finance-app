import type { Quote, HistoryPoint, TimeWindow } from '../types/finance';
import { normalizeQuote, normalizeHistory } from '../utils/normalizeQuote';
import { UnsupportedSymbolError } from './errors';

/**
 * Browser-side Yahoo Finance adapter.
 *
 * yahoo-finance2 is a Node.js library and cannot run in the browser directly.
 * This adapter delegates all calls to the lightweight Express proxy at
 * finance-app/server/proxy.ts, which Vite dev-server forwards via:
 *
 *   vite.config.ts → server.proxy → /api/finance/* → http://localhost:3001
 *
 * To use live data:
 *   1. Run `npm run proxy` in a separate terminal
 *   2. Run `npm run dev:live` (sets VITE_USE_MOCK=false)
 */

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function fetchProxy<T>(path: string, symbol: string): Promise<T> {
  const res = await fetch(`/api/finance/${path}`);
  // The proxy answers 404 when the symbol does not exist or has no data.
  if (res.status === 404) throw new UnsupportedSymbolError(symbol);
  if (!res.ok) {
    let message: string;
    try {
      const body = await res.json() as { error?: string };
      message = body.error ?? `HTTP ${res.status}`;
    } catch {
      message = `HTTP ${res.status}`;
    }
    throw new Error(`[Yahoo Finance] ${path}: ${message}`);
  }
  return res.json() as Promise<T>;
}

// ─── Exported functions ───────────────────────────────────────────────────────

export async function yahooGetQuote(symbol: string): Promise<Quote> {
  const raw = await fetchProxy<Record<string, unknown>>(
    `quote/${encodeURIComponent(symbol.toUpperCase())}`,
    symbol,
  );
  return normalizeQuote(symbol.toUpperCase(), raw);
}

export async function yahooGetHistory(
  symbol: string,
  window: TimeWindow,
): Promise<HistoryPoint[]> {
  const raw = await fetchProxy<{ rows: Array<Record<string, unknown>> }>(
    `history/${encodeURIComponent(symbol.toUpperCase())}?window=${window}`,
    symbol,
  );
  // rows are ISO date strings serialised by the proxy
  return normalizeHistory(symbol.toUpperCase(), raw.rows);
}
