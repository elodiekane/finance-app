import type { Quote, HistoryPoint, TimeWindow } from '../types/finance';
import { mockGetQuote, mockGetHistory } from './mockData';
import { yahooGetQuote, yahooGetHistory } from './yahooFinanceAdapter';
import { TtlCache } from '../utils/ttlCache';
import { isMockMode } from './dataSource';

/**
 * Public finance service.
 *
 * Adapter selection (env flag set in vite.config / .env):
 *   VITE_USE_MOCK !== 'false'  → static mock data  (default: workshop / CI)
 *   VITE_USE_MOCK === 'false'  → Yahoo Finance via /api/finance proxy
 *
 * Cache:
 *   Results are held in a simple in-memory TTL cache so repeated calls
 *   within the same window don't hit the network (or mock latency) twice.
 *   Quotes expire after 60 s; history expires per-window (see TTL_MS).
 *   Call financeService.clearCache() to force a fresh fetch.
 */

const useMock = isMockMode();

// ─── Cache instances ──────────────────────────────────────────────────────────

const quoteCache   = new TtlCache<Quote>();
const historyCache = new TtlCache<HistoryPoint[]>();

/** Cache TTLs in milliseconds */
const TTL_MS: Record<'quote' | TimeWindow, number> = {
  quote:   60_000,   //  1 minute  — quotes change frequently
  day:     60_000,   //  1 minute
  '7d':   300_000,   //  5 minutes — short-term history changes slowly
  quarter: 600_000,  // 10 minutes — quarter trends change very slowly
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const financeService = {
  async getQuote(symbol: string): Promise<Quote> {
    const key     = symbol.toUpperCase();
    const cached  = quoteCache.get(key);
    if (cached) return cached;

    const quote = useMock
      ? await mockGetQuote(key)
      : await yahooGetQuote(key);

    quoteCache.set(key, quote, TTL_MS.quote);
    return quote;
  },

  async getHistory(symbol: string, window: TimeWindow): Promise<HistoryPoint[]> {
    const key    = `${symbol.toUpperCase()}:${window}`;
    const cached = historyCache.get(key);
    if (cached) return cached;

    const history = useMock
      ? await mockGetHistory(symbol, window)
      : await yahooGetHistory(symbol, window);

    historyCache.set(key, history, TTL_MS[window]);
    return history;
  },

  /** Evict a single quote from the cache (e.g. after a manual refresh) */
  invalidateQuote(symbol: string): void {
    quoteCache.delete(symbol.toUpperCase());
  },

  /** Evict history for a symbol+window combination */
  invalidateHistory(symbol: string, window: TimeWindow): void {
    historyCache.delete(`${symbol.toUpperCase()}:${window}`);
  },

  /** Clear all cached data — next call will fetch fresh */
  clearCache(): void {
    quoteCache.clear();
    historyCache.clear();
  },

  /** Expose cache sizes for tests and diagnostics */
  _cacheSize(): { quotes: number; histories: number } {
    return { quotes: quoteCache.size(), histories: historyCache.size() };
  },
};
