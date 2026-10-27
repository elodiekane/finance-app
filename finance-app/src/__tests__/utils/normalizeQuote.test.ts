import { normalizeQuote, normalizeHistory, normaliseDateValue } from '../../utils/normalizeQuote';

// ─── normaliseDateValue ───────────────────────────────────────────────────────

describe('normaliseDateValue', () => {
  it('returns a Date object as a local YYYY-MM-DD string', () => {
    // Construct a local-time date so the result is timezone-independent
    const d = new Date(2024, 2, 15); // March 15 2024, local time
    expect(normaliseDateValue(d)).toBe('2024-03-15');
  });

  it('preserves a plain YYYY-MM-DD string unchanged', () => {
    expect(normaliseDateValue('2024-03-15')).toBe('2024-03-15');
  });

  it('converts an epoch number using local calendar', () => {
    // Build a known local-midnight epoch value
    const d    = new Date(2024, 2, 15);
    const epoch = d.getTime();
    expect(normaliseDateValue(epoch)).toBe('2024-03-15');
  });

  it('returns empty string for an unrecognised value', () => {
    expect(normaliseDateValue(null)).toBe('');
    expect(normaliseDateValue(undefined)).toBe('');
  });
});

// ─── normalizeQuote ───────────────────────────────────────────────────────────

describe('normalizeQuote', () => {
  const fullRaw = {
    shortName:                  'International Business Machines',
    currency:                   'USD',
    fullExchangeName:           'NYSE',
    regularMarketPrice:         171.20,
    regularMarketChange:        2.35,
    regularMarketChangePercent: 1.39,
    regularMarketOpen:          169.10,
    regularMarketDayHigh:       172.50,
    regularMarketDayLow:        168.80,
    regularMarketPreviousClose: 168.85,
    regularMarketVolume:        4_200_000,
    regularMarketTime:          1_710_000_000,
    averageDailyVolume3Month:   4_500_000,
    marketCap:                  155_000_000_000,
    fiftyTwoWeekHigh:           199.18,
    fiftyTwoWeekLow:            122.51,
  };

  it('maps all standard fields correctly', () => {
    const q = normalizeQuote('IBM', fullRaw);

    expect(q.symbol).toBe('IBM');
    expect(q.name).toBe('International Business Machines');
    expect(q.currency).toBe('USD');
    expect(q.exchange).toBe('NYSE');
    expect(q.price).toBe(171.20);
    expect(q.change).toBe(2.35);
    expect(q.changePercent).toBe(1.39);
    expect(q.open).toBe(169.10);
    expect(q.dayHigh).toBe(172.50);
    expect(q.dayLow).toBe(168.80);
    expect(q.previousClose).toBe(168.85);
    expect(q.volume).toBe(4_200_000);
    expect(q.avgVolume).toBe(4_500_000);
    expect(q.marketCap).toBe(155_000_000_000);
    expect(q.fiftyTwoWeekHigh).toBe(199.18);
    expect(q.fiftyTwoWeekLow).toBe(122.51);
    // Yahoo returns Unix seconds; service stores ms
    expect(q.updatedAt).toBe(1_710_000_000 * 1000);
  });

  it('falls back to symbol when name fields are absent', () => {
    expect(normalizeQuote('XYZ', { regularMarketPrice: 50 }).name).toBe('XYZ');
  });

  it('defaults currency to USD and exchange to empty string when absent', () => {
    const q = normalizeQuote('XYZ', { regularMarketPrice: 50 });
    expect(q.currency).toBe('USD');
    expect(q.exchange).toBe('');
  });

  it('leaves optional fields undefined when absent', () => {
    const q = normalizeQuote('XYZ', { regularMarketPrice: 50 });
    expect(q.marketCap).toBeUndefined();
    expect(q.dayHigh).toBeUndefined();
    expect(q.dayLow).toBeUndefined();
    expect(q.previousClose).toBeUndefined();
    expect(q.fiftyTwoWeekHigh).toBeUndefined();
    expect(q.fiftyTwoWeekLow).toBeUndefined();
    expect(q.updatedAt).toBeUndefined();
  });

  it('coerces numeric string values', () => {
    const q = normalizeQuote('IBM', {
      regularMarketPrice: '171.20',
      regularMarketChange: '2.35',
      regularMarketChangePercent: '1.39',
      regularMarketVolume: '4200000',
    });
    expect(q.price).toBe(171.20);
    expect(q.change).toBe(2.35);
  });
});

// ─── normalizeHistory ─────────────────────────────────────────────────────────

describe('normalizeHistory', () => {
  it('maps OHLCV fields and returns sorted rows', () => {
    const rows = [
      { date: '2024-03-15', open: 169, high: 173, low: 168, close: 171, adjClose: 171, volume: 4_000_000 },
      { date: '2024-03-14', open: 167, high: 170, low: 166, close: 169, adjClose: 169, volume: 3_800_000 },
    ];

    const result = normalizeHistory('IBM', rows);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2024-03-14');  // sorted ascending
    expect(result[1].date).toBe('2024-03-15');
    expect(result[0].open).toBe(167);
    expect(result[0].high).toBe(170);
    expect(result[0].low).toBe(166);
    expect(result[0].close).toBe(169);
    expect(result[0].adjClose).toBe(169);
    expect(result[0].volume).toBe(3_800_000);
    expect(result[0].symbol).toBe('IBM');
  });

  it('handles Date objects from yahoo-finance2', () => {
    const d = new Date(2024, 2, 15);  // March 15, local time
    const rows = [{ date: d, open: 169, high: 173, low: 168, close: 171, volume: 4_000_000 }];
    const result = normalizeHistory('IBM', rows as unknown as Array<Record<string, unknown>>);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-03-15');
  });

  it('accepts capital-D Date field from raw Yahoo Finance object', () => {
    const rows = [{ Date: '2024-03-15', close: 171, open: 169, high: 173, low: 168, volume: 4_000_000 }];
    const result = normalizeHistory('IBM', rows);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-03-15');
  });

  it('filters out rows with zero or missing close', () => {
    const rows = [
      { date: '2024-03-15', open: 169, high: 173, low: 168, close: 171, volume: 4_000_000 },
      { date: '2024-03-16', open: 0,   high: 0,   low: 0,  close: 0,   volume: 0 },
      { date: '2024-03-17' },  // no close at all
    ];
    const result = normalizeHistory('IBM', rows);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-03-15');
  });

  it('returns empty array for empty input', () => {
    expect(normalizeHistory('IBM', [])).toHaveLength(0);
  });
});
