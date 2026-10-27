import { PriceLineChart } from '../charts/PriceLineChart';
import { NormalisedLineChart } from '../charts/NormalisedLineChart';
import type { HistoryPoint, ErrorMap } from '../../types/finance';
import { TICKER_COLORS } from '../../constants';
import { fmtPrice, fmtPct, fmtVolume } from '../../utils/formatters';
import { quarterStats } from '../../utils/chartMath';

interface QuarterViewProps {
  tickers:   { symbol: string; name: string }[];
  histories: Record<string, HistoryPoint[]>;
  errors:    ErrorMap;
  loading:   boolean;
}

// ─── Performance summary table ────────────────────────────────────────────────

interface PerfTableProps {
  tickers:   { symbol: string; name: string }[];
  histories: Record<string, HistoryPoint[]>;
  errors:    ErrorMap;
}

function PerfTable({ tickers, histories, errors }: PerfTableProps) {
  const rows = tickers
    .map(t => {
      const stats = quarterStats(histories[t.symbol] ?? []);
      return { symbol: t.symbol, name: t.name, stats, error: errors[t.symbol] };
    })
    .sort((a, b) => (b.stats?.pct ?? -Infinity) - (a.stats?.pct ?? -Infinity));

  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>Quarter Performance Summary</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            {['', 'Symbol', 'Quarter Start', 'Quarter End', 'Total Return', 'Q High', 'Q Low', 'Avg Volume'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pos   = (r.stats?.pct ?? 0) >= 0;
            const color = TICKER_COLORS[r.symbol] ?? '#161616';
            const s     = r.stats;
            return (
              <tr key={r.symbol} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                <td style={styles.td}>
                  <span style={{ ...styles.rank, borderColor: color, color }}>{i + 1}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.symBadge, background: color }}>{r.symbol}</span>
                </td>
                <td style={styles.td}>{r.error || !s ? '—' : fmtPrice(s.startPrice)}</td>
                <td style={{ ...styles.td, fontWeight: 600 }}>
                  {r.error || !s ? '—' : fmtPrice(s.endPrice)}
                </td>
                <td style={{ ...styles.td, fontWeight: 700, color: pos ? '#24a148' : '#da1e28' }}>
                  {r.error ? <span style={styles.errCell}>Error</span> : s ? fmtPct(s.pct) : '—'}
                </td>
                <td style={styles.td}>{r.error || !s ? '—' : fmtPrice(s.qHigh)}</td>
                <td style={styles.td}>{r.error || !s ? '—' : fmtPrice(s.qLow)}</td>
                <td style={styles.td}>{r.error || !s ? '—' : fmtVolume(s.avgVol)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── QuarterView ──────────────────────────────────────────────────────────────

export function QuarterView({ tickers, histories, errors, loading }: QuarterViewProps) {
  const symbols   = tickers.map(t => t.symbol);
  const allPoints = symbols.flatMap(s => histories[s] ?? []);
  const errSyms   = symbols.filter(s => errors[s]);

  const errorBanner = errSyms.length > 0 && (
    <div style={styles.errorBanner} role="alert">
      Data unavailable for: {errSyms.join(', ')}
    </div>
  );

  const loadingPlaceholder = (
    <div style={styles.loading}>Loading chart data…</div>
  );

  return (
    <div style={styles.root}>
      {/* Absolute price area chart */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Last Quarter — Absolute Price</h2>
          <span style={styles.panelHint}>Closing price per trading day over the last ~90 days</span>
        </div>
        {errorBanner}
        {loading ? loadingPlaceholder : (
          <PriceLineChart data={allPoints} symbols={symbols} area height={300} />
        )}
      </div>

      {/* Normalised % chart — easier for relative comparison */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Last Quarter — Relative Return</h2>
          <span style={styles.panelHint}>Rebased to 0 % at quarter start · highlights divergence between tickers</span>
        </div>
        {errorBanner}
        {loading ? loadingPlaceholder : (
          <NormalisedLineChart data={allPoints} symbols={symbols} height={280} />
        )}
      </div>

      {/* Performance summary table */}
      {!loading && (
        <PerfTable tickers={tickers} histories={histories} errors={errors} />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root:  { display: 'flex', flexDirection: 'column', gap: '20px' },
  panel: {
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    overflowX: 'auto' as const,
  },
  panelHeader: { marginBottom: '4px' },
  panelTitle:  { margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#161616' },
  panelHint:   { fontSize: '12px', color: '#6f6f6f', display: 'block', marginBottom: '16px' },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '300px', color: '#6f6f6f', fontSize: '14px',
  },
  errorBanner: {
    background: '#fff1f1', border: '1px solid #ffb3b3', borderRadius: '4px',
    padding: '8px 12px', marginBottom: '12px', fontSize: '13px', color: '#da1e28',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th: {
    textAlign: 'left' as const, padding: '8px 12px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
    textTransform: 'uppercase' as const, color: '#6f6f6f',
    borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' as const,
  },
  td:     { padding: '10px 12px', verticalAlign: 'middle' as const },
  trEven: { background: '#ffffff' },
  trOdd:  { background: '#f9f9f9' },
  rank: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '22px', height: '22px', borderRadius: '50%',
    border: '2px solid', fontSize: '11px', fontWeight: 700,
  },
  symBadge: {
    display: 'inline-block', color: '#ffffff', fontSize: '11px',
    fontWeight: 700, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.04em',
  },
  errCell: { color: '#da1e28', fontSize: '12px' },
};
