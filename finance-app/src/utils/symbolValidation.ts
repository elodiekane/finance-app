/**
 * Validation for user-entered stock symbols (e.g. "aapl", " BRK.B ").
 * Pure and framework-free so it can be unit-tested on its own.
 */

const SYMBOL_PATTERN = /^[A-Z0-9.-]{1,10}$/;

export type SymbolResult =
  | { ok: true;  symbol: string }
  | { ok: false; message: string };

export function normalizeSymbol(raw: string): SymbolResult {
  const symbol = raw.trim().toUpperCase();
  if (symbol === '') {
    return { ok: false, message: 'Enter a company symbol, for example AAPL.' };
  }
  if (!SYMBOL_PATTERN.test(symbol)) {
    return {
      ok: false,
      message: `"${symbol}" is not a valid symbol. Use up to 10 letters, numbers, "." or "-".`,
    };
  }
  return { ok: true, symbol };
}
