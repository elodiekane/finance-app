import { create } from 'zustand';
import type {
  Ticker,
  TimeWindow,
  QuoteMap,
  HistoryMap,
  ErrorMap,
  HistoryPoint,
  SelectedStatus,
} from '../types/finance';
import { DEFAULT_TICKERS } from '../constants';
import { financeService } from '../services/financeService';
import { UnsupportedSymbolError } from '../services/errors';
import { normalizeSymbol } from '../utils/symbolValidation';

interface DashboardState {
  // ── Data ──────────────────────────────────────────────────────────────────
  tickers:      Ticker[];
  activeWindow: TimeWindow;
  quotes:       QuoteMap;
  histories:    HistoryMap;
  loadingKeys:  string[];
  errors:       ErrorMap;

  // ── User-selected company (isolated from the shared maps above) ───────────
  selectedSymbol:  string | null;
  selectedName:    string | null;
  selectedHistory: HistoryPoint[];
  selectedStatus:  SelectedStatus;
  selectedMessage: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setWindow:      (w: TimeWindow)  => void;
  fetchQuotes:    ()               => Promise<void>;
  fetchHistories: ()               => Promise<void>;
  /** Phase 2: add a user-selected ticker */
  addTicker:      (ticker: Ticker) => void;
  removeTicker:   (symbol: string) => void;
  clearError:     (symbol: string) => void;
  /** Validate and load a user-entered company symbol for the active window */
  selectCompany:  (rawSymbol: string) => Promise<void>;
  /** Reload the selected company's history (e.g. after the window changes) */
  refreshSelectedCompany: () => Promise<void>;
  clearSelectedCompany:   () => void;
}

const NO_SELECTION = {
  selectedSymbol:  null,
  selectedName:    null,
  selectedHistory: [] as HistoryPoint[],
  selectedStatus:  'idle' as SelectedStatus,
  selectedMessage: null,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  tickers:      DEFAULT_TICKERS,
  activeWindow: 'day',
  quotes:       {},
  histories:    {},
  loadingKeys:  [],
  errors:       {},
  ...NO_SELECTION,

  setWindow(w) {
    set({ activeWindow: w });
  },

  async fetchQuotes() {
    const { tickers } = get();
    set({ loadingKeys: tickers.map(t => t.symbol) });

    const results = await Promise.allSettled(
      tickers.map(t => financeService.getQuote(t.symbol)),
    );

    const quotes: QuoteMap = { ...get().quotes };
    const errors: ErrorMap = { ...get().errors };

    results.forEach((result, i) => {
      const symbol = tickers[i].symbol;
      if (result.status === 'fulfilled') {
        quotes[symbol] = result.value;
        delete errors[symbol];
      } else {
        errors[symbol] =
          result.reason instanceof Error
            ? result.reason.message
            : 'Failed to load quote';
      }
    });

    set({ quotes, errors, loadingKeys: [] });
  },

  async fetchHistories() {
    const { tickers, activeWindow } = get();
    set({ loadingKeys: tickers.map(t => t.symbol) });

    const results = await Promise.allSettled(
      tickers.map(t => financeService.getHistory(t.symbol, activeWindow)),
    );

    const histories: HistoryMap = { ...get().histories };
    const errors: ErrorMap      = { ...get().errors };

    results.forEach((result, i) => {
      const symbol = tickers[i].symbol;
      if (result.status === 'fulfilled') {
        histories[symbol] = result.value;
        delete errors[symbol];
      } else {
        errors[symbol] =
          result.reason instanceof Error
            ? result.reason.message
            : 'Failed to load history';
      }
    });

    set({ histories, errors, loadingKeys: [] });
  },

  addTicker(ticker) {
    const { tickers } = get();
    if (tickers.some(t => t.symbol === ticker.symbol)) return;
    set({ tickers: [...tickers, ticker] });
  },

  removeTicker(symbol) {
    set(state => ({
      tickers: state.tickers.filter(t => t.symbol !== symbol),
    }));
  },

  clearError(symbol) {
    set(state => {
      const errors = { ...state.errors };
      delete errors[symbol];
      return { errors };
    });
  },

  async selectCompany(rawSymbol) {
    const parsed = normalizeSymbol(rawSymbol);
    if (!parsed.ok) {
      set({ ...NO_SELECTION, selectedStatus: 'error', selectedMessage: parsed.message });
      return;
    }

    const { symbol } = parsed;
    if (get().tickers.some(t => t.symbol === symbol)) {
      set({
        ...NO_SELECTION,
        selectedSymbol:  symbol,
        selectedStatus:  'error',
        selectedMessage: `${symbol} is already shown on the dashboard.`,
      });
      return;
    }

    set({ ...NO_SELECTION, selectedSymbol: symbol, selectedStatus: 'loading' });
    await loadSelected(symbol, get, set);
  },

  async refreshSelectedCompany() {
    const { selectedSymbol, selectedStatus } = get();
    // Reload only a real selection; invalid-input / duplicate errors have nothing to fetch.
    const reloadable = ['ready', 'no-data', 'loading'];
    if (!selectedSymbol || !reloadable.includes(selectedStatus)) return;
    set({ selectedStatus: 'loading', selectedMessage: null });
    await loadSelected(selectedSymbol, get, set);
  },

  clearSelectedCompany() {
    set({ ...NO_SELECTION });
  },
}));

/**
 * Fetch quote + history for the selected symbol and write the outcome.
 * Results are dropped if the user selected something else (or cleared) while
 * the request was in flight, so a slow response never overwrites a newer one.
 * Data is only ever stored for `symbol` — no fallback to another company.
 */
async function loadSelected(
  symbol: string,
  get: () => DashboardState,
  set: (partial: Partial<DashboardState>) => void,
): Promise<void> {
  const window = get().activeWindow;
  const isCurrent = () =>
    get().selectedSymbol === symbol && get().activeWindow === window;

  try {
    const [quote, history] = await Promise.all([
      financeService.getQuote(symbol),
      financeService.getHistory(symbol, window),
    ]);
    if (!isCurrent()) return;

    if (history.length === 0) {
      set({
        selectedHistory: [],
        selectedName:    quote.name,
        selectedStatus:  'no-data',
        selectedMessage: `No price data is available for ${symbol} in this time window.`,
      });
      return;
    }
    set({
      selectedHistory: history,
      selectedName:    quote.name,
      selectedStatus:  'ready',
      selectedMessage: null,
    });
  } catch (err) {
    if (!isCurrent()) return;

    if (err instanceof UnsupportedSymbolError) {
      set({
        selectedHistory: [],
        selectedStatus:  'no-data',
        selectedMessage: `No data available for "${symbol}". Check the symbol and try again.`,
      });
    } else {
      set({
        selectedHistory: [],
        selectedStatus:  'error',
        selectedMessage: `Could not load data for ${symbol}. Please try again.`,
      });
    }
  }
}
