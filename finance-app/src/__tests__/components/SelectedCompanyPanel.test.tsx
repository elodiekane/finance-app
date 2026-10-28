import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { HistoryPoint, Quote } from '../../types/finance';
import { UnsupportedSymbolError } from '../../services/errors';

const mockGetQuote   = jest.fn<Promise<Quote>, [string]>();
const mockGetHistory = jest.fn<Promise<HistoryPoint[]>, [string, string]>();

jest.mock('../../services/financeService', () => ({
  financeService: {
    getQuote:   (...a: [string])          => mockGetQuote(...a),
    getHistory: (...a: [string, string]) => mockGetHistory(...a),
  },
}));

import { SelectedCompanyPanel } from '../../components/dashboard/SelectedCompanyPanel';
import { useDashboardStore } from '../../store/dashboardStore';

function pt(symbol: string, date: string, close: number): HistoryPoint {
  return { date, symbol, open: close, high: close, low: close, close, volume: 1 };
}

const AAPL_QUOTE: Quote = {
  symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', exchange: 'NasdaqGS',
  price: 189, change: 1, changePercent: 0.5, volume: 1,
};

async function submit(symbol: string) {
  fireEvent.change(screen.getByLabelText('Company symbol'), { target: { value: symbol } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Show chart' }));
  });
}

beforeEach(() => {
  useDashboardStore.getState().clearSelectedCompany();
  useDashboardStore.setState({
    activeWindow: 'day',
    histories: { IBM: [pt('IBM', '2024-01-02', 160), pt('IBM', '2024-01-03', 164)] },
  });
  mockGetQuote.mockReset();
  mockGetHistory.mockReset();
});

describe('SelectedCompanyPanel', () => {
  it('shows the prompt and no chart initially', () => {
    render(<SelectedCompanyPanel />);
    expect(screen.getByText('Compare a Company')).toBeInTheDocument();
    expect(screen.queryByTestId('recharts-linechart')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('renders the chart and a titled heading for a valid symbol', async () => {
    mockGetQuote.mockResolvedValue(AAPL_QUOTE);
    mockGetHistory.mockResolvedValue([pt('AAPL', '2024-01-02', 100), pt('AAPL', '2024-01-03', 105)]);
    render(<SelectedCompanyPanel />);

    await submit('aapl');

    expect(screen.getByText('AAPL — Apple Inc. vs IBM · Today')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-linechart')).toBeInTheDocument();
  });

  it('shows a clear no-data message for an unsupported symbol and draws no chart', async () => {
    mockGetQuote.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));
    mockGetHistory.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));
    render(<SelectedCompanyPanel />);

    await submit('zzzz');

    expect(screen.getByRole('alert')).toHaveTextContent('No data available for "ZZZZ"');
    expect(screen.queryByTestId('recharts-linechart')).not.toBeInTheDocument();
  });

  it('shows a validation message for malformed input without calling the service', async () => {
    render(<SelectedCompanyPanel />);

    await submit('A B!');

    expect(screen.getByRole('alert')).toHaveTextContent('not a valid symbol');
    expect(mockGetQuote).not.toHaveBeenCalled();
  });

  it('Clear removes the chart and message and empties the input', async () => {
    mockGetQuote.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));
    mockGetHistory.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));
    render(<SelectedCompanyPanel />);
    await submit('zzzz');

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Company symbol')).toHaveValue('');
  });

  it('reloads the selected company when the time window changes', async () => {
    mockGetQuote.mockResolvedValue(AAPL_QUOTE);
    mockGetHistory.mockResolvedValue([pt('AAPL', '2024-01-02', 100), pt('AAPL', '2024-01-03', 105)]);
    render(<SelectedCompanyPanel />);
    await submit('AAPL');

    await act(async () => {
      useDashboardStore.getState().setWindow('quarter');
    });

    expect(mockGetHistory).toHaveBeenLastCalledWith('AAPL', 'quarter');
    expect(screen.getByText('AAPL — Apple Inc. vs IBM · Last Quarter')).toBeInTheDocument();
  });
});
