import { fmtPrice, fmtChange, fmtPct, fmtVolume, fmtMarketCap } from '../../utils/formatters';

describe('fmtPrice', () => {
  it('formats a whole number with two decimal places and a $ prefix', () => {
    expect(fmtPrice(100)).toBe('$100.00');
  });

  it('formats a fractional price correctly', () => {
    expect(fmtPrice(171.2)).toBe('$171.20');
    expect(fmtPrice(1.5)).toBe('$1.50');
  });

  it('rounds to two decimal places', () => {
    expect(fmtPrice(99.999)).toBe('$100.00');
  });
});

describe('fmtChange', () => {
  it('shows + prefix for positive change', () => {
    expect(fmtChange(2.35, 1.39)).toBe('+2.35 (+1.39%)');
  });

  it('shows no extra sign for negative change', () => {
    expect(fmtChange(-1.20, -0.29)).toBe('-1.20 (-0.29%)');
  });

  it('handles zero change', () => {
    expect(fmtChange(0, 0)).toBe('+0.00 (+0.00%)');
  });
});

describe('fmtPct', () => {
  it('prefixes positive values with +', () => {
    expect(fmtPct(5.5)).toBe('+5.50%');
  });

  it('does not double the minus sign for negative values', () => {
    expect(fmtPct(-3.2)).toBe('-3.20%');
  });

  it('handles zero', () => {
    expect(fmtPct(0)).toBe('+0.00%');
  });
});

describe('fmtVolume', () => {
  it('formats billions', () => {
    expect(fmtVolume(1_500_000_000)).toBe('1.50B');
  });

  it('formats millions', () => {
    expect(fmtVolume(4_200_000)).toBe('4.2M');
    expect(fmtVolume(18_500_000)).toBe('18.5M');
  });

  it('formats thousands', () => {
    expect(fmtVolume(1_100)).toBe('1K');
    expect(fmtVolume(5_600)).toBe('6K');
  });

  it('returns raw string below 1 000', () => {
    expect(fmtVolume(500)).toBe('500');
  });

  it('uses M boundary correctly — just under 1B stays as M', () => {
    expect(fmtVolume(999_000_000)).toBe('999.0M');
  });
});

describe('fmtMarketCap', () => {
  it('returns em-dash for undefined', () => {
    expect(fmtMarketCap(undefined)).toBe('—');
  });

  it('formats trillions', () => {
    expect(fmtMarketCap(3_090_000_000_000)).toBe('$3.09T');
  });

  it('formats billions', () => {
    expect(fmtMarketCap(155_000_000_000)).toBe('$155.0B');
  });

  it('formats millions', () => {
    expect(fmtMarketCap(270_000_000)).toBe('$270.0M');
  });
});
