import {
  calculateOverallValue,
  calculateOverallRankings,
  createOverallRankedPlayers,
  validateOverallRankings,
  OverallValueCalculation,
} from '../overallValueCalculator';
import { Player, ScoringFormat } from '@/types';

function makePlayer(
  id: string,
  position: Player['position'],
  projectedPoints: number,
  averageRank: number,
): Player {
  return {
    id,
    name: `Player ${id}`,
    team: 'TST',
    position,
    averageRank,
    projectedPoints,
    standardDeviation: 1,
    expertRanks: [averageRank],
  };
}

// ── calculateOverallValue ────────────────────────────────────────────────────

describe('calculateOverallValue', () => {
  it('returns 0 for a player with no projected points', () => {
    const player = makePlayer('k1', 'K', 0, 1);
    expect(calculateOverallValue(player)).toBe(0);
  });

  it('returns projected points unchanged for FLEX position', () => {
    const player = makePlayer('f1', 'FLEX', 100, 1);
    expect(calculateOverallValue(player)).toBe(100);
  });

  it('returns projected points unchanged for OVERALL position', () => {
    const player = makePlayer('o1', 'OVERALL', 80, 1);
    expect(calculateOverallValue(player)).toBe(80);
  });

  it('applies position multiplier so RB outvalues K with same points', () => {
    const rb = makePlayer('rb1', 'RB', 100, 1);
    const k = makePlayer('k1', 'K', 100, 1);
    expect(calculateOverallValue(rb)).toBeGreaterThan(calculateOverallValue(k));
  });

  it('PPR boosts WR value more than STANDARD format', () => {
    const wr = makePlayer('wr1', 'WR', 100, 1);
    const pprValue = calculateOverallValue(wr, 'PPR');
    const stdValue = calculateOverallValue(wr, 'STANDARD');
    expect(pprValue).toBeGreaterThan(stdValue);
  });

  it('STANDARD format boosts RB more than PPR', () => {
    const rb = makePlayer('rb1', 'RB', 100, 10);
    const stdValue = calculateOverallValue(rb, 'STANDARD');
    const pprValue = calculateOverallValue(rb, 'PPR');
    expect(stdValue).toBeGreaterThan(pprValue);
  });

  it('elite-ranked player gets higher scarcity multiplier than deep player (same position)', () => {
    // Rank 1 is elite; rank 100 is deep
    const elite = makePlayer('rb_elite', 'RB', 100, 1);
    const deep = makePlayer('rb_deep', 'RB', 100, 100);
    expect(calculateOverallValue(elite)).toBeGreaterThan(calculateOverallValue(deep));
  });

  it('returns a non-negative value', () => {
    const player = makePlayer('dst1', 'DST', 50, 1);
    expect(calculateOverallValue(player)).toBeGreaterThanOrEqual(0);
  });

  it('defaults to PPR scoring format', () => {
    const player = makePlayer('wr1', 'WR', 100, 5);
    expect(calculateOverallValue(player)).toBe(calculateOverallValue(player, 'PPR'));
  });

  it('handles string averageRank without throwing', () => {
    const player: Player = { ...makePlayer('wr1', 'WR', 100, 5), averageRank: '5' };
    expect(() => calculateOverallValue(player)).not.toThrow();
  });
});

// ── calculateOverallRankings ─────────────────────────────────────────────────

describe('calculateOverallRankings', () => {
  const skillPlayers = [
    makePlayer('qb1', 'QB', 350, 1),
    makePlayer('rb1', 'RB', 280, 1),
    makePlayer('wr1', 'WR', 260, 2),
    makePlayer('te1', 'TE', 200, 3),
    makePlayer('rb2', 'RB', 220, 5),
    makePlayer('wr2', 'WR', 210, 6),
  ];

  const kickers = [makePlayer('k1', 'K', 150, 1), makePlayer('k2', 'K', 130, 2)];
  const defenses = [makePlayer('dst1', 'DST', 140, 1), makePlayer('dst2', 'DST', 120, 2)];

  const allPlayers = [...skillPlayers, ...kickers, ...defenses];

  it('returns one calculation per player', () => {
    const result = calculateOverallRankings(allPlayers);
    expect(result.length).toBe(allPlayers.length);
  });

  it('assigns a positive overallRank to every player', () => {
    const result = calculateOverallRankings(allPlayers);
    result.forEach(calc => expect(calc.overallRank).toBeGreaterThan(0));
  });

  it('ranks are unique (no ties)', () => {
    const result = calculateOverallRankings(allPlayers);
    const ranks = result.map(c => c.overallRank);
    const unique = new Set(ranks);
    expect(unique.size).toBe(result.length);
  });

  it('no kicker ranks higher than the floor (190)', () => {
    const result = calculateOverallRankings(allPlayers);
    const kCalcs = result.filter(c => c.player.position === 'K');
    kCalcs.forEach(c => expect(c.overallRank).toBeGreaterThanOrEqual(190));
  });

  it('no defense ranks higher than the floor (165)', () => {
    const result = calculateOverallRankings(allPlayers);
    const dstCalcs = result.filter(c => c.player.position === 'DST');
    dstCalcs.forEach(c => expect(c.overallRank).toBeGreaterThanOrEqual(165));
  });

  it('skill position players rank above kickers and defenses', () => {
    const result = calculateOverallRankings(allPlayers);
    const maxSkillRank = Math.max(
      ...result
        .filter(c => !['K', 'DST'].includes(c.player.position))
        .map(c => c.overallRank),
    );
    const minKdstRank = Math.min(
      ...result
        .filter(c => ['K', 'DST'].includes(c.player.position))
        .map(c => c.overallRank),
    );
    expect(maxSkillRank).toBeLessThan(minKdstRank);
  });

  it('returns empty array for empty input', () => {
    expect(calculateOverallRankings([])).toEqual([]);
  });

  it('result is sorted by overallRank ascending', () => {
    const result = calculateOverallRankings(allPlayers);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].overallRank).toBeGreaterThan(result[i - 1].overallRank);
    }
  });
});

// ── createOverallRankedPlayers ───────────────────────────────────────────────

describe('createOverallRankedPlayers', () => {
  const players = [
    makePlayer('rb1', 'RB', 280, 1),
    makePlayer('wr1', 'WR', 260, 2),
    makePlayer('k1', 'K', 150, 1),
  ];

  it('returns the same number of players', () => {
    const result = createOverallRankedPlayers(players);
    expect(result.length).toBe(players.length);
  });

  it('averageRank on returned players is a positive integer', () => {
    const result = createOverallRankedPlayers(players);
    result.forEach(p => {
      expect(typeof p.averageRank).toBe('number');
      expect(p.averageRank as number).toBeGreaterThan(0);
    });
  });

  it('preserves player identity (id, name, team)', () => {
    const result = createOverallRankedPlayers(players);
    const ids = result.map(p => p.id).sort();
    const originalIds = players.map(p => p.id).sort();
    expect(ids).toEqual(originalIds);
  });

  it('kicker receives averageRank >= 190', () => {
    const result = createOverallRankedPlayers(players);
    const kicker = result.find(p => p.id === 'k1');
    expect(kicker?.averageRank as number).toBeGreaterThanOrEqual(190);
  });
});

// ── validateOverallRankings ──────────────────────────────────────────────────

describe('validateOverallRankings', () => {
  function makeCalc(
    id: string,
    position: Player['position'],
    overallRank: number,
  ): OverallValueCalculation {
    return {
      player: makePlayer(id, position, 100, overallRank),
      overallValue: 100,
      overallRank,
      positionValue: 1,
      formatAdjustment: 1,
      scarcityBonus: 1,
      originalRank: overallRank,
    };
  }

  it('returns no warnings for a clean rankings set', () => {
    // Build a realistic top-50 mix + valid K/DST placements
    const calcs: OverallValueCalculation[] = [
      ...Array.from({ length: 5 }, (_, i) => makeCalc(`qb${i}`, 'QB', i + 1)),
      ...Array.from({ length: 20 }, (_, i) => makeCalc(`rb${i}`, 'RB', i + 6)),
      ...Array.from({ length: 20 }, (_, i) => makeCalc(`wr${i}`, 'WR', i + 26)),
      ...Array.from({ length: 5 }, (_, i) => makeCalc(`te${i}`, 'TE', i + 46)),
      // DST at floor
      makeCalc('dst1', 'DST', 165),
      // K at floor
      makeCalc('k1', 'K', 190),
    ];
    const warnings = validateOverallRankings(calcs);
    expect(warnings).toEqual([]);
  });

  it('warns when a kicker ranks above floor 190', () => {
    const calcs = [makeCalc('k1', 'K', 50)];
    const warnings = validateOverallRankings(calcs);
    expect(warnings.some(w => w.includes('kicker'))).toBe(true);
  });

  it('warns when a defense ranks above floor 165', () => {
    const calcs = [makeCalc('dst1', 'DST', 30)];
    const warnings = validateOverallRankings(calcs);
    expect(warnings.some(w => w.includes('defense'))).toBe(true);
  });

  it('warns when a kicker appears in top 50', () => {
    const calcs = Array.from({ length: 50 }, (_, i) =>
      makeCalc(`k${i}`, 'K', i + 1),
    );
    const warnings = validateOverallRankings(calcs);
    expect(warnings.some(w => w.includes('kicker') && w.includes('top 50'))).toBe(true);
  });

  it('returns no kicker/defense-floor warnings for empty input', () => {
    const warnings = validateOverallRankings([]);
    // No kickers or DSTs to violate floors
    expect(warnings.some(w => w.includes('kicker') && w.includes('algorithm error'))).toBe(false);
    expect(warnings.some(w => w.includes('defense') && w.includes('algorithm error'))).toBe(false);
  });
});
