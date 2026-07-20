/**
 * @jest-environment node
 */
import {
  FANTASY_ROUTE_POSITIONS,
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  getAllFantasySnapshotPlayers,
  getFantasyPlayersForPosition,
  getFantasySliceMetadata,
  normalizeFantasySnapshot,
  publishFantasyPlayer,
} from "@/lib/fantasy";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Player } from "@/types";

const PUBLISHED_SCORING_SNAPSHOTS = [
  ["ppr", "PPR"],
  ["half_ppr", "HALF_PPR"],
  ["standard", "STANDARD"],
] as const;

function readPublishedSnapshot(scoring: (typeof PUBLISHED_SCORING_SNAPSHOTS)[number][0]) {
  return JSON.parse(
    readFileSync(join(process.cwd(), "public", "data", "fantasy", `${scoring}.json`), "utf8")
  ) as unknown;
}

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
    expect(getAllFantasySnapshotPlayers(snapshot).map((player) => player.id)).toEqual([
      "legacy-rb",
      "legacy-dst",
    ]);
  });

  it("unions position-only players without duplicating FLEX entries", () => {
    const snapshot = normalizeFantasySnapshot(
      {
        season: 2026,
        week: 0,
        generatedAt: "2026-07-01T00:00:00.000Z",
        scoringFormat: "PPR",
        source: "snapshot",
        positions: {
          RB: [
            {
              id: "rb-1",
              name: "Ranked Back",
              team: "ATL",
              position: "RB",
              averageRank: 1,
              standardDeviation: 1,
            },
          ],
          FLEX: [
            {
              id: "rb-1",
              name: "Ranked Back",
              team: "ATL",
              position: "RB",
              averageRank: 1,
              standardDeviation: 1,
            },
          ],
          K: [
            {
              id: "k-1",
              name: "Specialist Kicker",
              team: "DAL",
              position: "K",
              averageRank: 1,
              standardDeviation: 1,
            },
          ],
        },
        overall: [
          {
            id: "rb-1",
            name: "Ranked Back",
            team: "ATL",
            position: "RB",
            averageRank: 1,
            standardDeviation: 1,
          },
        ],
      },
      "ppr"
    );

    expect(getAllFantasySnapshotPlayers(snapshot).map((player) => player.id)).toEqual([
      "rb-1",
      "k-1",
    ]);
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

describe("published fantasy scoring snapshots", () => {
  it.each(PUBLISHED_SCORING_SNAPSHOTS)(
    "keeps every %s board published and internally consistent",
    (scoring, expectedFormat) => {
      const snapshot = normalizeFantasySnapshot(readPublishedSnapshot(scoring), scoring);

      expect(snapshot.scoringFormat).toBe(expectedFormat);
      expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);

      for (const position of FANTASY_ROUTE_POSITIONS) {
        const players = getFantasyPlayersForPosition(snapshot, position);
        const metadata = getFantasySliceMetadata(snapshot, position);

        expect(metadata.available).toBe(true);
        expect(metadata.playerCount).toBe(players.length);
        expect(players.length).toBeGreaterThan(0);
        expect(new Set(players.map((player) => player.id)).size).toBe(players.length);
        expect(players.every((player) => Number.isFinite(player.averageRank))).toBe(true);
      }
    }
  );

  it("ships genuinely distinct rankings for the three scoring formats", () => {
    const rankingSignature = (scoring: (typeof PUBLISHED_SCORING_SNAPSHOTS)[number][0]) =>
      normalizeFantasySnapshot(readPublishedSnapshot(scoring), scoring)
        .overall.slice(0, 25)
        .map((player) => `${player.id}:${player.averageRank}`)
        .join("|");

    const signatures = PUBLISHED_SCORING_SNAPSHOTS.map(([scoring]) => rankingSignature(scoring));
    expect(new Set(signatures).size).toBe(PUBLISHED_SCORING_SNAPSHOTS.length);
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
