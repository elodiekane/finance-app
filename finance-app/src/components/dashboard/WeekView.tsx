import { NormalisedLineChart } from '../charts/NormalisedLineChart';
import type { HistoryPoint, ErrorMap } from '../../types/finance';
import { TICKER_COLORS } from '../../constants';
import { fmtPct, fmtPrice } from '../../utils/formatters';
import { pctReturn } from '../../utils/chartMath';

interface WeekViewProps {
  tickers:   { symbol: string; name: string }[];
  histories: Record<string, HistoryPoint[]>;
  errors:    ErrorMap;
  loading:   boolean;
}

// ─── Change table ─────────────────────────────────────────────────────────────

interface ChangeTableProps {
  tickers:   { symbol: string; name: string }[];
  histories: Record<string, HistoryPoint[]>;
  errors:    ErrorMap;
}

function ChangeTable({ tickers, histories, errors }: ChangeTableProps) {
  const rows = tickers
    .map(t => {
      const pts = histories[t.symbol] ?? [];
      const ret = pctReturn(pts);
      const last = pts[pts.length - 1];
      return {
        symbol:    t.symbol,
        name:      t.name,
        startPrice: pts[0]?.close,
        endPrice:   last?.close,
        pct:        ret,
        error:      errors[t.symbol],
      };
    })
    .sort((a, b) => (b.pct ?? -Infinity) - (a.pct ?? -Infinity));

  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>7-Day Return — Ranked</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            {['', 'Symbol', '7d Start', '7d End', '7d Return'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pos   = (r.pct ?? 0) >= 0;
            const color = TICKER_COLORS[r.symbol] ?? '#161616';
            return (
              <tr key={r.symbol} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                <td style={styles.td}>
                  <span style={{ ...styles.rank, borderColor: color, color }}>{i + 1}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.symBadge, background: color }}>{r.symbol}</span>
                </td>
                <td style={styles.td}>
                  {r.error ? '—' : r.startPrice != null ? fmtPrice(r.startPrice) : '—'}
                </td>
                <td style={{ ...styles.td, fontWeight: 600 }}>
                  {r.error ? '—' : r.endPrice != null ? fmtPrice(r.endPrice) : '—'}
                </td>
                <td style={{ ...styles.td, fontWeight: 700, color: pos ? '#24a148' : '#da1e28' }}>
                  {r.error
                    ? <span style={styles.errCell}>Error</span>
                    : r.pct != null ? fmtPct(r.pct) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────

export function WeekView({ tickers, histories, errors, loading }: WeekViewProps) {
  const symbols   = tickers.map(t => t.symbol);
  const allPoints = symbols.flatMap(s => histories[s] ?? []);
  const errSyms   = symbols.filter(s => errors[s]);

  return (
    <div style={styles.root}>
      {/* Normalised % return chart */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>7-Day Price Movement — Normalised</h2>
          <span style={styles.panelHint}>Rebased to 0 % at period start · each line shows relative gain/loss</span>
        </div>

        {errSyms.length > 0 && (
          <div style={styles.errorBanner} role="alert">
            Data unavailable for: {errSyms.join(', ')}
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Loading chart data…</div>
        ) : (
          <NormalisedLineChart data={allPoints} symbols={symbols} height={300} />
        )}
      </div>

      {/* Ranked return table */}
      {!loading && <ChangeTable tickers={tickers} histories={histories} errors={errors} />}
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
  panelHeader:  { marginBottom: '4px' },
  panelTitle:   { margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#161616' },
  panelHint:    { fontSize: '12px', color: '#6f6f6f', display: 'block', marginBottom: '16px' },
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
