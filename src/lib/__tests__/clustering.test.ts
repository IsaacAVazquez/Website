import {
  clusterPlayersIntoTiers,
  clusterByRankGaps,
  groupPlayersByExistingTiers,
} from '../clustering';
import { Player } from '@/types';

function makePlayer(id: string, averageRank: number, tier?: number): Player {
  return {
    id,
    name: `Player ${id}`,
    team: 'TST',
    position: 'RB',
    averageRank,
    projectedPoints: 15,
    standardDeviation: 1,
    expertRanks: [averageRank],
    tier,
  };
}

// Players with large rank gaps between groups (gap > 3)
const PLAYERS_WITH_GAPS = [
  makePlayer('a', 1),
  makePlayer('b', 2),
  makePlayer('c', 3),
  makePlayer('d', 10), // gap of 7
  makePlayer('e', 11),
  makePlayer('f', 12),
  makePlayer('g', 20), // gap of 8
  makePlayer('h', 21),
];

// Players with pre-assigned FantasyPros tiers
const PLAYERS_WITH_TIERS = [
  makePlayer('a', 1, 1),
  makePlayer('b', 2, 1),
  makePlayer('c', 10, 2),
  makePlayer('d', 11, 2),
  makePlayer('e', 20, 3),
];

describe('clusterByRankGaps', () => {
  it('returns empty array for empty input', () => {
    expect(clusterByRankGaps([])).toEqual([]);
  });

  it('places all players in tier 1 when ranks are consecutive (no significant gaps)', () => {
    const players = [makePlayer('a', 1), makePlayer('b', 2), makePlayer('c', 3)];
    const tiers = clusterByRankGaps(players, 10); // threshold higher than any gap
    expect(tiers.length).toBe(1);
    expect(tiers[0].tier).toBe(1);
    expect(tiers[0].players.length).toBe(3);
  });

  it('creates multiple tiers when rank gaps exceed the threshold', () => {
    const tiers = clusterByRankGaps(PLAYERS_WITH_GAPS, 3);
    expect(tiers.length).toBeGreaterThan(1);
  });

  it('assigns tier numbers starting at 1 and incrementing', () => {
    const tiers = clusterByRankGaps(PLAYERS_WITH_GAPS, 3);
    tiers.forEach((t, i) => {
      expect(t.tier).toBe(i + 1);
    });
  });

  it('assigns all players across tiers', () => {
    const tiers = clusterByRankGaps(PLAYERS_WITH_GAPS, 3);
    const total = tiers.reduce((sum, t) => sum + t.players.length, 0);
    expect(total).toBe(PLAYERS_WITH_GAPS.length);
  });

  it('each tier has correct minRank <= maxRank', () => {
    const tiers = clusterByRankGaps(PLAYERS_WITH_GAPS, 3);
    tiers.forEach(t => {
      expect(t.minRank).toBeLessThanOrEqual(t.maxRank);
    });
  });

  it('uses the TIER_COLORS palette (valid hex color)', () => {
    const tiers = clusterByRankGaps(PLAYERS_WITH_GAPS, 3);
    tiers.forEach(t => {
      expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('calculates correct avgRank', () => {
    const players = [makePlayer('a', 4), makePlayer('b', 6)];
    const tiers = clusterByRankGaps(players, 10); // all in one tier
    expect(tiers[0].avgRank).toBeCloseTo(5);
  });

  it('sorts players within a tier by averageRank', () => {
    const players = [makePlayer('a', 3), makePlayer('b', 1), makePlayer('c', 2)];
    const tiers = clusterByRankGaps(players, 10);
    const ranks = tiers[0].players.map(p => Number(p.averageRank));
    expect(ranks).toEqual([1, 2, 3]);
  });
});

describe('groupPlayersByExistingTiers', () => {
  it('returns empty array for empty input', () => {
    expect(groupPlayersByExistingTiers([])).toEqual([]);
  });

  it('groups players by their existing tier assignments', () => {
    const tiers = groupPlayersByExistingTiers(PLAYERS_WITH_TIERS);
    const tierNumbers = tiers.map(t => t.tier);
    expect(tierNumbers).toContain(1);
    expect(tierNumbers).toContain(2);
    expect(tierNumbers).toContain(3);
  });

  it('preserves all players', () => {
    const tiers = groupPlayersByExistingTiers(PLAYERS_WITH_TIERS);
    const total = tiers.reduce((sum, t) => sum + t.players.length, 0);
    expect(total).toBe(PLAYERS_WITH_TIERS.length);
  });

  it('sorts tiers in ascending order', () => {
    const tiers = groupPlayersByExistingTiers(PLAYERS_WITH_TIERS);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].tier).toBeGreaterThan(tiers[i - 1].tier);
    }
  });

  it('sorts players within each tier by averageRank ascending', () => {
    const players = [
      makePlayer('b', 2, 1),
      makePlayer('a', 1, 1),
    ];
    const tiers = groupPlayersByExistingTiers(players);
    expect(Number(tiers[0].players[0].averageRank)).toBeLessThan(
      Number(tiers[0].players[1].averageRank)
    );
  });

  it('handles players with string averageRank', () => {
    const players = [
      { ...makePlayer('a', 0, 1), averageRank: '1.5' as any },
      { ...makePlayer('b', 0, 1), averageRank: '3.0' as any },
    ];
    const tiers = groupPlayersByExistingTiers(players);
    expect(tiers[0].avgRank).toBeCloseTo(2.25);
  });

  it('assigns hex colors to each tier', () => {
    const tiers = groupPlayersByExistingTiers(PLAYERS_WITH_TIERS);
    tiers.forEach(t => {
      expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe('clusterPlayersIntoTiers', () => {
  it('returns empty array for empty input', () => {
    expect(clusterPlayersIntoTiers([])).toEqual([]);
  });

  it('uses existing tier assignments when present', () => {
    const tiers = clusterPlayersIntoTiers(PLAYERS_WITH_TIERS);
    // Should use groupPlayersByExistingTiers path
    const tierNumbers = tiers.map(t => t.tier).sort();
    expect(tierNumbers).toEqual([1, 2, 3]);
  });

  it('falls back to GMM when players have no tier assignments', () => {
    const players = PLAYERS_WITH_GAPS.map(p => ({ ...p, tier: undefined }));
    const tiers = clusterPlayersIntoTiers(players, 3);
    expect(tiers.length).toBeGreaterThan(0);
    const total = tiers.reduce((sum, t) => sum + t.players.length, 0);
    expect(total).toBe(players.length);
  });

  it('returns tier groups with valid structure', () => {
    const tiers = clusterPlayersIntoTiers(PLAYERS_WITH_TIERS);
    tiers.forEach(t => {
      expect(typeof t.tier).toBe('number');
      expect(Array.isArray(t.players)).toBe(true);
      expect(typeof t.color).toBe('string');
      expect(typeof t.minRank).toBe('number');
      expect(typeof t.maxRank).toBe('number');
      expect(typeof t.avgRank).toBe('number');
    });
  });
});
