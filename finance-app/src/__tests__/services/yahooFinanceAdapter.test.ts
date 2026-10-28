import { yahooGetQuote, yahooGetHistory } from '../../services/yahooFinanceAdapter';
import { UnsupportedSymbolError } from '../../services/errors';

function mockFetch(status: number, body: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok:     status >= 200 && status < 300,
    status,
    json:   async () => body,
  }) as unknown as typeof fetch;
}

describe('yahooFinanceAdapter error mapping', () => {
  it('maps a 404 quote response to UnsupportedSymbolError', async () => {
    mockFetch(404, { error: 'No data for symbol ZZZZ' });
    await expect(yahooGetQuote('zzzz')).rejects.toBeInstanceOf(UnsupportedSymbolError);
  });

  it('maps a 404 history response to UnsupportedSymbolError', async () => {
    mockFetch(404, { error: 'No data for symbol ZZZZ' });
    await expect(yahooGetHistory('zzzz', '7d')).rejects.toBeInstanceOf(UnsupportedSymbolError);
  });

  it('keeps other failures as generic errors', async () => {
    mockFetch(502, { error: 'upstream down' });
    const err = await yahooGetQuote('AAPL').catch(e => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(UnsupportedSymbolError);
    expect(err.message).toContain('upstream down');
  });
});
