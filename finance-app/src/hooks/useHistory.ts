import { useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import type { HistoryPoint, TimeWindow } from '../types/finance';

/**
 * Returns the cached HistoryPoint[] for a single ticker symbol,
 * loading state, and any error string for the active time window.
 */
export function useHistory(symbol: string): {
  history:   HistoryPoint[];
  isLoading: boolean;
  error:     string | undefined;
} {
  const histories   = useDashboardStore(s => s.histories);
  const loadingKeys = useDashboardStore(s => s.loadingKeys);
  const errors      = useDashboardStore(s => s.errors);

  return {
    history:   histories[symbol] ?? [],
    isLoading: loadingKeys.includes(symbol),
    error:     errors[symbol],
  };
}

/**
 * Triggers fetchHistories whenever the active time window changes.
 * Mount this once at the top of DashboardPage.
 */
export function useBootstrapHistories(): void {
  const fetchHistories = useDashboardStore(s => s.fetchHistories);
  const activeWindow:  TimeWindow = useDashboardStore(s => s.activeWindow);

  useEffect(() => {
    void fetchHistories();
  }, [fetchHistories, activeWindow]);
}
