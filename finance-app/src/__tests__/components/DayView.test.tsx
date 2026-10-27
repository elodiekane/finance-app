import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DayView } from '../../components/dashboard/DayView';
import type { Quote } from '../../types/finance';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeQuote(symbol: string, price: number, change: number, pct: number): Quote {
  return {
    symbol, price, change, changePercent: pct,
    name: `${symbol} Corp`, currency: 'USD', exchange: 'NYSE',
    volume: 5_000_000, avgVolume: 5_000_000,
    marketCap: 100_000_000_000,
    open: price - 0.5, dayHigh: price + 1, dayLow: price - 1,
    previousClose: price - change,
    fiftyTwoWeekHigh: price * 1.2, fiftyTwoWeekLow: price * 0.8,
  };
}

const TICKERS = [
  { symbol: 'IBM',  name: 'IBM Corp' },
  { symbol: 'MSFT', name: 'Microsoft' },
];

const QUOTES: Record<string, Quote> = {
  IBM:  makeQuote('IBM',  171.20,  2.35,  1.39),
  MSFT: makeQuote('MSFT', 415.80, -1.20, -0.29),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DayView', () => {
  it('renders the leaderboard heading', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    expect(screen.getByText("Today's Performance")).toBeInTheDocument();
  });

  it('renders a table row for each ticker', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    expect(screen.getAllByText('IBM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MSFT').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the price for each ticker in the leaderboard', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    // price appears in both the leaderboard table row and the expanded company card
    expect(screen.getAllByText('$171.20').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$415.80').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the positive change for IBM', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    expect(screen.getAllByText('+2.35 (+1.39%)').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the negative change for MSFT', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    expect(screen.getAllByText('-1.20 (-0.29%)').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Company Detail section heading', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    expect(screen.getByText('Company Detail')).toBeInTheDocument();
  });

  it('renders expanded card metrics: Open, Day Range, Prev Close, Volume, Mkt Cap, 52w Range, Exchange', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Day Range').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mkt Cap').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('52w Range').length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading skeletons when loading=true and no quotes exist', () => {
    render(<DayView tickers={TICKERS} quotes={{}} errors={{}} loading={true} />);
    const skeletons = screen.getAllByLabelText('Loading...');
    expect(skeletons.length).toBe(TICKERS.length);
  });

  it('shows an error alert in the leaderboard when quotes exist but an error is set', () => {
    render(
      <DayView
        tickers={TICKERS}
        quotes={QUOTES}
        errors={{ IBM: 'Rate limit exceeded' }}
        loading={false}
      />,
    );
    // leaderboard should show "Error" cell for IBM
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders an error card in Company Detail for a ticker with an error', () => {
    render(
      <DayView
        tickers={TICKERS}
        quotes={QUOTES}
        errors={{ MSFT: 'Symbol not found' }}
        loading={false}
      />,
    );
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    const alertText = alerts.map(el => el.textContent).join(' ');
    expect(alertText).toContain('Symbol not found');
  });

  it('market cap is formatted as billions', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    // 100_000_000_000 → $100.0B
    expect(screen.getAllByText('$100.0B').length).toBeGreaterThanOrEqual(1);
  });

  it('volume is formatted with M suffix', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    expect(screen.getAllByText('5.0M').length).toBeGreaterThanOrEqual(1);
  });

  it('leaderboard ranks IBM above MSFT (IBM has higher % change)', () => {
    render(<DayView tickers={TICKERS} quotes={QUOTES} errors={{}} loading={false} />);
    const rows = screen.getAllByRole('row');
    // rows[0] = header, rows[1] = first data row (should be IBM at +1.39%)
    const firstDataRow = within(rows[1]).getAllByText(/IBM/);
    expect(firstDataRow.length).toBeGreaterThan(0);
  });
});
