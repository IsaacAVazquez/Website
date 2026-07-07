import {
  calculateUnifiedTiers,
  getUnifiedTierColor,
  getUnifiedTierLabel,
  convertToUnifiedTier,
  UNIFIED_TIER_COLORS,
  UNIFIED_TIER_LABELS,
} from "../unifiedTierCalculator";
import type { Player, TierGroup } from "@/types";
import { clusterPlayersWithGMM } from "../gaussianMixture";

// Mock the GMM clusterer so the fallback branches (value-drop / rank-gap) can be
// exercised. The default implementation delegates to the real clusterer so the
// existing GMM-path cases above keep passing; individual fallback tests below opt
// into failure with `mockImplementationOnce`.
jest.mock("../gaussianMixture", () => {
  const actual = jest.requireActual("../gaussianMixture");
  return {
    ...actual,
    clusterPlayersWithGMM: jest.fn(actual.clusterPlayersWithGMM),
  };
});

const mockedClusterWithGMM = clusterPlayersWithGMM as jest.Mock;

function makePlayer(
  id: string,
  averageRank: number,
  overrides: Partial<Player> = {}
): Player {
  return {
    id,
    name: `Player ${id}`,
    team: "TST",
    position: "RB",
    averageRank,
    projectedPoints: 15,
    standardDeviation: 1,
    expertRanks: [averageRank],
    ...overrides,
  };
}

describe("calculateUnifiedTiers", () => {
  it("returns an empty array for empty input", () => {
    expect(calculateUnifiedTiers([])).toEqual([]);
  });

  it("groups players by their existing FantasyPros tier assignments", () => {
    // Unique ids per test keep the module-level cache from colliding across tests.
    const players = [
      makePlayer("et-a", 1, { tier: 1 }),
      makePlayer("et-b", 2, { tier: 1 }),
      makePlayer("et-c", 10, { tier: 2 }),
      makePlayer("et-d", 11, { tier: 2 }),
      makePlayer("et-e", 20, { tier: 3 }),
    ];

    const tiers = calculateUnifiedTiers(players);

    expect(tiers).toHaveLength(3);
    expect(tiers.map((t) => t.tier)).toEqual([1, 2, 3]);
    expect(tiers[0].players.map((p) => p.id)).toEqual(["et-a", "et-b"]);
    // Positional ranks are contiguous across tiers.
    expect(tiers[0].minRank).toBe(1);
    expect(tiers[0].maxRank).toBe(2);
    expect(tiers[1].minRank).toBe(3);
    expect(tiers[1].maxRank).toBe(4);
    expect(tiers[2].minRank).toBe(5);
    expect(tiers[2].maxRank).toBe(5);
    // Colors/labels are mapped from the unified palettes.
    expect(tiers[0].color).toBe(UNIFIED_TIER_COLORS[0]);
    expect(tiers[0].label).toBe(UNIFIED_TIER_LABELS[0]);
    // avgRank reflects the underlying FantasyPros average ranks.
    expect(tiers[0].avgRank).toBeCloseTo(1.5);
  });

  it("produces tiers for players without existing assignments (clustering path)", () => {
    const players = [
      makePlayer("cl-a", 1),
      makePlayer("cl-b", 2),
      makePlayer("cl-c", 3),
      makePlayer("cl-d", 10),
      makePlayer("cl-e", 11),
      makePlayer("cl-f", 12),
      makePlayer("cl-g", 25),
      makePlayer("cl-h", 26),
    ];

    const tiers = calculateUnifiedTiers(players, 3);

    expect(tiers.length).toBeGreaterThan(0);
    // Every input player lands in exactly one tier.
    const placed = tiers.flatMap((t) => t.players.map((p) => p.id));
    expect(placed.sort()).toEqual(players.map((p) => p.id).sort());
    // Tier numbers ascend and each carries a color + label.
    tiers.forEach((tier) => {
      expect(typeof tier.color).toBe("string");
      expect(typeof tier.label).toBe("string");
      expect(tier.players.length).toBeGreaterThan(0);
    });
  });

  it("returns a cached result on repeated identical calls", () => {
    const players = [
      makePlayer("ca-a", 1, { tier: 1 }),
      makePlayer("ca-b", 2, { tier: 2 }),
    ];

    const first = calculateUnifiedTiers(players, 6, "PPR");
    const second = calculateUnifiedTiers(players, 6, "PPR");
    // Same object reference is returned from cache (not just deep-equal).
    expect(second).toBe(first);
  });

  it("partitions a single-tier group of players with no existing tiers", () => {
    const players = Array.from({ length: 12 }, (_, i) =>
      makePlayer(`big-${i}`, i + 1)
    );
    const tiers = calculateUnifiedTiers(players, 4);
    const placed = tiers.flatMap((t) => t.players.length);
    expect(placed.reduce((a, b) => a + b, 0)).toBe(12);
  });
});

describe("getUnifiedTierColor", () => {
  it("maps tier numbers to palette colors", () => {
    expect(getUnifiedTierColor(1)).toBe(UNIFIED_TIER_COLORS[0]);
    expect(getUnifiedTierColor(3)).toBe(UNIFIED_TIER_COLORS[2]);
  });

  it("clamps out-of-range tiers to the last color", () => {
    expect(getUnifiedTierColor(999)).toBe(
      UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1]
    );
  });
});

describe("getUnifiedTierLabel", () => {
  it("returns a named label for in-range tiers", () => {
    expect(getUnifiedTierLabel(1)).toBe("Elite");
    expect(getUnifiedTierLabel(UNIFIED_TIER_LABELS.length)).toBe(
      UNIFIED_TIER_LABELS[UNIFIED_TIER_LABELS.length - 1]
    );
  });

  it("falls back to a generic label beyond the named set", () => {
    expect(getUnifiedTierLabel(UNIFIED_TIER_LABELS.length + 1)).toBe(
      `Tier ${UNIFIED_TIER_LABELS.length + 1}`
    );
  });
});

describe("convertToUnifiedTier", () => {
  it("maps a legacy TierGroup into a UnifiedTier with palette color/label", () => {
    const group: TierGroup = {
      tier: 2,
      players: [makePlayer("conv-a", 5)],
      minRank: 3,
      maxRank: 4,
      avgRank: 3.5,
      color: "#ignored",
      label: "ignored",
    } as TierGroup;

    const unified = convertToUnifiedTier(group);
    expect(unified.tier).toBe(2);
    expect(unified.color).toBe(UNIFIED_TIER_COLORS[1]);
    expect(unified.label).toBe(UNIFIED_TIER_LABELS[1]);
    expect(unified.minRank).toBe(3);
    expect(unified.maxRank).toBe(4);
    expect(unified.avgRank).toBe(3.5);
  });

  it("clamps an out-of-range tier number to the last palette entry", () => {
    const group: TierGroup = {
      tier: 99,
      players: [],
      minRank: 1,
      maxRank: 1,
      avgRank: 1,
      color: "#ignored",
      label: "ignored",
    } as TierGroup;

    const unified = convertToUnifiedTier(group);
    expect(unified.color).toBe(
      UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1]
    );
    expect(unified.label).toBe(`Tier 99`);
  });
});

describe("calculateUnifiedTiers GMM-failure fallback", () => {
  // Reset only the call/result history before each fallback test; the delegating
  // default implementation is left intact.
  beforeEach(() => {
    mockedClusterWithGMM.mockClear();
  });

  const throwOnce = () =>
    mockedClusterWithGMM.mockImplementationOnce(() => {
      throw new Error("forced GMM failure");
    });

  it("falls back to the value-drop method when GMM throws", () => {
    const players = [
      makePlayer("fb-a", 1),
      makePlayer("fb-b", 2),
      makePlayer("fb-c", 3),
      makePlayer("fb-d", 12),
      makePlayer("fb-e", 13),
      makePlayer("fb-f", 14),
      makePlayer("fb-g", 30),
      makePlayer("fb-h", 31),
    ];

    throwOnce();
    const tiers = calculateUnifiedTiers(players, 4, "ppr");

    // The GMM call was attempted and threw, so a fallback branch ran.
    expect(mockedClusterWithGMM).toHaveBeenCalledTimes(1);
    expect(mockedClusterWithGMM.mock.results[0].type).toBe("throw");

    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers.length).toBeLessThanOrEqual(4);

    // Every input player lands in exactly one tier.
    const placed = tiers.flatMap((t) => t.players.map((p) => p.id));
    expect(placed.sort()).toEqual(players.map((p) => p.id).sort());

    tiers.forEach((t, i) => {
      expect(t.tier).toBe(i + 1);
      expect(UNIFIED_TIER_COLORS).toContain(t.color);
      expect(typeof t.label).toBe("string");
      // avgValue is only set by the value-drop method (rank-gap leaves it
      // undefined), so its presence proves the first fallback ran.
      expect(t.avgValue).toEqual(expect.any(Number));
    });

    // Positional ranks are contiguous and cover the whole board 1..N.
    expect(tiers[0].minRank).toBe(1);
    expect(tiers[tiers.length - 1].maxRank).toBe(players.length);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].minRank).toBe(tiers[i - 1].maxRank + 1);
    }
  });

  it("orders getPlayerValue by position scarcity multipliers", () => {
    // All players share averageRank 5 so the base value (100/sqrt(rank)) is
    // identical; projectedPoints/standardDeviation are zeroed so the only
    // differentiator is the position multiplier. Pairs keep each position in its
    // own tier under the value-drop breaks. "half_ppr" avoids the PPR WR bonus.
    const positions: Player["position"][] = [
      "RB",
      "RB",
      "TE",
      "TE",
      "WR",
      "WR",
      "QB",
      "QB",
      "DST",
      "DST",
      "K",
      "K",
    ];
    const players = positions.map((position, i) =>
      makePlayer(`pv-${i}`, 5, {
        position,
        projectedPoints: 0,
        standardDeviation: 0,
      })
    );

    throwOnce();
    const tiers = calculateUnifiedTiers(players, 6, "half_ppr");

    expect(mockedClusterWithGMM.mock.results[0].type).toBe("throw");
    expect(tiers).toHaveLength(6);

    // Tiers separate cleanly by position in descending-multiplier order.
    expect(tiers.map((t) => t.players[0].position)).toEqual([
      "RB",
      "TE",
      "WR",
      "QB",
      "DST",
      "K",
    ]);
    tiers.forEach((t) => {
      expect(t.players.every((p) => p.position === t.players[0].position)).toBe(
        true
      );
    });

    // avgValue strictly descends across the scarcity-ordered tiers.
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i - 1].avgValue!).toBeGreaterThan(tiers[i].avgValue!);
    }

    // Each position's value is its multiplier relative to the WR (1.0) baseline.
    const wr = tiers[2].avgValue!;
    expect(tiers[0].avgValue! / wr).toBeCloseTo(1.2, 5); // RB
    expect(tiers[1].avgValue! / wr).toBeCloseTo(1.1, 5); // TE
    expect(tiers[3].avgValue! / wr).toBeCloseTo(0.8, 5); // QB
    expect(tiers[4].avgValue! / wr).toBeCloseTo(0.6, 5); // DST
    expect(tiers[5].avgValue! / wr).toBeCloseTo(0.5, 5); // K
  });

  it("boosts WR value under PPR versus standard in getPlayerValue", () => {
    const wrPlayers = [1, 2, 3, 4].map((r) =>
      makePlayer(`ppr-wr-${r}`, r, {
        position: "WR",
        projectedPoints: 0,
        standardDeviation: 0,
      })
    );

    throwOnce();
    const pprTiers = calculateUnifiedTiers(wrPlayers, 2, "ppr");
    throwOnce();
    const standardTiers = calculateUnifiedTiers(wrPlayers, 2, "standard");

    expect(mockedClusterWithGMM).toHaveBeenCalledTimes(2);
    expect(
      mockedClusterWithGMM.mock.results.every((r) => r.type === "throw")
    ).toBe(true);

    // The 1.1x PPR bonus scales every WR uniformly, so composition is unchanged
    // and each tier's value is exactly 1.1x its standard-scoring counterpart.
    expect(pprTiers.length).toBe(standardTiers.length);
    for (let i = 0; i < pprTiers.length; i++) {
      expect(pprTiers[i].avgValue! / standardTiers[i].avgValue!).toBeCloseTo(
        1.1,
        5
      );
    }
  });

  it("boosts RB value under standard versus PPR in getPlayerValue", () => {
    const rbPlayers = [1, 2, 3, 4].map((r) =>
      makePlayer(`std-rb-${r}`, r, {
        position: "RB",
        projectedPoints: 0,
        standardDeviation: 0,
      })
    );

    // The RB standard bonus branch keys off the exact string "STANDARD"; the
    // "ppr" run gives RBs no bonus, isolating the 1.1x adjustment.
    throwOnce();
    const standardTiers = calculateUnifiedTiers(rbPlayers, 2, "STANDARD");
    throwOnce();
    const pprTiers = calculateUnifiedTiers(rbPlayers, 2, "ppr");

    expect(
      mockedClusterWithGMM.mock.results.every((r) => r.type === "throw")
    ).toBe(true);

    // RBs get the 1.1x bump only under standard scoring.
    expect(standardTiers.length).toBe(pprTiers.length);
    for (let i = 0; i < standardTiers.length; i++) {
      expect(standardTiers[i].avgValue! / pprTiers[i].avgValue!).toBeCloseTo(
        1.1,
        5
      );
    }
  });

  it("respects maxTiers and minTierSize in findTierBreaks", () => {
    const maxTiers = 3;
    // Ranks 1..24 give strictly decreasing base values, so value drops are
    // largest at the front. minTierSize = max(2, floor(24 / (3*2))) = 4.
    const players = Array.from({ length: 24 }, (_, i) =>
      makePlayer(`brk-${i}`, i + 1)
    );
    const minTierSize = Math.max(
      2,
      Math.floor(players.length / (maxTiers * 2))
    );
    expect(minTierSize).toBe(4);

    throwOnce();
    const tiers = calculateUnifiedTiers(players, maxTiers, "half_ppr");

    expect(mockedClusterWithGMM.mock.results[0].type).toBe("throw");

    // maxTiers is an upper bound even though more sizeable value drops exist.
    expect(tiers.length).toBeLessThanOrEqual(maxTiers);
    expect(tiers.length).toBe(3);

    // Interior tiers are each bounded by two breaks spaced >= minTierSize apart.
    const interior = tiers.slice(1, -1);
    expect(interior.length).toBeGreaterThan(0);
    interior.forEach((t) => {
      expect(t.players.length).toBeGreaterThanOrEqual(minTierSize);
    });
    // The middle tier here holds exactly minTierSize players.
    expect(tiers[1].players.length).toBe(minTierSize);

    // Positional ranks remain contiguous across every fallback tier.
    expect(tiers[0].minRank).toBe(1);
    expect(tiers[tiers.length - 1].maxRank).toBe(players.length);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].minRank).toBe(tiers[i - 1].maxRank + 1);
    }
  });
});
