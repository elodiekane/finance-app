import { mockGetQuote, mockGetHistory, MOCK_SUPPORTED_SYMBOLS } from '../../services/mockData';
import { UnsupportedSymbolError } from '../../services/errors';

describe('mock adapter — user-selectable companies', () => {
  it.each(['AAPL', 'GOOGL', 'AMZN', 'NVDA'])('serves quote and history for %s', async sym => {
    const q = await mockGetQuote(sym);
    const h = await mockGetHistory(sym, '7d');
    expect(q.symbol).toBe(sym);
    expect(q.price).toBeGreaterThan(0);
    expect(h.length).toBeGreaterThan(0);
    expect(h.every(p => p.symbol === sym)).toBe(true);
  });

  it('keeps the extra companies out of the default dashboard set', () => {
    expect(Array.from(MOCK_SUPPORTED_SYMBOLS).sort()).toEqual(['CRM', 'IBM', 'MSFT', 'ORCL', 'SAP']);
  });

  it('throws UnsupportedSymbolError (message still "Unknown ticker") for unknown symbols', async () => {
    const err = await mockGetQuote('NOPE').catch(e => e);
    expect(err).toBeInstanceOf(UnsupportedSymbolError);
    expect(err.message).toContain('Unknown ticker');
    await expect(mockGetHistory('NOPE', 'day')).rejects.toBeInstanceOf(UnsupportedSymbolError);
  });
});
