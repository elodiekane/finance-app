import type { Ticker, TimeWindow } from './types/finance';

export const DEFAULT_TICKERS: Ticker[] = [
  { symbol: 'IBM',  name: 'IBM' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'SAP',  name: 'SAP' },
  { symbol: 'CRM',  name: 'Salesforce' },
];

export const TIME_WINDOWS: { label: string; value: TimeWindow }[] = [
  { label: 'Today',        value: 'day' },
  { label: 'Last 7 Days',  value: '7d' },
  { label: 'Last Quarter', value: 'quarter' },
];

/** Colour assigned to each ticker for consistent chart lines */
export const TICKER_COLORS: Record<string, string> = {
  IBM:  '#0f62fe',
  MSFT: '#7c5cd8',
  ORCL: '#d4380d',
  SAP:  '#0a7c3e',
  CRM:  '#cf1322',
};
