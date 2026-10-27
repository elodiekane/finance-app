/**
 * Cache unit tests.
 *
 * Tests the TtlCache utility directly — no Vite/import.meta.env in scope,
 * so this suite runs cleanly under Jest in any module mode.
 */
import { TtlCache } from '../../utils/ttlCache';

describe('TtlCache', () => {
  it('returns undefined for a missing key', () => {
    const cache = new TtlCache<number>();
    expect(cache.get('x')).toBeUndefined();
  });

  it('stores and retrieves a value within TTL', () => {
    const cache = new TtlCache<string>();
    cache.set('k', 'hello', 60_000);
    expect(cache.get('k')).toBe('hello');
  });

  it('returns undefined after TTL expires', () => {
    jest.useFakeTimers();
    const cache = new TtlCache<string>();
    cache.set('k', 'hello', 1_000);

    jest.advanceTimersByTime(1_001);
    expect(cache.get('k')).toBeUndefined();
    jest.useRealTimers();
  });

  it('size() reflects stored entries', () => {
    const cache = new TtlCache<number>();
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    expect(cache.size()).toBe(2);
  });

  it('size() does not count expired entries after a get()', () => {
    jest.useFakeTimers();
    const cache = new TtlCache<number>();
    cache.set('a', 1, 500);
    jest.advanceTimersByTime(600);
    cache.get('a'); // triggers eviction
    expect(cache.size()).toBe(0);
    jest.useRealTimers();
  });

  it('delete() removes an entry', () => {
    const cache = new TtlCache<number>();
    cache.set('a', 42, 60_000);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it('clear() removes all entries', () => {
    const cache = new TtlCache<number>();
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('overwrite updates value and resets TTL', () => {
    jest.useFakeTimers();
    const cache = new TtlCache<string>();
    cache.set('k', 'first',  1_000);
    jest.advanceTimersByTime(800);
    cache.set('k', 'second', 1_000); // reset TTL
    jest.advanceTimersByTime(600);   // would have expired the original
    expect(cache.get('k')).toBe('second');
    jest.useRealTimers();
  });
});
