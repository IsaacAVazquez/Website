import { GaussianMixtureModel, clusterPlayersWithGMM } from '../gaussianMixture';
import { Player } from '@/types';

function makePlayer(id: string, averageRank: number, tier?: number): Player {
  return {
    id,
    name: `Player ${id}`,
    team: 'TST',
    position: 'QB',
    averageRank,
    projectedPoints: 20,
    standardDeviation: 1,
    expertRanks: [averageRank],
    tier,
  };
}

// Spread players clearly across 3 rank bands so GMM can find tiers
const LOW_TIER_PLAYERS = [1, 2, 3, 4].map((r, i) => makePlayer(`l${i}`, r));
const MID_TIER_PLAYERS = [20, 21, 22, 23].map((r, i) => makePlayer(`m${i}`, r));
const HIGH_TIER_PLAYERS = [40, 41, 42, 43].map((r, i) => makePlayer(`h${i}`, r));
const WELL_SEPARATED_PLAYERS = [...LOW_TIER_PLAYERS, ...MID_TIER_PLAYERS, ...HIGH_TIER_PLAYERS];

describe('GaussianMixtureModel', () => {
  describe('constructor', () => {
    it('creates a model with default parameters', () => {
      const gmm = new GaussianMixtureModel();
      expect(gmm).toBeInstanceOf(GaussianMixtureModel);
    });

    it('creates a model with custom k', () => {
      const gmm = new GaussianMixtureModel(3);
      expect(gmm).toBeInstanceOf(GaussianMixtureModel);
    });
  });

  describe('fit', () => {
    it('fits without error on a list of players', () => {
      const gmm = new GaussianMixtureModel(3);
      expect(() => gmm.fit(WELL_SEPARATED_PLAYERS)).not.toThrow();
    });

    it('handles a single player without crashing', () => {
      const gmm = new GaussianMixtureModel(2);
      expect(() => gmm.fit([makePlayer('p1', 5)])).not.toThrow();
    });
  });

  describe('predict', () => {
    it('returns a TierGroup array with the correct number of tiers', () => {
      const gmm = new GaussianMixtureModel(3);
      gmm.fit(WELL_SEPARATED_PLAYERS);
      const tiers = gmm.predict(WELL_SEPARATED_PLAYERS);

      expect(Array.isArray(tiers)).toBe(true);
      expect(tiers.length).toBeGreaterThanOrEqual(1);
      expect(tiers.length).toBeLessThanOrEqual(3);
    });

    it('assigns every player to exactly one tier', () => {
      const gmm = new GaussianMixtureModel(3);
      gmm.fit(WELL_SEPARATED_PLAYERS);
      const tiers = gmm.predict(WELL_SEPARATED_PLAYERS);

      const assignedCount = tiers.reduce((sum, t) => sum + t.players.length, 0);
      expect(assignedCount).toBe(WELL_SEPARATED_PLAYERS.length);
    });

    it('assigns tier numbers starting at 1', () => {
      const gmm = new GaussianMixtureModel(3);
      gmm.fit(WELL_SEPARATED_PLAYERS);
      const tiers = gmm.predict(WELL_SEPARATED_PLAYERS);

      const tierNumbers = tiers.map(t => t.tier);
      expect(Math.min(...tierNumbers)).toBe(1);
    });

    it('lower-ranked players (better) are in earlier tiers', () => {
      const gmm = new GaussianMixtureModel(3);
      gmm.fit(WELL_SEPARATED_PLAYERS);
      const tiers = gmm.predict(WELL_SEPARATED_PLAYERS);

      // Tier 1 should have smaller average ranks than last tier
      const sortedTiers = [...tiers].sort((a, b) => a.tier - b.tier);
      if (sortedTiers.length >= 2) {
        expect(sortedTiers[0].avgRank).toBeLessThan(sortedTiers[sortedTiers.length - 1].avgRank);
      }
    });

    it('each tier has correct color hex', () => {
      const gmm = new GaussianMixtureModel(3);
      gmm.fit(WELL_SEPARATED_PLAYERS);
      const tiers = gmm.predict(WELL_SEPARATED_PLAYERS);

      tiers.forEach(t => {
        expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('each tier has valid minRank <= maxRank', () => {
      const gmm = new GaussianMixtureModel(3);
      gmm.fit(WELL_SEPARATED_PLAYERS);
      const tiers = gmm.predict(WELL_SEPARATED_PLAYERS);

      tiers.forEach(t => {
        expect(t.minRank).toBeLessThanOrEqual(t.maxRank);
      });
    });

    it('mutates player.tier to the assigned tier number', () => {
      const players = WELL_SEPARATED_PLAYERS.map(p => ({ ...p })); // clone
      const gmm = new GaussianMixtureModel(3);
      gmm.fit(players);
      gmm.predict(players);

      players.forEach(p => {
        expect(typeof p.tier).toBe('number');
        expect(p.tier).toBeGreaterThanOrEqual(1);
      });
    });
  });
});

describe('clusterPlayersWithGMM', () => {
  it('returns an empty array for empty input', () => {
    expect(clusterPlayersWithGMM([])).toEqual([]);
  });

  it('returns tier groups for a valid player list', () => {
    const tiers = clusterPlayersWithGMM(WELL_SEPARATED_PLAYERS, 3);
    expect(tiers.length).toBeGreaterThan(0);
  });

  it('returns cached result on second call with same players and k', () => {
    const players = [...LOW_TIER_PLAYERS, ...MID_TIER_PLAYERS];
    const first = clusterPlayersWithGMM(players, 2);
    const second = clusterPlayersWithGMM(players, 2);
    // Same reference means cache was used
    expect(first).toBe(second);
  });

  it('re-computes when player ranks differ (different cache key)', () => {
    const players1 = [makePlayer('a', 1), makePlayer('b', 20)];
    const players2 = [makePlayer('a', 5), makePlayer('b', 25)];

    const result1 = clusterPlayersWithGMM(players1, 2);
    const result2 = clusterPlayersWithGMM(players2, 2);
    expect(result1).not.toBe(result2);
  });

  it('uses the specified number of tiers (or fewer if data has fewer clusters)', () => {
    const tiers = clusterPlayersWithGMM(WELL_SEPARATED_PLAYERS, 3);
    expect(tiers.length).toBeGreaterThanOrEqual(1);
    expect(tiers.length).toBeLessThanOrEqual(3);
  });

  it('assigns all players across returned tiers', () => {
    const tiers = clusterPlayersWithGMM(WELL_SEPARATED_PLAYERS, 3);
    const total = tiers.reduce((sum, t) => sum + t.players.length, 0);
    expect(total).toBe(WELL_SEPARATED_PLAYERS.length);
  });
});
