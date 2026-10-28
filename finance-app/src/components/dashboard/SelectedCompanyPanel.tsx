import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { NormalisedLineChart } from '../charts/NormalisedLineChart';

const WINDOW_LABELS = {
  day:     'Today',
  '7d':    'Last 7 Days',
  quarter: 'Last Quarter',
} as const;

/**
 * "Compare a company" panel.
 *
 * The user enters a symbol; the panel charts that company's relative return
 * next to IBM for the active time window. All state lives in the store's
 * selected-company slice, so the IBM / competitor dashboards above are never
 * touched. IBM data is only read from the existing histories.
 */
export function SelectedCompanyPanel() {
  const activeWindow = useDashboardStore(s => s.activeWindow);
  const ibmHistory   = useDashboardStore(s => s.histories['IBM']);
  const symbol       = useDashboardStore(s => s.selectedSymbol);
  const name         = useDashboardStore(s => s.selectedName);
  const history      = useDashboardStore(s => s.selectedHistory);
  const status       = useDashboardStore(s => s.selectedStatus);
  const message      = useDashboardStore(s => s.selectedMessage);
  const selectCompany          = useDashboardStore(s => s.selectCompany);
  const refreshSelectedCompany = useDashboardStore(s => s.refreshSelectedCompany);
  const clearSelectedCompany   = useDashboardStore(s => s.clearSelectedCompany);

  const [input, setInput] = useState('');

  // Reload the selected company when the user switches time window.
  useEffect(() => {
    void refreshSelectedCompany();
  }, [refreshSelectedCompany, activeWindow]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void selectCompany(input);
  }

  function onClear() {
    setInput('');
    clearSelectedCompany();
  }

  const chartSymbols = symbol ? ['IBM', symbol] : [];
  const chartData    = symbol ? [...(ibmHistory ?? []), ...history] : [];

  return (
    <section style={styles.panel} aria-label="Compare a company">
      <h2 style={styles.title}>
        {status === 'ready' && symbol
          ? `${symbol}${name ? ` — ${name}` : ''} vs IBM · ${WINDOW_LABELS[activeWindow]}`
          : 'Compare a Company'}
      </h2>
      <span style={styles.hint}>
        Enter a stock symbol (for example AAPL, GOOGL, AMZN, NVDA) to chart it next to IBM.
      </span>

      <form onSubmit={onSubmit} style={styles.form}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Symbol, e.g. AAPL"
          aria-label="Company symbol"
          maxLength={12}
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={status === 'loading'}>
          Show chart
        </button>
        {status !== 'idle' && (
          <button type="button" onClick={onClear} style={styles.secondaryButton}>
            Clear
          </button>
        )}
      </form>

      {status === 'loading' && <div style={styles.loading}>Loading {symbol}…</div>}

      {(status === 'no-data' || status === 'error') && message && (
        <div style={styles.message} role="alert">{message}</div>
      )}

      {status === 'ready' && (
        <NormalisedLineChart data={chartData} symbols={chartSymbols} height={300} />
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
    marginTop: '20px',
  },
  title: { margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#161616' },
  hint:  { fontSize: '12px', color: '#6f6f6f', display: 'block', marginBottom: '12px' },
  form:  { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  input: {
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #8d8d8d',
    borderRadius: '4px',
    minWidth: '180px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    background: '#0f62fe',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#161616',
    background: '#ffffff',
    border: '1px solid #8d8d8d',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: { color: '#6f6f6f', fontSize: '14px', padding: '20px 0', textAlign: 'center' },
  message: {
    background: '#fff1f1',
    border: '1px solid #ffb3b3',
    borderRadius: '4px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#da1e28',
  },
};
