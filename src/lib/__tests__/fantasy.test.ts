/**
 * @jest-environment node
 */
import { FANTASY_SNAPSHOT_SCHEMA_VERSION, normalizeFantasySnapshot } from "@/lib/fantasy";

describe("fantasy snapshot normalization", () => {
  it("normalizes a legacy PPR snapshot and keeps real position slices available", () => {
    const snapshot = normalizeFantasySnapshot(
      {
        season: 2026,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "PPR",
        source: "legacy snapshot",
        positions: {
          QB: [
            {
              id: "legacy-qb",
              name: "Josh Allen",
              team: "BUF",
              position: "QB",
              averageRank: 2,
              standardDeviation: 1.2,
              lastUpdated: "2026-04-15T15:29:20.000Z",
            },
          ],
        },
        overall: [
          {
            id: "legacy-wr",
            name: "Ja'Marr Chase",
            team: "CIN",
            position: "WR",
            averageRank: 1,
            standardDeviation: 1.1,
            lastUpdated: "2026-04-15T15:29:20.000Z",
          },
        ],
      },
      "ppr"
    );

    expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);
    expect(snapshot.upstreamUpdatedAt).toBe("2026-04-15T15:29:20.000Z");
    expect(snapshot.sliceMetadata.overall.available).toBe(true);
    expect(snapshot.sliceMetadata.qb.available).toBe(true);
    expect(snapshot.sliceMetadata.qb.sourceKind).toBe("shared_position_consensus");
    expect(snapshot.positions.QB).toHaveLength(1);
  });

  it("keeps half-ppr DST available when legacy data provides a real slice", () => {
    const snapshot = normalizeFantasySnapshot(
      {
        season: 2026,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "HALF_PPR",
        source: "legacy snapshot",
        positions: {
          DST: [
            {
              id: "legacy-dst",
              name: "Denver Broncos",
              team: "DEN",
              position: "DST",
              averageRank: 12,
              standardDeviation: 2,
              lastUpdated: "2026-04-15T15:29:20.000Z",
            },
          ],
        },
        overall: [
          {
            id: "legacy-rb",
            name: "Bijan Robinson",
            team: "ATL",
            position: "RB",
            averageRank: 1,
            standardDeviation: 1.1,
            lastUpdated: "2026-04-15T15:29:20.000Z",
          },
        ],
      },
      "half_ppr"
    );

    expect(snapshot.sliceMetadata.dst.available).toBe(true);
    expect(snapshot.sliceMetadata.dst.sourceKind).toBe("shared_position_consensus");
    expect(snapshot.positions.DST).toHaveLength(1);
  });

  it("still refuses to synthesize a position board from overall-only legacy data", () => {
    const snapshot = normalizeFantasySnapshot(
      {
        season: 2026,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "PPR",
        source: "legacy snapshot",
        positions: {},
        overall: [
          {
            id: "legacy-rb",
            name: "Saquon Barkley",
            team: "PHI",
            position: "RB",
            averageRank: 1,
            standardDeviation: 1.4,
            lastUpdated: "2026-04-15T15:29:20.000Z",
          },
        ],
      },
      "ppr"
    );

    expect(snapshot.sliceMetadata.rb.available).toBe(false);
    expect(snapshot.positions.RB).toHaveLength(0);
  });
});
