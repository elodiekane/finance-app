import { useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import type { Quote } from '../types/finance';

/**
 * Returns the cached Quote for a single ticker symbol,
 * the loading state, and any error string.
 *
 * Fetching is driven by the store's fetchQuotes action —
 * this hook simply subscribes to the relevant slice.
 */
export function useQuote(symbol: string): {
  quote:     Quote | undefined;
  isLoading: boolean;
  error:     string | undefined;
} {
  const quotes      = useDashboardStore(s => s.quotes);
  const loadingKeys = useDashboardStore(s => s.loadingKeys);
  const errors      = useDashboardStore(s => s.errors);

  return {
    quote:     quotes[symbol],
    isLoading: loadingKeys.includes(symbol),
    error:     errors[symbol],
  };
}

/**
 * Convenience hook: triggers fetchQuotes on mount for all default tickers.
 * Mount this once at the top of DashboardPage.
 */
export function useBootstrapQuotes(): void {
  const fetchQuotes = useDashboardStore(s => s.fetchQuotes);

  useEffect(() => {
    void fetchQuotes();
  }, [fetchQuotes]);
}
