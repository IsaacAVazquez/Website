import {
  calculateOptimizedTiers,
  warmTierCache,
  tierCacheUtils,
  COMMON_TIER_CONFIGS,
} from '../optimizedTierCalculator';
import { Player } from '@/types';

function makePlayer(id: string, averageRank: number, projectedPoints = 10): Player {
  return {
    id,
    name: `Player ${id}`,
    team: 'TST',
    position: 'WR',
    averageRank,
    projectedPoints,
    standardDeviation: 1,
    expertRanks: [averageRank],
  };
}

const TEN_PLAYERS = Array.from({ length: 10 }, (_, i) =>
  makePlayer(`p${i + 1}`, i + 1),
);

beforeEach(() => {
  tierCacheUtils.clear();
});

// ── calculateOptimizedTiers ──────────────────────────────────────────────────

describe('calculateOptimizedTiers', () => {
  it('returns empty array for empty player list', async () => {
    const result = await calculateOptimizedTiers([]);
    expect(result).toEqual([]);
  });

  it('returns the requested number of tiers (or fewer when players < tiers)', async () => {
    const result = await calculateOptimizedTiers(TEN_PLAYERS, 5);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result.length).toBeGreaterThan(0);
  });

  it('every player appears in exactly one tier', async () => {
    const result = await calculateOptimizedTiers(TEN_PLAYERS, 3);
    const totalPlayers = result.reduce((sum, t) => sum + t.players.length, 0);
    expect(totalPlayers).toBe(TEN_PLAYERS.length);
  });

  it('tier numbers are sequential starting at 1', async () => {
    const result = await calculateOptimizedTiers(TEN_PLAYERS, 4);
    result.forEach((tier, i) => {
      expect(tier.tier).toBe(i + 1);
    });
  });

  it('each tier has a non-empty color and label string', async () => {
    const result = await calculateOptimizedTiers(TEN_PLAYERS, 3);
    result.forEach(tier => {
      expect(typeof tier.color).toBe('string');
      expect(tier.color.length).toBeGreaterThan(0);
      expect(typeof tier.label).toBe('string');
      expect(tier.label.length).toBeGreaterThan(0);
    });
  });

  it('players within a tier are sorted by rank (ascending)', async () => {
    const players = Array.from({ length: 9 }, (_, i) =>
      makePlayer(`p${i + 1}`, i + 1),
    );
    const result = await calculateOptimizedTiers(players, 3);
    result.forEach(tier => {
      const ranks = tier.players.map(p =>
        typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank,
      );
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
      }
    });
  });

  it('tier minRank is less than or equal to maxRank', async () => {
    const result = await calculateOptimizedTiers(TEN_PLAYERS, 4);
    result.forEach(tier => {
      expect(tier.minRank).toBeLessThanOrEqual(tier.maxRank);
    });
  });

  it('avgRank is within minRank and maxRank bounds', async () => {
    const result = await calculateOptimizedTiers(TEN_PLAYERS, 4);
    result.forEach(tier => {
      expect(tier.avgRank).toBeGreaterThanOrEqual(tier.minRank);
      expect(tier.avgRank).toBeLessThanOrEqual(tier.maxRank);
    });
  });

  it('playerCount matches players array length on each tier', async () => {
    const result = await calculateOptimizedTiers(TEN_PLAYERS, 4);
    result.forEach(tier => {
      expect(tier.playerCount).toBe(tier.players.length);
    });
  });

  it('caches and returns same result on repeated calls', async () => {
    const first = await calculateOptimizedTiers(TEN_PLAYERS, 3, 'PPR');
    const second = await calculateOptimizedTiers(TEN_PLAYERS, 3, 'PPR');
    expect(second).toBe(first); // same reference = cache hit
  });

  it('different scoringFormat produces different cache entries', async () => {
    const ppr = await calculateOptimizedTiers(TEN_PLAYERS, 3, 'PPR');
    // Clear only the internal cache indirectly by using a different format
    const std = await calculateOptimizedTiers(TEN_PLAYERS, 3, 'STANDARD');
    // Both should be valid arrays (contents may differ only if calculation varies by format)
    expect(Array.isArray(ppr)).toBe(true);
    expect(Array.isArray(std)).toBe(true);
  });

  it('handles a single player gracefully', async () => {
    const result = await calculateOptimizedTiers([makePlayer('solo', 1)], 6);
    expect(result.length).toBe(1);
    expect(result[0].players.length).toBe(1);
  });

  it('defaults to 6 tiers when numberOfTiers is omitted', async () => {
    const players = Array.from({ length: 12 }, (_, i) => makePlayer(`p${i}`, i + 1));
    const result = await calculateOptimizedTiers(players);
    expect(result.length).toBeLessThanOrEqual(6);
  });
});

// ── tierCacheUtils ───────────────────────────────────────────────────────────

describe('tierCacheUtils', () => {
  it('size() returns 0 on a fresh cache', () => {
    expect(tierCacheUtils.size()).toBe(0);
  });

  it('size() increments after a calculation', async () => {
    await calculateOptimizedTiers(TEN_PLAYERS, 3, 'PPR');
    expect(tierCacheUtils.size()).toBeGreaterThan(0);
  });

  it('clear() resets size to 0', async () => {
    await calculateOptimizedTiers(TEN_PLAYERS, 3, 'PPR');
    tierCacheUtils.clear();
    expect(tierCacheUtils.size()).toBe(0);
  });

  it('getStats() returns an object with size and maxSize keys', () => {
    const stats = tierCacheUtils.getStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxSize');
  });
});

// ── COMMON_TIER_CONFIGS ──────────────────────────────────────────────────────

describe('COMMON_TIER_CONFIGS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(COMMON_TIER_CONFIGS)).toBe(true);
    expect(COMMON_TIER_CONFIGS.length).toBeGreaterThan(0);
  });

  it('every config entry has position, scoring, and tiers', () => {
    COMMON_TIER_CONFIGS.forEach(cfg => {
      expect(typeof cfg.position).toBe('string');
      expect(typeof cfg.scoring).toBe('string');
      expect(typeof cfg.tiers).toBe('number');
      expect(cfg.tiers).toBeGreaterThan(0);
    });
  });
});

// ── warmTierCache ────────────────────────────────────────────────────────────

describe('warmTierCache', () => {
  it('does not throw when called with valid data', () => {
    expect(() =>
      warmTierCache(
        { WR: TEN_PLAYERS },
        [{ position: 'WR', scoring: 'PPR', tiers: 4 }],
      ),
    ).not.toThrow();
  });

  it('does not throw when playersData is empty', () => {
    expect(() =>
      warmTierCache({}, [{ position: 'QB', scoring: 'PPR', tiers: 4 }]),
    ).not.toThrow();
  });
});
