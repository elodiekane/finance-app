/**
 * dashboardStore tests.
 *
 * The store imports financeService which uses import.meta.env — that is handled
 * by the globals injection in jest.config.ts (VITE_USE_MOCK='true').
 * We stub financeService directly so the store tests are deterministic and fast.
 */

import { act } from '@testing-library/react';
import type { Quote, HistoryPoint } from '../../types/finance';

// ─── Stub financeService before the store module is loaded ────────────────────

const mockGetQuote    = jest.fn<Promise<Quote>,    [string]>();
const mockGetHistory  = jest.fn<Promise<HistoryPoint[]>, [string, string]>();

jest.mock('../../services/financeService', () => ({
  financeService: {
    getQuote:           (...args: [string])          => mockGetQuote(...args),
    getHistory:         (...args: [string, string])  => mockGetHistory(...args),
    clearCache:         jest.fn(),
    invalidateQuote:    jest.fn(),
    invalidateHistory:  jest.fn(),
    _cacheSize:         jest.fn(() => ({ quotes: 0, histories: 0 })),
  },
}));

// Import the store AFTER the mock is registered
import { useDashboardStore } from '../../store/dashboardStore';

// ─── Shared fixture data ──────────────────────────────────────────────────────

const IBM_QUOTE: Quote = {
  symbol: 'IBM', name: 'IBM', currency: 'USD', exchange: 'NYSE',
  price: 171.20, change: 2.35, changePercent: 1.39, volume: 4_200_000,
};

const IBM_HISTORY: HistoryPoint[] = [
  { date: '2024-01-02', symbol: 'IBM', open: 160, high: 165, low: 158, close: 162, volume: 4_000_000 },
  { date: '2024-01-03', symbol: 'IBM', open: 162, high: 168, low: 161, close: 166, volume: 4_200_000 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get a fresh store state without re-importing (Zustand stores are singletons). */
function getState() {
  return useDashboardStore.getState();
}

beforeEach(() => {
  // Reset to default state between tests
  useDashboardStore.setState({
    tickers:      [{ symbol: 'IBM', name: 'IBM' }, { symbol: 'MSFT', name: 'Microsoft' }],
    activeWindow: 'day',
    quotes:       {},
    histories:    {},
    loadingKeys:  [],
    errors:       {},
  });
  mockGetQuote.mockReset();
  mockGetHistory.mockReset();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('dashboardStore — setWindow', () => {
  it('updates activeWindow', () => {
    getState().setWindow('7d');
    expect(getState().activeWindow).toBe('7d');
  });

  it('cycles through all windows', () => {
    getState().setWindow('quarter');
    expect(getState().activeWindow).toBe('quarter');
    getState().setWindow('day');
    expect(getState().activeWindow).toBe('day');
  });
});

describe('dashboardStore — addTicker / removeTicker', () => {
  it('addTicker appends a new ticker', () => {
    getState().addTicker({ symbol: 'ORCL', name: 'Oracle' });
    const symbols = getState().tickers.map(t => t.symbol);
    expect(symbols).toContain('ORCL');
  });

  it('addTicker is idempotent — does not add duplicates', () => {
    getState().addTicker({ symbol: 'IBM', name: 'IBM' });
    const ibmCount = getState().tickers.filter(t => t.symbol === 'IBM').length;
    expect(ibmCount).toBe(1);
  });

  it('removeTicker removes the ticker by symbol', () => {
    getState().removeTicker('MSFT');
    const symbols = getState().tickers.map(t => t.symbol);
    expect(symbols).not.toContain('MSFT');
  });

  it('removeTicker leaves other tickers intact', () => {
    getState().removeTicker('MSFT');
    expect(getState().tickers.map(t => t.symbol)).toContain('IBM');
  });
});

describe('dashboardStore — clearError', () => {
  it('removes the error for the given symbol', () => {
    useDashboardStore.setState({ errors: { IBM: 'timeout', MSFT: 'rate limit' } });
    getState().clearError('IBM');
    expect(getState().errors.IBM).toBeUndefined();
    expect(getState().errors.MSFT).toBe('rate limit');
  });
});

describe('dashboardStore — fetchQuotes', () => {
  it('populates quotes on success', async () => {
    mockGetQuote.mockResolvedValue(IBM_QUOTE);

    await act(async () => {
      await getState().fetchQuotes();
    });

    expect(getState().quotes.IBM).toEqual(IBM_QUOTE);
    expect(getState().quotes.MSFT).toEqual(IBM_QUOTE); // same mock return
    expect(getState().loadingKeys).toHaveLength(0);
  });

  it('sets an error when a fetch fails', async () => {
    mockGetQuote
      .mockResolvedValueOnce(IBM_QUOTE)             // IBM succeeds
      .mockRejectedValueOnce(new Error('timeout')); // MSFT fails

    await act(async () => {
      await getState().fetchQuotes();
    });

    expect(getState().quotes.IBM).toEqual(IBM_QUOTE);
    expect(getState().errors.MSFT).toBe('timeout');
    expect(getState().loadingKeys).toHaveLength(0);
  });

  it('clears a previous error when the fetch succeeds on retry', async () => {
    useDashboardStore.setState({ errors: { IBM: 'old error' } });
    mockGetQuote.mockResolvedValue(IBM_QUOTE);

    await act(async () => {
      await getState().fetchQuotes();
    });

    expect(getState().errors.IBM).toBeUndefined();
  });

  it('sets loadingKeys to all ticker symbols while fetching', async () => {
    let capturedKeys: string[] = [];
    mockGetQuote.mockImplementation(async (_sym) => {
      capturedKeys = [...getState().loadingKeys];
      return IBM_QUOTE;
    });

    await act(async () => {
      await getState().fetchQuotes();
    });

    expect(capturedKeys).toContain('IBM');
    expect(capturedKeys).toContain('MSFT');
    expect(getState().loadingKeys).toHaveLength(0); // cleared after fetch
  });
});

describe('dashboardStore — fetchHistories', () => {
  it('populates histories for the active window on success', async () => {
    mockGetHistory.mockResolvedValue(IBM_HISTORY);
    getState().setWindow('7d');

    await act(async () => {
      await getState().fetchHistories();
    });

    expect(getState().histories.IBM).toEqual(IBM_HISTORY);
    expect(getState().loadingKeys).toHaveLength(0);
  });

  it('stores an error when history fetch fails', async () => {
    mockGetHistory
      .mockResolvedValueOnce(IBM_HISTORY)
      .mockRejectedValueOnce(new Error('network error'));

    await act(async () => {
      await getState().fetchHistories();
    });

    expect(getState().histories.IBM).toEqual(IBM_HISTORY);
    expect(getState().errors.MSFT).toBe('network error');
  });
});
