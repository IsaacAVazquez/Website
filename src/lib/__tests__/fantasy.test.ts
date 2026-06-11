/**
 * @jest-environment node
 */
import {
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  normalizeFantasySnapshot,
  publishFantasyPlayer,
} from "@/lib/fantasy";
import type { Player } from "@/types";

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

  it("collapses adp provenance to null for schema-5 payloads that predate it", () => {
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

    expect(snapshot.adpSource).toBeNull();
  });

  it("round-trips a valid adp provenance block and rejects malformed ones", () => {
    const base = {
      season: 2026,
      week: 0,
      generatedAt: "2026-06-10T00:00:00.000Z",
      scoringFormat: "PPR",
      source: "snapshot",
      positions: {},
      overall: [
        {
          id: "rb-1",
          name: "Bijan Robinson",
          team: "ATL",
          position: "RB",
          averageRank: 1,
          standardDeviation: 1.1,
          adp: 2.2,
          lastUpdated: "2026-06-08T15:29:20.000Z",
        },
      ],
    };

    const withAdp = normalizeFantasySnapshot(
      {
        ...base,
        adpSource: {
          provider: "Fantasy Football Calculator",
          url: "https://example.test/adp",
          asOf: "2026-06-07T00:00:00.000Z",
          sampleSize: 421,
          matchedCount: 180,
        },
      },
      "ppr"
    );

    expect(withAdp.adpSource).toEqual({
      provider: "Fantasy Football Calculator",
      url: "https://example.test/adp",
      asOf: "2026-06-07T00:00:00.000Z",
      sampleSize: 421,
      matchedCount: 180,
    });
    expect(withAdp.overall[0].adp).toBe(2.2);

    const missingProvider = normalizeFantasySnapshot(
      { ...base, adpSource: { url: "https://example.test", matchedCount: 10 } },
      "ppr"
    );
    expect(missingProvider.adpSource).toBeNull();

    const zeroMatches = normalizeFantasySnapshot(
      { ...base, adpSource: { provider: "Somewhere", url: "", matchedCount: 0 } },
      "ppr"
    );
    expect(zeroMatches.adpSource).toBeNull();
  });
});

describe("publishFantasyPlayer", () => {
  const basePlayer: Player = {
    id: "p1",
    name: "Test Player",
    team: "SF",
    position: "RB",
    averageRank: 10,
    standardDeviation: 1,
  } as Player;

  it("publishes a finite adp and drops a non-finite one", () => {
    expect(publishFantasyPlayer({ ...basePlayer, adp: 12.4 }).adp).toBe(12.4);
    expect("adp" in publishFantasyPlayer({ ...basePlayer, adp: Number.NaN })).toBe(false);
    expect("adp" in publishFantasyPlayer(basePlayer)).toBe(false);
  });
});
