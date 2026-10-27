import { SummaryCard } from '../charts/SummaryCard';
import type { Quote } from '../../types/finance';

interface CompanyCardProps {
  quote:     Quote;
  isLoading: boolean;
  error?:    string;
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatChange(change: number, pct: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export function CompanyCard({ quote, isLoading, error }: CompanyCardProps) {
  if (isLoading) {
    return <div style={styles.skeleton} aria-label="Loading..." />;
  }

  if (error) {
    return (
      <div style={styles.errorCard} role="alert">
        <span style={styles.errorSymbol}>{quote?.symbol ?? '—'}</span>
        <span style={styles.errorMsg}>{error}</span>
      </div>
    );
  }

  const positive = quote.change >= 0;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.symbol}>{quote.symbol}</span>
        <span style={styles.name}>{quote.name}</span>
      </div>
      <div style={styles.metrics}>
        <SummaryCard
          label="Price"
          value={formatPrice(quote.price)}
        />
        <SummaryCard
          label="Change"
          value={formatChange(quote.change, quote.changePercent)}
          positive={positive}
          negative={!positive}
        />
        <SummaryCard
          label="Volume"
          value={formatVolume(quote.volume)}
        />
        {quote.dayHigh !== undefined && quote.dayLow !== undefined && (
          <SummaryCard
            label="Day Range"
            value={`${formatPrice(quote.dayLow)} – ${formatPrice(quote.dayHigh)}`}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  symbol: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#161616',
  },
  name: {
    fontSize: '13px',
    color: '#6f6f6f',
  },
  metrics: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  skeleton: {
    background: '#e0e0e0',
    borderRadius: '8px',
    height: '100px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  errorCard: {
    background: '#fff1f1',
    border: '1px solid #ffb3b3',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  errorSymbol: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#da1e28',
  },
  errorMsg: {
    fontSize: '13px',
    color: '#da1e28',
  },
};
