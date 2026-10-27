import { pctReturn, quarterStats, toNormalisedRows } from '../../utils/chartMath';
import type { HistoryPoint } from '../../types/finance';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

function pt(date: string, close: number, symbol = 'IBM', extra: Partial<HistoryPoint> = {}): HistoryPoint {
  return { date, symbol, open: close, high: close * 1.01, low: close * 0.99, close, volume: 1_000_000, ...extra };
}

const IBM_SERIES: HistoryPoint[] = [
  pt('2024-01-02', 160),
  pt('2024-01-03', 164),
  pt('2024-01-04', 168),
  pt('2024-01-05', 162),
];

// ─── pctReturn ────────────────────────────────────────────────────────────────

describe('pctReturn', () => {
  it('returns the correct percentage from first to last close', () => {
    // 160 → 162 = +1.25 %
    const result = pctReturn(IBM_SERIES);
    expect(result).toBeCloseTo(1.25, 5);
  });

  it('returns null for a single-point series', () => {
    expect(pctReturn([pt('2024-01-02', 160)])).toBeNull();
  });

  it('returns null for an empty series', () => {
    expect(pctReturn([])).toBeNull();
  });

  it('returns null when first close is zero (division guard)', () => {
    const series = [pt('2024-01-02', 0), pt('2024-01-03', 100)];
    expect(pctReturn(series)).toBeNull();
  });

  it('handles a negative return', () => {
    const series = [pt('2024-01-02', 200), pt('2024-01-03', 180)];
    expect(pctReturn(series)).toBeCloseTo(-10, 5);
  });
});

// ─── quarterStats ─────────────────────────────────────────────────────────────

describe('quarterStats', () => {
  const series: HistoryPoint[] = [
    pt('2024-01-02', 160, 'IBM', { high: 165, low: 158 }),
    pt('2024-01-03', 170, 'IBM', { high: 175, low: 168 }),
    pt('2024-01-04', 155, 'IBM', { high: 172, low: 153 }),
  ];

  it('returns null for empty input', () => {
    expect(quarterStats([])).toBeNull();
  });

  it('computes startPrice and endPrice from first/last close', () => {
    const s = quarterStats(series)!;
    expect(s.startPrice).toBe(160);
    expect(s.endPrice).toBe(155);
  });

  it('computes correct total return percentage', () => {
    // (155 - 160) / 160 * 100 = -3.125
    const s = quarterStats(series)!;
    expect(s.pct).toBeCloseTo(-3.125, 5);
  });

  it('finds the period high across all candles', () => {
    const s = quarterStats(series)!;
    expect(s.qHigh).toBe(175); // max of 165, 175, 172
  });

  it('finds the period low across all candles', () => {
    const s = quarterStats(series)!;
    expect(s.qLow).toBe(153); // min of 158, 168, 153
  });

  it('computes average volume', () => {
    const s = quarterStats(series)!;
    expect(s.avgVol).toBe(1_000_000);
  });

  it('handles a single-point series', () => {
    const single = [pt('2024-01-02', 100, 'IBM', { high: 105, low: 98 })];
    const s = quarterStats(single)!;
    expect(s.startPrice).toBe(100);
    expect(s.endPrice).toBe(100);
    expect(s.pct).toBe(0);
  });
});

// ─── toNormalisedRows ─────────────────────────────────────────────────────────

describe('toNormalisedRows', () => {
  const data: HistoryPoint[] = [
    pt('2024-01-02', 100, 'IBM'),
    pt('2024-01-02', 400, 'MSFT'),
    pt('2024-01-03', 105, 'IBM'),
    pt('2024-01-03', 380, 'MSFT'),
    pt('2024-01-04', 110, 'IBM'),
    pt('2024-01-04', 420, 'MSFT'),
  ];

  it('produces one row per date', () => {
    const rows = toNormalisedRows(data, ['IBM', 'MSFT']);
    expect(rows).toHaveLength(3);
  });

  it('first row for each ticker is always 0 %', () => {
    const rows = toNormalisedRows(data, ['IBM', 'MSFT']);
    expect(rows[0].IBM).toBe(0);
    expect(rows[0].MSFT).toBe(0);
  });

  it('subsequent rows show the correct % return from baseline', () => {
    const rows = toNormalisedRows(data, ['IBM', 'MSFT']);
    // IBM: 105/100 - 1 = +5 %
    expect(rows[1].IBM).toBeCloseTo(5, 1);
    // MSFT: 380/400 - 1 = -5 %
    expect(rows[1].MSFT).toBeCloseTo(-5, 1);
  });

  it('sorts rows ascending by date', () => {
    const shuffled = [...data].reverse();
    const rows = toNormalisedRows(shuffled, ['IBM', 'MSFT']);
    const dates = rows.map(r => r.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('ignores symbols not in the requested list', () => {
    const withExtra: HistoryPoint[] = [
      ...data,
      pt('2024-01-02', 50, 'ORCL'),
      pt('2024-01-03', 55, 'ORCL'),
    ];
    const rows = toNormalisedRows(withExtra, ['IBM']);
    rows.forEach(r => {
      expect(r.ORCL).toBeUndefined();
      expect(r.MSFT).toBeUndefined();
    });
  });

  it('returns empty array for empty data', () => {
    expect(toNormalisedRows([], ['IBM'])).toHaveLength(0);
  });

  it('returns empty array when requested symbol has no data', () => {
    expect(toNormalisedRows(data, ['XYZ'])).toHaveLength(0);
  });
});
