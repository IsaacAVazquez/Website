/**
 * @jest-environment node
 */
import { FANTASY_SNAPSHOT_SCHEMA_VERSION, FantasySnapshot } from "@/lib/fantasy";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";

function countOverallPositionMismatches(snapshot: FantasySnapshot): number {
  const overallById = new Map(snapshot.overall.map((player) => [player.id, player]));
  let mismatches = 0;

  for (const position of ["QB", "RB", "WR", "TE", "K", "DST"] as const) {
    for (const player of snapshot.positions[position]) {
      const overallPlayer = overallById.get(player.id);

      if (
        !overallPlayer ||
        overallPlayer.projectedPoints !== player.projectedPoints ||
        overallPlayer.positionRank !== player.positionRank
      ) {
        mismatches += 1;
      }
    }
  }

  return mismatches;
}

describe("fantasySnapshotBuilder", () => {
  it("publishes complete position availability for every scoring format", () => {
    for (const scoring of ["ppr", "half_ppr", "standard"] as const) {
      const snapshot = buildFantasySnapshot(scoring);

      expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);
      expect(snapshot.sliceMetadata.overall.available).toBe(true);
      expect(snapshot.sliceMetadata.overall.sourceKind).toBe("derived_overall");
      expect(snapshot.sliceMetadata.overall.rangeKind).toBe("overall");
      expect(snapshot.sliceMetadata.qb.available).toBe(true);
      expect(snapshot.sliceMetadata.rb.available).toBe(true);
      expect(snapshot.sliceMetadata.wr.available).toBe(true);
      expect(snapshot.sliceMetadata.te.available).toBe(true);
      expect(snapshot.sliceMetadata.flex.available).toBe(true);
      expect(snapshot.sliceMetadata.k.available).toBe(true);
      expect(snapshot.sliceMetadata.dst.available).toBe(true);
      expect(snapshot.positions.RB.length).toBeGreaterThan(50);
      expect(snapshot.positions.FLEX.length).toBeGreaterThan(100);
    }
  });

  it("marks qb, k, and dst as shared scoring-agnostic slices across formats", () => {
    const pprSnapshot = buildFantasySnapshot("ppr");
    const halfPprSnapshot = buildFantasySnapshot("half_ppr");
    const standardSnapshot = buildFantasySnapshot("standard");

    expect(pprSnapshot.sliceMetadata.qb.sourceKind).toBe("shared_position_consensus");
    expect(pprSnapshot.sliceMetadata.k.sourceKind).toBe("shared_position_consensus");
    expect(pprSnapshot.sliceMetadata.dst.sourceKind).toBe("shared_position_consensus");

    expect(pprSnapshot.positions.QB).toEqual(halfPprSnapshot.positions.QB);
    expect(pprSnapshot.positions.QB).toEqual(standardSnapshot.positions.QB);
    expect(pprSnapshot.positions.K).toEqual(halfPprSnapshot.positions.K);
    expect(pprSnapshot.positions.K).toEqual(standardSnapshot.positions.K);
    expect(pprSnapshot.positions.DST).toEqual(halfPprSnapshot.positions.DST);
    expect(pprSnapshot.positions.DST).toEqual(standardSnapshot.positions.DST);
  });

  it("keeps position ranges and projected points position-specific", () => {
    const snapshot = buildFantasySnapshot("standard");
    const topQuarterback = snapshot.positions.QB[0];

    expect(snapshot.sliceMetadata.qb.available).toBe(true);
    expect(snapshot.sliceMetadata.qb.rangeKind).toBe("position");
    expect(topQuarterback.name).toBe("Josh Allen");
    expect(topQuarterback.positionRank).toBe(1);
    expect(Number(topQuarterback.minRank)).toBeGreaterThan(0);
    expect(Number(topQuarterback.maxRank)).toBeGreaterThanOrEqual(Number(topQuarterback.minRank));
    expect(topQuarterback.projectedPoints).toBeGreaterThan(300);
  });

  it("keeps player projections and position ranks aligned between overall and position boards", () => {
    for (const scoring of ["ppr", "half_ppr", "standard"] as const) {
      const snapshot = buildFantasySnapshot(scoring);

      expect(countOverallPositionMismatches(snapshot)).toBe(0);
      expect(snapshot.overall.every((player) => !("overallValue" in player))).toBe(true);
    }
  });

  it("preserves multi-tier data and derives flex tiers from eligible position boards", () => {
    const snapshot = buildFantasySnapshot("ppr");
    const overallTiers = new Set(snapshot.overall.map((player) => player.tier));
    const flexTiers = new Set(snapshot.positions.FLEX.map((player) => player.tier));

    expect(overallTiers.size).toBeGreaterThan(3);
    expect(flexTiers.size).toBeGreaterThan(2);
    expect(snapshot.sliceMetadata.flex.rangeKind).toBe("position");
    expect(snapshot.positions.FLEX.every((player) => ["RB", "WR", "TE"].includes(player.position))).toBe(true);
  });

  it("falls back to default overall tier breaks when smooth overall values do not create natural gaps", () => {
    const createPlayers = (position: "QB" | "RB" | "WR" | "TE" | "K" | "DST", teamPrefix: string) =>
      Array.from({ length: 20 }, (_, index) => ({
        id: `${position}-${index + 1}`,
        name: `${position} ${index + 1}`,
        team: `${teamPrefix}${index % 10}`,
        position,
        averageRank: index + 1,
        projectedPoints: 250 - index,
        standardDeviation: 1,
        minRank: index + 1,
        maxRank: index + 1,
        expertRanks: [index + 1],
      }));

    const syntheticPositionData = {
      QB: createPlayers("QB", "Q"),
      RB: createPlayers("RB", "R"),
      WR: createPlayers("WR", "W"),
      TE: createPlayers("TE", "T"),
      K: createPlayers("K", "K"),
      DST: createPlayers("DST", "D"),
    };

    jest.resetModules();
    jest.doMock("@/lib/fantasyPositionData", () => ({
      getFantasyPositionData: (position: keyof typeof syntheticPositionData) =>
        syntheticPositionData[position] ?? [],
    }));
    jest.doMock("@/lib/overallValueCalculator", () => ({
      calculateOverallRankings: (players: typeof syntheticPositionData.QB) =>
        [...players]
          .sort((left, right) => Number(left.averageRank) - Number(right.averageRank))
          .map((player, index) => ({
            player,
            overallValue: 500 - index * 2,
            overallRank: index + 1,
            positionValue: 1,
            formatAdjustment: 1,
            scarcityBonus: 1,
            originalRank: Number(player.averageRank),
          })),
    }));

    try {
      jest.isolateModules(() => {
        const {
          buildFantasySnapshot: buildSyntheticFantasySnapshot,
        } = require("../fantasySnapshotBuilder") as typeof import("../fantasySnapshotBuilder");
        const snapshot = buildSyntheticFantasySnapshot("ppr");
        const overallTiers = new Set(snapshot.overall.map((player) => player.tier));

        expect(snapshot.sliceMetadata.overall.sourceKind).toBe("derived_overall");
        expect(overallTiers.size).toBeGreaterThan(3);
        expect(snapshot.overall.every((player) => !("overallValue" in player))).toBe(true);
      });
    } finally {
      jest.dontMock("@/lib/fantasyPositionData");
      jest.dontMock("@/lib/overallValueCalculator");
      jest.resetModules();
    }
  });
});
