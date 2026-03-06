// Mock logger to suppress noise in test output
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    performance: jest.fn(),
    createLogEntry: jest.fn(),
  },
}));

import { unifiedCache, CacheEntry } from '../unifiedCache';

describe('UnifiedCache', () => {
  beforeEach(() => {
    unifiedCache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── set / get ────────────────────────────────────────────────────────────

  describe('set and get', () => {
    it('stores and retrieves a value', () => {
      unifiedCache.set('key1', { value: 42 });
      const result = unifiedCache.get<{ value: number }>('key1');
      expect(result.data).toEqual({ value: 42 });
      expect(result.isExpired).toBe(false);
    });

    it('returns null for a key that does not exist', () => {
      const result = unifiedCache.get('nonexistent');
      expect(result.data).toBeNull();
      expect(result.isExpired).toBe(true);
    });

    it('marks data as expired after TTL elapses and refuses to serve it', () => {
      unifiedCache.set('expires', 'hello', { ttl: 1000 });
      jest.advanceTimersByTime(2000);
      const result = unifiedCache.get('expires');
      expect(result.data).toBeNull();
      expect(result.isExpired).toBe(true);
    });

    it('serves expired data when allowStale is true', () => {
      unifiedCache.set('stale', 'world', { ttl: 1000 });
      jest.advanceTimersByTime(2000);
      const result = unifiedCache.get<string>('stale', { allowStale: true });
      expect(result.data).toBe('world');
      expect(result.isExpired).toBe(true);
    });

    it('marks data as stale after 80% of TTL without being expired', () => {
      unifiedCache.set('fresh', 'data', { ttl: 10_000 });
      jest.advanceTimersByTime(8_500); // past 80% but before 100%
      const result = unifiedCache.get<string>('fresh');
      expect(result.data).toBe('data');
      expect(result.isStale).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('reports the source stored with the entry', () => {
      unifiedCache.set('sourced', 123, { source: 'api' });
      const result = unifiedCache.get('sourced');
      expect(result.source).toBe('api');
    });

    it('reports increasing age over time', () => {
      unifiedCache.set('aging', true, { ttl: 60_000 });
      jest.advanceTimersByTime(5_000);
      const result = unifiedCache.get('aging');
      expect(result.age).toBeGreaterThanOrEqual(5_000);
    });
  });

  // ─── has ──────────────────────────────────────────────────────────────────

  describe('has', () => {
    it('returns true for a valid cached key', () => {
      unifiedCache.set('present', 1);
      expect(unifiedCache.has('present')).toBe(true);
    });

    it('returns false for a missing key', () => {
      expect(unifiedCache.has('absent')).toBe(false);
    });

    it('returns false for an expired key (default)', () => {
      unifiedCache.set('exp', 1, { ttl: 500 });
      jest.advanceTimersByTime(1000);
      expect(unifiedCache.has('exp')).toBe(false);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes an existing entry and returns true', () => {
      unifiedCache.set('del', 'bye');
      expect(unifiedCache.delete('del')).toBe(true);
      expect(unifiedCache.get('del').data).toBeNull();
    });

    it('returns false when key does not exist', () => {
      expect(unifiedCache.delete('ghost')).toBe(false);
    });
  });

  // ─── clear ────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all entries', () => {
      unifiedCache.set('a', 1);
      unifiedCache.set('b', 2);
      unifiedCache.clear();
      expect(unifiedCache.keys().length).toBe(0);
    });
  });

  // ─── keys ─────────────────────────────────────────────────────────────────

  describe('keys', () => {
    it('returns all keys when no pattern is given', () => {
      unifiedCache.set('foo', 1);
      unifiedCache.set('bar', 2);
      const keys = unifiedCache.keys();
      expect(keys).toContain('foo');
      expect(keys).toContain('bar');
    });

    it('filters keys by wildcard pattern', () => {
      unifiedCache.set('players:qb:ppr', 1);
      unifiedCache.set('players:rb:ppr', 2);
      unifiedCache.set('tiers:qb:ppr', 3);
      const keys = unifiedCache.keys('players:*');
      expect(keys).toContain('players:qb:ppr');
      expect(keys).toContain('players:rb:ppr');
      expect(keys).not.toContain('tiers:qb:ppr');
    });
  });

  // ─── prune ────────────────────────────────────────────────────────────────

  describe('prune', () => {
    it('removes expired entries and returns count', () => {
      unifiedCache.set('live', 1, { ttl: 60_000 });
      unifiedCache.set('dead1', 2, { ttl: 500 });
      unifiedCache.set('dead2', 3, { ttl: 500 });
      jest.advanceTimersByTime(1000);
      const pruned = unifiedCache.prune();
      expect(pruned).toBe(2);
      expect(unifiedCache.has('live')).toBe(true);
    });

    it('returns 0 when nothing is expired', () => {
      unifiedCache.set('alive', 1, { ttl: 60_000 });
      expect(unifiedCache.prune()).toBe(0);
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('tracks hit rate correctly', () => {
      unifiedCache.set('s1', 1);
      unifiedCache.get('s1'); // hit
      unifiedCache.get('s1'); // hit
      unifiedCache.get('miss_key'); // miss
      const stats = unifiedCache.getStats();
      // 2 hits, 1 miss = 66.67%
      expect(stats.hitRate).toBeGreaterThan(50);
      expect(stats.hitRate).toBeLessThanOrEqual(100);
    });

    it('reports correct totalEntries', () => {
      unifiedCache.set('x', 1);
      unifiedCache.set('y', 2);
      expect(unifiedCache.getStats().totalEntries).toBe(2);
    });

    it('returns null for oldestEntry and mostAccessed when cache is empty', () => {
      const stats = unifiedCache.getStats();
      expect(stats.oldestEntry).toBeNull();
      expect(stats.mostAccessed).toBeNull();
    });

    it('reports positive memoryUsage when entries exist', () => {
      unifiedCache.set('mem', { big: 'data'.repeat(100) });
      expect(unifiedCache.getStats().memoryUsage).toBeGreaterThan(0);
    });
  });

  // ─── inspect ──────────────────────────────────────────────────────────────

  describe('inspect', () => {
    it('returns the raw CacheEntry for an existing key', () => {
      unifiedCache.set('inspected', 'hello', { source: 'test' });
      const entry = unifiedCache.inspect('inspected') as CacheEntry;
      expect(entry).not.toBeNull();
      expect(entry.data).toBe('hello');
      expect(entry.source).toBe('test');
      expect(typeof entry.timestamp).toBe('number');
    });

    it('returns null for a missing key', () => {
      expect(unifiedCache.inspect('nope')).toBeNull();
    });
  });

  // ─── key generators ───────────────────────────────────────────────────────

  describe('generatePlayerKey', () => {
    it('creates a key in the expected format', () => {
      expect(unifiedCache.generatePlayerKey('QB', 'PPR')).toBe('players:qb:ppr');
    });
  });

  describe('generateTierKey', () => {
    it('includes algorithm when provided', () => {
      expect(unifiedCache.generateTierKey('RB', 'STANDARD', 'gmm')).toBe(
        'tiers:rb:standard:gmm'
      );
    });

    it('defaults algorithm to "auto"', () => {
      expect(unifiedCache.generateTierKey('WR', 'HALF_PPR')).toBe(
        'tiers:wr:half_ppr:auto'
      );
    });
  });

  describe('generateRankingKey', () => {
    it('creates a key with source, position, and week', () => {
      expect(unifiedCache.generateRankingKey('fantasypros', 'TE', 5)).toBe(
        'rankings:fantasypros:te:week5'
      );
    });

    it('defaults to week 0', () => {
      expect(unifiedCache.generateRankingKey('nflverse', 'K')).toBe(
        'rankings:nflverse:k:week0'
      );
    });
  });

  // ─── fantasy helpers ──────────────────────────────────────────────────────

  describe('setPlayers / getPlayers', () => {
    it('stores and retrieves player data', () => {
      const players = [{ id: 'p1', name: 'Josh Allen' } as any];
      unifiedCache.setPlayers('QB', 'PPR', players, 'test');
      const result = unifiedCache.getPlayers('QB', 'PPR');
      expect(result).toEqual(players);
    });

    it('returns null when not cached', () => {
      expect(unifiedCache.getPlayers('DST', 'STANDARD')).toBeNull();
    });
  });

  describe('setTiers / getTiers', () => {
    it('stores and retrieves tier data', () => {
      const tierData = [{ tier: 1, players: [] }];
      unifiedCache.setTiers('RB', 'HALF_PPR', tierData);
      expect(unifiedCache.getTiers('RB', 'HALF_PPR')).toEqual(tierData);
    });

    it('returns null when not cached', () => {
      expect(unifiedCache.getTiers('FLEX', 'PPR')).toBeNull();
    });
  });

  // ─── invalidation ─────────────────────────────────────────────────────────

  describe('invalidatePosition', () => {
    it('removes all entries for the given position', () => {
      unifiedCache.set('players:qb:ppr', 1);
      unifiedCache.set('tiers:qb:ppr:auto', 2);
      unifiedCache.set('players:rb:ppr', 3);
      const removed = unifiedCache.invalidatePosition('QB');
      expect(removed).toBeGreaterThanOrEqual(2);
      expect(unifiedCache.has('players:rb:ppr')).toBe(true);
    });
  });

  describe('invalidateScoring', () => {
    it('removes all entries for the given scoring format', () => {
      unifiedCache.set('players:qb:ppr', 1);
      unifiedCache.set('tiers:rb:ppr:auto', 2);
      unifiedCache.set('players:wr:standard', 3);
      const removed = unifiedCache.invalidateScoring('PPR');
      expect(removed).toBeGreaterThanOrEqual(2);
      expect(unifiedCache.has('players:wr:standard')).toBe(true);
    });
  });
});
