export type TimeWindow = 'day' | '7d' | 'quarter';

export interface Ticker {
  symbol: string;
  name:   string;
}

// ─── Quote ────────────────────────────────────────────────────────────────────

export interface Quote {
  symbol:        string;
  name:          string;
  currency:      string;        // e.g. "USD"
  exchange:      string;        // e.g. "NYSE"
  price:         number;
  change:        number;
  changePercent: number;
  volume:        number;
  avgVolume?:    number;
  marketCap?:    number;
  dayHigh?:      number;
  dayLow?:       number;
  previousClose?: number;
  open?:         number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?:  number;
  /** Timestamp of the last price update (ms since epoch) */
  updatedAt?:    number;
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryPoint {
  /** ISO date string e.g. "2024-03-15" */
  date:    string;
  symbol:  string;
  open:    number;
  high:    number;
  low:     number;
  close:   number;
  /** Adjusted close — accounts for splits and dividends */
  adjClose?: number;
  volume:  number;
}

// ─── Convenience maps ─────────────────────────────────────────────────────────

export type QuoteMap   = Record<string, Quote>;
export type HistoryMap = Record<string, HistoryPoint[]>;
export type ErrorMap   = Record<string, string>;

// ─── User-selected company ────────────────────────────────────────────────────

/**
 * idle     – nothing selected
 * loading  – fetching quote + history
 * ready    – data available, chart shown
 * no-data  – symbol unknown or returned no data (never substituted with another company)
 * error    – invalid input or a transient failure (network, rate limit)
 */
export type SelectedStatus = 'idle' | 'loading' | 'ready' | 'no-data' | 'error';

