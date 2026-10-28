/**
 * Thrown by a finance adapter when a symbol has no data or does not exist.
 * Lets the UI tell "no data for this symbol" apart from transient failures
 * (network down, rate limited) without parsing message strings.
 */
export class UnsupportedSymbolError extends Error {
  readonly symbol: string;

  constructor(symbol: string) {
    super(`Unknown ticker: ${symbol}`);
    this.name   = 'UnsupportedSymbolError';
    this.symbol = symbol;
  }
}
