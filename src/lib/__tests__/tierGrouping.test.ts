import { getTierGroups, getTierStats, TierAssignment } from '../tierGrouping';
import { Player } from '@/types';

function makePlayer(id: string, averageRank: number): Player {
  return {
    id,
    name: `Player ${id}`,
    team: 'TST',
    position: 'WR',
    averageRank,
    projectedPoints: 12,
    standardDeviation: 1,
    expertRanks: [averageRank],
  };
}

// Create players with clear rank gaps so tier breaks are deterministic
// avg gap for [1,2,3, 15,16,17, 30,31,32] is about 3.6; gaps of 12 > 1.5 * 3.6 = 5.4 AND > 2
const TIERED_PLAYERS = [
  makePlayer('a', 1),
  makePlayer('b', 2),
  makePlayer('c', 3),
  makePlayer('d', 15),  // gap 12
  makePlayer('e', 16),
  makePlayer('f', 17),
  makePlayer('g', 30),  // gap 13
  makePlayer('h', 31),
  makePlayer('i', 32),
];

describe('getTierGroups', () => {
  it('returns empty array for empty input', () => {
    expect(getTierGroups([], 'QB')).toEqual([]);
  });

  it('returns a single tier assignment for a single player', () => {
    const result = getTierGroups([makePlayer('p1', 5)], 'RB');
    expect(result.length).toBe(1);
    expect(result[0].tier).toBe(1);
    expect(result[0].player.id).toBe('p1');
  });

  it('assigns all players exactly once', () => {
    const result = getTierGroups(TIERED_PLAYERS, 'WR');
    expect(result.length).toBe(TIERED_PLAYERS.length);
  });

  it('identifies tier breaks at significant rank gaps', () => {
    const result = getTierGroups(TIERED_PLAYERS, 'WR');
    const tierNumbers = [...new Set(result.map(r => r.tier))].sort((a, b) => a - b);
    expect(tierNumbers.length).toBeGreaterThan(1);
    expect(tierNumbers[0]).toBe(1);
  });

  it('limits to a maximum of 6 tiers', () => {
    // Create many players with large gaps to force many potential tiers
    const players = Array.from({ length: 20 }, (_, i) =>
      makePlayer(`p${i}`, (i + 1) * 10)
    );
    const result = getTierGroups(players, 'QB');
    const tierNumbers = [...new Set(result.map(r => r.tier))];
    expect(Math.max(...tierNumbers)).toBeLessThanOrEqual(6);
  });

  it('preserves original player order in result', () => {
    const players = [makePlayer('c', 3), makePlayer('a', 1), makePlayer('b', 2)];
    const result = getTierGroups(players, 'TE');
    const ids = result.map(r => r.player.id);
    // Should match the original input order
    expect(ids).toEqual(['c', 'a', 'b']);
  });

  it('assigns tier 1 to the player with the lowest rank', () => {
    const result = getTierGroups(TIERED_PLAYERS, 'WR');
    const bestPlayer = result.find(r => r.player.id === 'a');
    expect(bestPlayer?.tier).toBe(1);
  });

  it('assigns higher tier numbers to worse-ranked players', () => {
    const result = getTierGroups(TIERED_PLAYERS, 'WR');
    const tier1Ranks = result.filter(r => r.tier === 1).map(r => Number(r.player.averageRank));
    const lastTier = Math.max(...result.map(r => r.tier));
    const lastTierRanks = result
      .filter(r => r.tier === lastTier)
      .map(r => Number(r.player.averageRank));

    expect(Math.max(...tier1Ranks)).toBeLessThan(Math.min(...lastTierRanks));
  });

  it('handles players with identical ranks (no gaps) as a single tier', () => {
    const players = [makePlayer('a', 5), makePlayer('b', 5), makePlayer('c', 5)];
    const result = getTierGroups(players, 'K');
    const tiers = [...new Set(result.map(r => r.tier))];
    expect(tiers.length).toBe(1);
  });
});

describe('getTierStats', () => {
  let assignments: TierAssignment[];

  beforeEach(() => {
    assignments = getTierGroups(TIERED_PLAYERS, 'WR');
  });

  it('returns one stat entry per tier', () => {
    const stats = getTierStats(assignments);
    const uniqueTiers = [...new Set(assignments.map(a => a.tier))];
    expect(stats.length).toBe(uniqueTiers.length);
  });

  it('sorts stats by tier number ascending', () => {
    const stats = getTierStats(assignments);
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i].tier).toBeGreaterThan(stats[i - 1].tier);
    }
  });

  it('calculates correct count per tier', () => {
    const stats = getTierStats(assignments);
    const totalFromStats = stats.reduce((sum, s) => sum + s.count, 0);
    expect(totalFromStats).toBe(TIERED_PLAYERS.length);
  });

  it('calculates correct minRank and maxRank for each tier', () => {
    const stats = getTierStats(assignments);
    stats.forEach(stat => {
      expect(stat.minRank).toBeLessThanOrEqual(stat.maxRank);
    });
  });

  it('calculates avgRank within minRank..maxRank bounds', () => {
    const stats = getTierStats(assignments);
    stats.forEach(stat => {
      expect(stat.avgRank).toBeGreaterThanOrEqual(stat.minRank);
      expect(stat.avgRank).toBeLessThanOrEqual(stat.maxRank);
    });
  });

  it('handles single-tier input', () => {
    const singleTierAssignments: TierAssignment[] = [
      { tier: 1, player: makePlayer('a', 1) },
      { tier: 1, player: makePlayer('b', 2) },
    ];
    const stats = getTierStats(singleTierAssignments);
    expect(stats.length).toBe(1);
    expect(stats[0].count).toBe(2);
    expect(stats[0].minRank).toBe(1);
    expect(stats[0].maxRank).toBe(2);
    expect(stats[0].avgRank).toBeCloseTo(1.5);
  });

  it('returns empty array for empty input', () => {
    expect(getTierStats([])).toEqual([]);
  });
});
