import type { Quote, ErrorMap } from '../../types/finance';
import { TICKER_COLORS } from '../../constants';
import { fmtPrice, fmtChange, fmtVolume, fmtMarketCap } from '../../utils/formatters';

// ─── Market status bar ────────────────────────────────────────────────────────

/** Determines whether NYSE is currently open (approximate, ET-based). */
function isNyseOpen(): boolean {
  const now    = new Date();
  const dow    = now.getDay();
  const etHour = now.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/New_York' });
  const etH    = parseInt(etHour, 10);
  return dow >= 1 && dow <= 5 && etH >= 9 && etH < 16;
}

function MarketStatusBar({ quotes }: { quotes: Record<string, Quote> }) {
  const sample  = Object.values(quotes)[0];
  const ts      = sample?.updatedAt;
  const timeStr = ts
    ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
    : null;
  const isOpen  = isNyseOpen();

  return (
    <div style={styles.statusBar}>
      <div style={styles.statusLeft}>
        <span style={{ ...styles.statusDot, background: isOpen ? '#24a148' : '#8d8d8d' }} />
        <span style={styles.statusText}>
          {isOpen ? 'Market Open' : 'Market Closed'}
        </span>
        {timeStr && (
          <span style={styles.statusTime}>Last updated {timeStr}</span>
        )}
      </div>
      <span style={styles.statusExchange}>NYSE · NASDAQ</span>
    </div>
  );
}

// ─── Leaderboard table ────────────────────────────────────────────────────────

interface LeaderboardProps {
  quotes:  Record<string, Quote>;
  errors:  ErrorMap;
  loading: boolean;
}

function Leaderboard({ quotes, errors, loading }: LeaderboardProps) {
  const rows = Object.values(quotes).sort(
    (a, b) => b.changePercent - a.changePercent,
  );

  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>Today's Performance</h2>
      {loading && rows.length === 0 ? (
        <div style={styles.loadingRow}>Loading…</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Rank', 'Symbol', 'Price', 'Change', 'Volume', 'Mkt Cap'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((q, i) => {
              const pos = q.change >= 0;
              const color = TICKER_COLORS[q.symbol] ?? '#161616';
              const err   = errors[q.symbol];
              return (
                <tr key={q.symbol} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>
                    <span style={{ ...styles.rank, borderColor: color, color }}>{i + 1}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.symBadge, background: color }}>{q.symbol}</span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>
                    {err ? <span style={styles.errCell}>Error</span> : fmtPrice(q.price)}
                  </td>
                  <td style={{ ...styles.td, color: pos ? '#24a148' : '#da1e28', fontWeight: 600 }}>
                    {err ? '—' : fmtChange(q.change, q.changePercent)}
                  </td>
                  <td style={styles.td}>{err ? '—' : fmtVolume(q.volume)}</td>
                  <td style={styles.td}>{err ? '—' : fmtMarketCap(q.marketCap)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Expanded company card ────────────────────────────────────────────────────

function ExpandedCompanyCard({ quote, error }: { quote: Quote; error?: string }) {
  const pos   = quote.change >= 0;
  const color = TICKER_COLORS[quote.symbol] ?? '#0f62fe';

  if (error) {
    return (
      <div style={{ ...styles.compCard, borderTopColor: '#da1e28' }} role="alert">
        <div style={styles.compHeader}>
          <span style={{ ...styles.compSymbol, color: '#da1e28' }}>{quote.symbol}</span>
        </div>
        <p style={{ fontSize: '13px', color: '#da1e28', margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ ...styles.compCard, borderTopColor: color }}>
      <div style={styles.compHeader}>
        <div>
          <span style={{ ...styles.compSymbol, color }}>{quote.symbol}</span>
          <span style={styles.compName}>{quote.name}</span>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={styles.compPrice}>{fmtPrice(quote.price)}</div>
          <div style={{ ...styles.compChange, color: pos ? '#24a148' : '#da1e28' }}>
            {fmtChange(quote.change, quote.changePercent)}
          </div>
        </div>
      </div>

      <div style={styles.metricGrid}>
        {quote.open !== undefined && (
          <MetricCell label="Open" value={fmtPrice(quote.open)} />
        )}
        {quote.dayHigh !== undefined && quote.dayLow !== undefined && (
          <MetricCell label="Day Range" value={`${fmtPrice(quote.dayLow)} – ${fmtPrice(quote.dayHigh)}`} />
        )}
        {quote.previousClose !== undefined && (
          <MetricCell label="Prev Close" value={fmtPrice(quote.previousClose)} />
        )}
        <MetricCell label="Volume" value={fmtVolume(quote.volume)} />
        {quote.avgVolume !== undefined && (
          <MetricCell label="Avg Volume" value={fmtVolume(quote.avgVolume)} />
        )}
        {quote.marketCap !== undefined && (
          <MetricCell label="Mkt Cap" value={fmtMarketCap(quote.marketCap)} />
        )}
        {quote.fiftyTwoWeekHigh !== undefined && quote.fiftyTwoWeekLow !== undefined && (
          <MetricCell
            label="52w Range"
            value={`${fmtPrice(quote.fiftyTwoWeekLow)} – ${fmtPrice(quote.fiftyTwoWeekHigh)}`}
          />
        )}
        <MetricCell label="Exchange" value={`${quote.exchange} · ${quote.currency}`} />
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCell}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricValue}>{value}</span>
    </div>
  );
}

// ─── DayView ──────────────────────────────────────────────────────────────────

interface DayViewProps {
  tickers:  { symbol: string; name: string }[];
  quotes:   Record<string, Quote>;
  errors:   ErrorMap;
  loading:  boolean;
}

export function DayView({ tickers, quotes, errors, loading }: DayViewProps) {
  const hasQuotes = Object.keys(quotes).length > 0;

  return (
    <div style={styles.root}>
      {hasQuotes && <MarketStatusBar quotes={quotes} />}

      <Leaderboard quotes={quotes} errors={errors} loading={loading} />

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Company Detail</h2>
        <div style={styles.cardGrid}>
          {tickers.map(t => {
            const q = quotes[t.symbol];
            if (loading && !q) {
              return <div key={t.symbol} style={styles.skeleton} aria-label="Loading..." />;
            }
            return (
              <ExpandedCompanyCard
                key={t.symbol}
                quote={q ?? { symbol: t.symbol, name: t.name, currency: '', exchange: '', price: 0, change: 0, changePercent: 0, volume: 0 }}
                error={errors[t.symbol]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', gap: '20px' },

  // Status bar
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
  },
  statusLeft:     { display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot:      { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  statusText:     { fontWeight: 600, color: '#161616' },
  statusTime:     { color: '#6f6f6f' },
  statusExchange: { color: '#6f6f6f', fontSize: '12px' },

  // Panel wrapper
  panel: {
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    overflowX: 'auto' as const,
  },
  panelTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#161616' },
  loadingRow: { color: '#6f6f6f', fontSize: '14px', padding: '20px 0', textAlign: 'center' as const },

  // Leaderboard table
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: '#6f6f6f',
    borderBottom: '2px solid #e0e0e0',
    whiteSpace: 'nowrap' as const,
  },
  td:     { padding: '10px 12px', verticalAlign: 'middle' as const },
  trEven: { background: '#ffffff' },
  trOdd:  { background: '#f9f9f9' },
  rank: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid',
    fontSize: '11px',
    fontWeight: 700,
  },
  symBadge: {
    display: 'inline-block',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '0.04em',
  },
  errCell: { color: '#da1e28', fontSize: '12px' },

  // Section
  section:      { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: '#161616' },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  skeleton: {
    background: '#e8e8e8',
    borderRadius: '8px',
    height: '180px',
  },

  // Expanded company card
  compCard: {
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderTop: '3px solid',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  compHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  compSymbol:  { fontSize: '20px', fontWeight: 700, display: 'block' },
  compName:    { fontSize: '12px', color: '#6f6f6f', display: 'block', marginTop: '2px' },
  compPrice:   { fontSize: '22px', fontWeight: 700, color: '#161616' },
  compChange:  { fontSize: '13px', fontWeight: 600, marginTop: '2px' },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '8px',
  },
  metricCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    background: '#f4f4f4',
    borderRadius: '4px',
    padding: '8px 10px',
  },
  metricLabel: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#6f6f6f' },
  metricValue: { fontSize: '13px', fontWeight: 600, color: '#161616' },
};
