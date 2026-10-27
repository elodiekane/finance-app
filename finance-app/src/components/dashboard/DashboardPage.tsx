import { useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { TimeWindowTabs } from '../layout/TimeWindowTabs';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { QuarterView } from './QuarterView';

export function DashboardPage() {
  const tickers      = useDashboardStore(s => s.tickers);
  const activeWindow = useDashboardStore(s => s.activeWindow);
  const quotes       = useDashboardStore(s => s.quotes);
  const histories    = useDashboardStore(s => s.histories);
  const loadingKeys  = useDashboardStore(s => s.loadingKeys);
  const errors       = useDashboardStore(s => s.errors);
  const setWindow    = useDashboardStore(s => s.setWindow);
  const fetchQuotes    = useDashboardStore(s => s.fetchQuotes);
  const fetchHistories = useDashboardStore(s => s.fetchHistories);

  // Quotes: fetch once on mount
  useEffect(() => {
    void fetchQuotes();
  }, [fetchQuotes]);

  // History: re-fetch whenever the active window changes
  useEffect(() => {
    void fetchHistories();
  }, [fetchHistories, activeWindow]);

  const isLoading = loadingKeys.length > 0;

  const viewProps = {
    tickers,
    histories,
    errors,
    loading: isLoading,
  };

  return (
    <div>
      <TimeWindowTabs active={activeWindow} onChange={setWindow} />

      {activeWindow === 'day' && (
        <DayView
          {...viewProps}
          quotes={quotes}
        />
      )}

      {activeWindow === '7d' && (
        <WeekView {...viewProps} />
      )}

      {activeWindow === 'quarter' && (
        <QuarterView {...viewProps} />
      )}
    </div>
  );
}
