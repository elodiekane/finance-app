import { create } from 'zustand';
import type {
  Ticker,
  TimeWindow,
  QuoteMap,
  HistoryMap,
  ErrorMap,
} from '../types/finance';
import { DEFAULT_TICKERS } from '../constants';
import { financeService } from '../services/financeService';

interface DashboardState {
  // ── Data ──────────────────────────────────────────────────────────────────
  tickers:      Ticker[];
  activeWindow: TimeWindow;
  quotes:       QuoteMap;
  histories:    HistoryMap;
  loadingKeys:  string[];
  errors:       ErrorMap;

  // ── Actions ───────────────────────────────────────────────────────────────
  setWindow:      (w: TimeWindow)  => void;
  fetchQuotes:    ()               => Promise<void>;
  fetchHistories: ()               => Promise<void>;
  /** Phase 2: add a user-selected ticker */
  addTicker:      (ticker: Ticker) => void;
  removeTicker:   (symbol: string) => void;
  clearError:     (symbol: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  tickers:      DEFAULT_TICKERS,
  activeWindow: 'day',
  quotes:       {},
  histories:    {},
  loadingKeys:  [],
  errors:       {},

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
}));
