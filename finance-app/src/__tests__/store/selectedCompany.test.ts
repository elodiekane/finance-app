/**
 * Selected-company slice tests.
 * financeService is stubbed so results are deterministic.
 */

import type { Quote, HistoryPoint } from '../../types/finance';
import { UnsupportedSymbolError } from '../../services/errors';

const mockGetQuote   = jest.fn<Promise<Quote>, [string]>();
const mockGetHistory = jest.fn<Promise<HistoryPoint[]>, [string, string]>();

jest.mock('../../services/financeService', () => ({
  financeService: {
    getQuote:   (...a: [string])          => mockGetQuote(...a),
    getHistory: (...a: [string, string]) => mockGetHistory(...a),
  },
}));

import { useDashboardStore } from '../../store/dashboardStore';
import { DEFAULT_TICKERS } from '../../constants';

const AAPL_QUOTE: Quote = {
  symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', exchange: 'NasdaqGS',
  price: 189, change: 1, changePercent: 0.5, volume: 1,
};
const AAPL_HISTORY: HistoryPoint[] = [
  { date: '2024-01-02', symbol: 'AAPL', open: 1, high: 2, low: 1, close: 100, volume: 1 },
  { date: '2024-01-03', symbol: 'AAPL', open: 1, high: 2, low: 1, close: 105, volume: 1 },
];

const getState = () => useDashboardStore.getState();

beforeEach(() => {
  useDashboardStore.getState().clearSelectedCompany();
  useDashboardStore.setState({ activeWindow: 'day', tickers: DEFAULT_TICKERS });
  mockGetQuote.mockReset();
  mockGetHistory.mockReset();
});

describe('selectCompany', () => {
  it('loads quote and history and reaches ready', async () => {
    mockGetQuote.mockResolvedValue(AAPL_QUOTE);
    mockGetHistory.mockResolvedValue(AAPL_HISTORY);

    await getState().selectCompany(' aapl ');

    expect(mockGetQuote).toHaveBeenCalledWith('AAPL');
    expect(mockGetHistory).toHaveBeenCalledWith('AAPL', 'day');
    expect(getState().selectedStatus).toBe('ready');
    expect(getState().selectedSymbol).toBe('AAPL');
    expect(getState().selectedName).toBe('Apple Inc.');
    expect(getState().selectedHistory).toEqual(AAPL_HISTORY);
  });

  it('rejects invalid input without calling the service', async () => {
    await getState().selectCompany('AA PL!');

    expect(mockGetQuote).not.toHaveBeenCalled();
    expect(getState().selectedStatus).toBe('error');
    expect(getState().selectedMessage).toMatch(/not a valid symbol/);
  });

  it('rejects empty input', async () => {
    await getState().selectCompany('');
    expect(getState().selectedStatus).toBe('error');
    expect(getState().selectedMessage).toMatch(/enter a company symbol/i);
  });

  it('tells the user when the symbol is already on the dashboard', async () => {
    await getState().selectCompany('msft');

    expect(mockGetQuote).not.toHaveBeenCalled();
    expect(getState().selectedStatus).toBe('error');
    expect(getState().selectedMessage).toBe('MSFT is already shown on the dashboard.');
    expect(getState().selectedHistory).toEqual([]);
  });

  it('shows no-data for an unsupported symbol and stores no data', async () => {
    mockGetQuote.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));
    mockGetHistory.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));

    await getState().selectCompany('zzzz');

    expect(getState().selectedStatus).toBe('no-data');
    expect(getState().selectedMessage).toContain('ZZZZ');
    expect(getState().selectedHistory).toEqual([]);
    expect(getState().selectedName).toBeNull();
  });

  it('shows no-data when history is empty, never another company', async () => {
    mockGetQuote.mockResolvedValue(AAPL_QUOTE);
    mockGetHistory.mockResolvedValue([]);

    await getState().selectCompany('AAPL');

    expect(getState().selectedStatus).toBe('no-data');
    expect(getState().selectedHistory).toEqual([]);
    expect(getState().selectedMessage).toMatch(/no price data/i);
  });

  it('shows a retry message for transient failures', async () => {
    mockGetQuote.mockRejectedValue(new Error('network down'));
    mockGetHistory.mockRejectedValue(new Error('network down'));

    await getState().selectCompany('AAPL');

    expect(getState().selectedStatus).toBe('error');
    expect(getState().selectedMessage).toMatch(/could not load data for AAPL/i);
  });

  it('ignores a stale response when a newer symbol was selected', async () => {
    let resolveSlow!: (h: HistoryPoint[]) => void;
    mockGetQuote.mockImplementation(async s => ({ ...AAPL_QUOTE, symbol: s, name: s }));
    mockGetHistory.mockImplementation(s =>
      s === 'AAPL'
        ? new Promise<HistoryPoint[]>(r => { resolveSlow = r; })
        : Promise.resolve([{ ...AAPL_HISTORY[0], symbol: 'NVDA' }]),
    );

    const first = getState().selectCompany('AAPL');
    await getState().selectCompany('NVDA');
    resolveSlow(AAPL_HISTORY);
    await first;

    expect(getState().selectedSymbol).toBe('NVDA');
    expect(getState().selectedHistory.every(p => p.symbol === 'NVDA')).toBe(true);
  });
});

describe('refreshSelectedCompany', () => {
  it('reloads the selected symbol for the new window', async () => {
    mockGetQuote.mockResolvedValue(AAPL_QUOTE);
    mockGetHistory.mockResolvedValue(AAPL_HISTORY);
    await getState().selectCompany('AAPL');

    useDashboardStore.setState({ activeWindow: '7d' });
    await getState().refreshSelectedCompany();

    expect(mockGetHistory).toHaveBeenLastCalledWith('AAPL', '7d');
    expect(getState().selectedStatus).toBe('ready');
  });

  it('does nothing when no company is selected', async () => {
    await getState().refreshSelectedCompany();
    expect(mockGetHistory).not.toHaveBeenCalled();
    expect(getState().selectedStatus).toBe('idle');
  });

  it('does nothing after an invalid-input error', async () => {
    await getState().selectCompany('!!');
    await getState().refreshSelectedCompany();
    expect(mockGetHistory).not.toHaveBeenCalled();
    expect(getState().selectedStatus).toBe('error');
  });
});

describe('clearSelectedCompany', () => {
  it('resets the slice to idle', async () => {
    mockGetQuote.mockResolvedValue(AAPL_QUOTE);
    mockGetHistory.mockResolvedValue(AAPL_HISTORY);
    await getState().selectCompany('AAPL');

    getState().clearSelectedCompany();

    expect(getState().selectedStatus).toBe('idle');
    expect(getState().selectedSymbol).toBeNull();
    expect(getState().selectedHistory).toEqual([]);
  });
});

describe('isolation from the existing dashboards', () => {
  it('never touches tickers, histories, quotes, errors or loadingKeys', async () => {
    const before = {
      tickers:     getState().tickers,
      histories:   getState().histories,
      quotes:      getState().quotes,
      errors:      getState().errors,
      loadingKeys: getState().loadingKeys,
    };

    mockGetQuote.mockResolvedValue(AAPL_QUOTE);
    mockGetHistory.mockResolvedValue(AAPL_HISTORY);
    await getState().selectCompany('AAPL');
    mockGetQuote.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));
    mockGetHistory.mockRejectedValue(new UnsupportedSymbolError('ZZZZ'));
    await getState().selectCompany('ZZZZ');
    getState().clearSelectedCompany();

    expect(getState().tickers).toBe(before.tickers);
    expect(getState().histories).toBe(before.histories);
    expect(getState().quotes).toBe(before.quotes);
    expect(getState().errors).toBe(before.errors);
    expect(getState().loadingKeys).toBe(before.loadingKeys);
    expect(getState().tickers.map(t => t.symbol)).toEqual(['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']);
  });
});
