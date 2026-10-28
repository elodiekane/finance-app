import { normalizeSymbol } from '../../utils/symbolValidation';

describe('normalizeSymbol', () => {
  it('trims and uppercases valid input', () => {
    expect(normalizeSymbol('  aapl ')).toEqual({ ok: true, symbol: 'AAPL' });
  });

  it('accepts dots and dashes (e.g. BRK.B)', () => {
    expect(normalizeSymbol('brk.b')).toEqual({ ok: true, symbol: 'BRK.B' });
  });

  it('rejects empty input with a prompt', () => {
    const r = normalizeSymbol('   ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/enter a company symbol/i);
  });

  it('rejects characters outside the allowed set', () => {
    const r = normalizeSymbol('AA PL!');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('"AA PL!"');
  });

  it('rejects symbols longer than 10 characters', () => {
    expect(normalizeSymbol('ABCDEFGHIJK').ok).toBe(false);
  });
});
