/**
 * @jest-environment node
 */
import { FANTASY_SNAPSHOT_SCHEMA_VERSION } from "@/lib/fantasy";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";

describe("fantasySnapshotBuilder", () => {
  it("publishes sourced overall and position availability for every scoring format", () => {
    for (const scoring of ["ppr", "half_ppr", "standard"] as const) {
      const snapshot = buildFantasySnapshot(scoring);

      expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);
      expect(snapshot.upstreamUpdatedAt).toMatch(/^20\d{2}-/);
      expect(snapshot.sliceMetadata.overall.available).toBe(true);
      expect(snapshot.sliceMetadata.overall.sourceKind).toBe("overall_consensus");
      expect(snapshot.sliceMetadata.overall.rangeKind).toBe("overall");
      expect(snapshot.sliceMetadata.overall.updatedAt).toBe(snapshot.upstreamUpdatedAt);
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

  it("keeps sourced position ranges and freshness metadata", () => {
    const snapshot = buildFantasySnapshot("standard");
    const topQuarterback = snapshot.positions.QB[0];

    expect(snapshot.sliceMetadata.qb.available).toBe(true);
    expect(snapshot.sliceMetadata.qb.rangeKind).toBe("position");
    expect(snapshot.sliceMetadata.qb.updatedAt).toMatch(/^20\d{2}-/);
    expect(topQuarterback.name).toBe("Josh Allen");
    expect(topQuarterback.positionRank).toBe(1);
    expect(Number(topQuarterback.minRank)).toBeGreaterThan(0);
    expect(Number(topQuarterback.maxRank)).toBeGreaterThanOrEqual(Number(topQuarterback.minRank));
  });

  it("does not publish synthetic projections, expert rank arrays, or empty adp placeholders", () => {
    const snapshot = buildFantasySnapshot("ppr");
    const firstOverallPlayer = snapshot.overall[0];
    const firstPositionPlayer = snapshot.positions.RB[0];

    expect(firstOverallPlayer).toBeDefined();
    expect("projectedPoints" in firstOverallPlayer).toBe(false);
    expect("expertRanks" in firstOverallPlayer).toBe(false);
    expect("adp" in firstOverallPlayer).toBe(false);
    expect("projectedPoints" in firstPositionPlayer).toBe(false);
    expect("expertRanks" in firstPositionPlayer).toBe(false);
    expect("adp" in firstPositionPlayer).toBe(false);
  });

  it("derives flex from the sourced overall board and preserves eligible positions", () => {
    const snapshot = buildFantasySnapshot("ppr");

    expect(snapshot.sliceMetadata.flex.sourceKind).toBe("derived_flex");
    expect(snapshot.sliceMetadata.flex.rangeKind).toBe("overall");
    expect(snapshot.sliceMetadata.flex.updatedAt).toBe(snapshot.sliceMetadata.overall.updatedAt);
    expect(snapshot.positions.FLEX.every((player) => ["RB", "WR", "TE"].includes(player.position))).toBe(true);
    expect(snapshot.positions.FLEX[0].averageRank).toBe(1);
  });

  it("uses the mocked sourced overall board when isolated with synthetic public data", () => {
    const createPlayers = (position: "QB" | "RB" | "WR" | "TE" | "K" | "DST", teamPrefix: string) =>
      Array.from({ length: 20 }, (_, index) => ({
        id: `${position}-${index + 1}`,
        name: `${position} ${index + 1}`,
        team: `${teamPrefix}${index % 10}`,
        position,
        averageRank: index + 1,
        rankEcr: index + 1,
        rankAverage: index + 1.25,
        standardDeviation: 1,
        minRank: index + 1,
        maxRank: index + 2,
        positionRank: index + 1,
        tier: Math.floor(index / 5) + 1,
        lastUpdated: "2026-04-15T15:29:20.000Z",
        projectedPoints: 0,
        expertRanks: [],
      }));

    const syntheticPositionData = {
      QB: createPlayers("QB", "Q"),
      RB: createPlayers("RB", "R"),
      WR: createPlayers("WR", "W"),
      TE: createPlayers("TE", "T"),
      K: createPlayers("K", "K"),
      DST: createPlayers("DST", "D"),
    };
    const syntheticOverall = [
      ...syntheticPositionData.RB,
      ...syntheticPositionData.WR,
      ...syntheticPositionData.QB,
      ...syntheticPositionData.TE,
      ...syntheticPositionData.K,
      ...syntheticPositionData.DST,
    ].map((player, index) => ({
      ...player,
      averageRank: index + 1,
      rankEcr: index + 1,
      rankAverage: index + 1.25,
    }));

    jest.resetModules();
    jest.doMock("@/lib/fantasyPositionData", () => ({
      getFantasyOverallData: () => syntheticOverall,
      getFantasyPositionData: (position: keyof typeof syntheticPositionData) =>
        syntheticPositionData[position] ?? [],
      getFantasyPositionDataMetadata: () => ({
        generatedAt: "2026-04-15T16:00:00.000Z",
        source: "mock",
        upstreamUpdatedAt: "2026-04-15T15:29:20.000Z",
      }),
    }));

    try {
      jest.isolateModules(() => {
        const {
          buildFantasySnapshot: buildSyntheticFantasySnapshot,
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
        } = require("../fantasySnapshotBuilder") as typeof import("../fantasySnapshotBuilder");
        const snapshot = buildSyntheticFantasySnapshot("ppr");

        expect(snapshot.sliceMetadata.overall.sourceKind).toBe("overall_consensus");
        expect(snapshot.overall[0].id).toBe("RB-1");
        expect(snapshot.positions.FLEX[0].averageRank).toBe(1);
        expect(snapshot.sliceMetadata.flex.updatedAt).toBe("2026-04-15T15:29:20.000Z");
      });
    } finally {
      jest.dontMock("@/lib/fantasyPositionData");
      jest.resetModules();
    }
  });
});
