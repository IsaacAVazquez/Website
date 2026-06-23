import {
  calculateUnifiedTiers,
  getUnifiedTierColor,
  getUnifiedTierLabel,
  convertToUnifiedTier,
  UNIFIED_TIER_COLORS,
  UNIFIED_TIER_LABELS,
} from "../unifiedTierCalculator";
import type { Player, TierGroup } from "@/types";

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
