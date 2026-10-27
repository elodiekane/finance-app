import { mockGetQuote, mockGetHistory, MOCK_SUPPORTED_SYMBOLS, _MOCK_QUOTES } from '../../services/mockData';

describe('mockGetQuote', () => {
  it('returns a valid Quote for IBM', async () => {
    const q = await mockGetQuote('IBM');

    expect(q.symbol).toBe('IBM');
    expect(q.price).toBeGreaterThan(0);
    expect(typeof q.change).toBe('number');
    expect(typeof q.changePercent).toBe('number');
    expect(q.volume).toBeGreaterThan(0);
  });

  it('returns new fields: currency, exchange, 52-week range', async () => {
    const q = await mockGetQuote('IBM');

    expect(q.currency).toBe('USD');
    expect(q.exchange).toBe('NYSE');
    expect(q.fiftyTwoWeekHigh).toBeGreaterThan(0);
    expect(q.fiftyTwoWeekLow).toBeGreaterThan(0);
    expect(q.fiftyTwoWeekHigh!).toBeGreaterThan(q.fiftyTwoWeekLow!);
    expect(q.open).toBeGreaterThan(0);
    expect(q.avgVolume).toBeGreaterThan(0);
  });

  it('is case-insensitive for ticker lookup', async () => {
    const q = await mockGetQuote('ibm');
    expect(q.symbol).toBe('IBM');
  });

  it('throws for an unknown ticker', async () => {
    await expect(mockGetQuote('UNKNOWN_XYZ')).rejects.toThrow('Unknown ticker');
  });

  it('returns quotes for all default tickers', async () => {
    const symbols = Array.from(MOCK_SUPPORTED_SYMBOLS);
    const quotes  = await Promise.all(symbols.map(s => mockGetQuote(s)));
    expect(quotes).toHaveLength(symbols.length);
    quotes.forEach(q => {
      expect(q.price).toBeGreaterThan(0);
      expect(q.currency).toBe('USD');
    });
  });

  it('mock raw data covers all default tickers', () => {
    const symbols = Array.from(MOCK_SUPPORTED_SYMBOLS);
    symbols.forEach(s => expect(_MOCK_QUOTES[s]).toBeDefined());
  });
});

describe('mockGetHistory', () => {
  it('returns OHLCV HistoryPoints for IBM over 7 days', async () => {
    const history = await mockGetHistory('IBM', '7d');

    expect(history.length).toBeGreaterThan(0);
    history.forEach(pt => {
      expect(pt.symbol).toBe('IBM');
      expect(pt.close).toBeGreaterThan(0);
      expect(pt.open).toBeGreaterThan(0);
      expect(pt.high).toBeGreaterThanOrEqual(pt.close);
      expect(pt.low).toBeLessThanOrEqual(pt.close);
      expect(pt.volume).toBeGreaterThan(0);
      expect(pt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('returns more points for quarter than for 7d', async () => {
    const week    = await mockGetHistory('IBM', '7d');
    const quarter = await mockGetHistory('IBM', 'quarter');
    expect(quarter.length).toBeGreaterThan(week.length);
  });

  it('history is sorted ascending by date', async () => {
    const history = await mockGetHistory('MSFT', 'quarter');
    const dates   = history.map(pt => pt.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('skips weekends — no Saturday or Sunday dates', async () => {
    const history = await mockGetHistory('IBM', 'quarter');
    history.forEach(pt => {
      const dow = new Date(pt.date + 'T12:00:00').getDay();
      expect(dow).not.toBe(0); // Sunday
      expect(dow).not.toBe(6); // Saturday
    });
  });

  it('generates deterministic series — same result on repeated calls', async () => {
    const first  = await mockGetHistory('ORCL', '7d');
    const second = await mockGetHistory('ORCL', '7d');
    expect(first.map(p => p.close)).toEqual(second.map(p => p.close));
  });

  it('throws for an unknown ticker', async () => {
    await expect(mockGetHistory('UNKNOWN_XYZ', 'day')).rejects.toThrow('Unknown ticker');
  });
});
