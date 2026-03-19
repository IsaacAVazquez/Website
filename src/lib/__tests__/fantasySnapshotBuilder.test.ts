/**
 * @jest-environment node
 */
import { FANTASY_SNAPSHOT_SCHEMA_VERSION } from "@/lib/fantasy";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";

describe("fantasySnapshotBuilder", () => {
  it("publishes complete position availability for every scoring format", () => {
    for (const scoring of ["ppr", "half_ppr", "standard"] as const) {
      const snapshot = buildFantasySnapshot(scoring);

      expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);
      expect(snapshot.sliceMetadata.overall.available).toBe(true);
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

  it("preserves multi-tier data and derives flex tiers from eligible position boards", () => {
    const snapshot = buildFantasySnapshot("ppr");
    const overallTiers = new Set(snapshot.overall.map((player) => player.tier));
    const flexTiers = new Set(snapshot.positions.FLEX.map((player) => player.tier));

    expect(overallTiers.size).toBeGreaterThan(3);
    expect(flexTiers.size).toBeGreaterThan(2);
    expect(snapshot.sliceMetadata.flex.rangeKind).toBe("position");
    expect(snapshot.positions.FLEX.every((player) => ["RB", "WR", "TE"].includes(player.position))).toBe(true);
  });
});
