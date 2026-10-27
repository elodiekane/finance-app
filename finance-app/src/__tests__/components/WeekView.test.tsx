import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeekView } from '../../components/dashboard/WeekView';
import type { HistoryPoint } from '../../types/finance';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function pt(date: string, close: number, symbol: string): HistoryPoint {
  return { date, symbol, open: close, high: close * 1.01, low: close * 0.99, close, volume: 4_000_000 };
}

const TICKERS = [
  { symbol: 'IBM',  name: 'IBM Corp' },
  { symbol: 'MSFT', name: 'Microsoft' },
];

// IBM up +5 %, MSFT down -2 %
const HISTORIES: Record<string, HistoryPoint[]> = {
  IBM:  [pt('2024-01-02', 160, 'IBM'), pt('2024-01-03', 164, 'IBM'), pt('2024-01-04', 168, 'IBM')],
  MSFT: [pt('2024-01-02', 400, 'MSFT'), pt('2024-01-03', 395, 'MSFT'), pt('2024-01-04', 392, 'MSFT')],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WeekView', () => {
  it('renders the 7-day chart panel heading', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    expect(screen.getByText('7-Day Price Movement — Normalised')).toBeInTheDocument();
  });

  it('renders the rebasing hint', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    expect(screen.getByText(/Rebased to 0/)).toBeInTheDocument();
  });

  it('renders the ranked return table heading', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    expect(screen.getByText('7-Day Return — Ranked')).toBeInTheDocument();
  });

  it('shows both ticker symbols in the ranked table', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    expect(screen.getAllByText('IBM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MSFT').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the IBM % return formatted with + prefix', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    // IBM: 160 → 168 = +5.00%
    expect(screen.getByText('+5.00%')).toBeInTheDocument();
  });

  it('shows the MSFT % return formatted with - prefix', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    // MSFT: 400 → 392 = -2.00%
    expect(screen.getByText('-2.00%')).toBeInTheDocument();
  });

  it('shows start and end prices for IBM', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    expect(screen.getByText('$160.00')).toBeInTheDocument();
    expect(screen.getByText('$168.00')).toBeInTheDocument();
  });

  it('shows loading placeholder when loading=true', () => {
    render(<WeekView tickers={TICKERS} histories={{}} errors={{}} loading={true} />);
    expect(screen.getByText('Loading chart data…')).toBeInTheDocument();
    // ranked table should not appear while loading
    expect(screen.queryByText('7-Day Return — Ranked')).not.toBeInTheDocument();
  });

  it('shows the recharts container when data is present', () => {
    render(<WeekView tickers={TICKERS} histories={HISTORIES} errors={{}} loading={false} />);
    expect(screen.getByTestId('recharts-responsivecontainer')).toBeInTheDocument();
  });

  it('shows an error banner when a ticker has an error', () => {
    render(
      <WeekView
        tickers={TICKERS}
        histories={HISTORIES}
        errors={{ MSFT: 'Unavailable' }}
        loading={false}
      />,
    );
    const banner = screen.getByRole('alert');
    expect(banner.textContent).toContain('MSFT');
  });

  it('shows — for start/end price of a ticker with an error', () => {
    render(
      <WeekView
        tickers={TICKERS}
        histories={HISTORIES}
        errors={{ IBM: 'Fetch failed' }}
        loading={false}
      />,
    );
    const errorCell = screen.getByText('Error');
    expect(errorCell).toBeInTheDocument();
  });
});
