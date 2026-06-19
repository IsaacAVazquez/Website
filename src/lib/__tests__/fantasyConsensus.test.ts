import { getConsensusSpread, getTierGap, withTierBreaks } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

function player(overrides: Partial<Player>): Player {
  return {
    id: "p",
    name: "Test Player",
    team: "FA",
    position: "RB",
    averageRank: 10,
    standardDeviation: 1,
    ...overrides,
  } as Player;
}

describe("getConsensusSpread", () => {
  it("labels a settled elite player as tight", () => {
    const result = getConsensusSpread(player({ rankEcr: 1, standardDeviation: 1 }));
    expect(result?.level).toBe("tight");
  });

  it("labels a high-disagreement player as volatile", () => {
    const result = getConsensusSpread(player({ rankEcr: 24, standardDeviation: 13 }));
    expect(result?.level).toBe("volatile");
  });

  it("returns null when there is no usable rank or spread", () => {
    expect(
      getConsensusSpread(player({ rankEcr: undefined, averageRank: NaN, standardDeviation: 5 }))
    ).toBeNull();
    expect(getConsensusSpread(player({ rankEcr: 5, standardDeviation: NaN }))).toBeNull();
  });
});

describe("withTierBreaks", () => {
  it("marks the first row of each tier as a break", () => {
    const rows = withTierBreaks([
      player({ id: "a", tier: 1 }),
      player({ id: "b", tier: 1 }),
      player({ id: "c", tier: 2 }),
      player({ id: "d", tier: 2 }),
    ]);

    expect(rows.map((r) => r.startsTier)).toEqual([true, false, true, false]);
    expect(rows[2].tier).toBe(2);
  });

  it("never starts a break on an untiered row", () => {
    const rows = withTierBreaks([player({ id: "a", tier: undefined }), player({ id: "b", tier: undefined })]);
    expect(rows.every((r) => !r.startsTier)).toBe(true);
  });
});

describe("getTierGap", () => {
  it("returns the rounded downward step between tiers", () => {
    expect(getTierGap(8, 17)).toBe(9);
  });

  it("returns 0 for non-downward or invalid input", () => {
    expect(getTierGap(20, 10)).toBe(0);
    expect(getTierGap(undefined, 10)).toBe(0);
  });
});
