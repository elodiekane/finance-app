import { PriceLineChart } from '../charts/PriceLineChart';
import type { HistoryPoint } from '../../types/finance';
import type { TimeWindow } from '../../types/finance';

interface ComparisonPanelProps {
  histories:    Record<string, HistoryPoint[]>;
  symbols:      string[];
  activeWindow: TimeWindow;
  isLoading:    boolean;
  errors:       Record<string, string>;
}

const PANEL_TITLES: Record<TimeWindow, string> = {
  day:     'Today\'s Movement',
  '7d':    'Last 7 Days — Price Comparison',
  quarter: 'Last Quarter — Trend Overview',
};

export function ComparisonPanel({
  histories,
  symbols,
  activeWindow,
  isLoading,
  errors,
}: ComparisonPanelProps) {
  const allPoints: HistoryPoint[] = symbols.flatMap(
    sym => histories[sym] ?? [],
  );

  const errorSymbols = symbols.filter(s => errors[s]);

  return (
    <section style={styles.panel}>
      <h2 style={styles.title}>{PANEL_TITLES[activeWindow]}</h2>

      {errorSymbols.length > 0 && (
        <div style={styles.errorBanner} role="alert">
          Data unavailable for: {errorSymbols.join(', ')}
        </div>
      )}

      {isLoading ? (
        <div style={styles.loading}>Loading chart data…</div>
      ) : (
        <PriceLineChart
          data={allPoints}
          symbols={symbols}
          area={activeWindow === 'quarter'}
          height={320}
        />
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  title: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#161616',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '320px',
    color: '#6f6f6f',
    fontSize: '14px',
  },
  errorBanner: {
    background: '#fff1f1',
    border: '1px solid #ffb3b3',
    borderRadius: '4px',
    padding: '8px 12px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#da1e28',
  },
};
