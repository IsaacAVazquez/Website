/**
 * @jest-environment node
 */
import {
  FANTASY_ROUTE_POSITIONS,
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  getAllFantasySnapshotPlayers,
  getCrossBoardFantasyPlayers,
  getFantasyPlayersForPosition,
  getFantasySliceMetadata,
  normalizeFantasySnapshot,
  publishFantasyPlayer,
} from "@/lib/fantasy";
import { getValueVsAdp } from "@/lib/fantasyUtils";
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

const VALID_RUNTIME_PLAYER = {
  id: "runtime-rb",
  name: "Runtime Running Back",
  team: "ATL",
  position: "RB",
  averageRank: 1,
  standardDeviation: 0,
};

function buildRuntimeSnapshot() {
  return {
    schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
    season: 2026,
    week: 0,
    generatedAt: "2026-08-09T00:00:00.000Z",
    scoringFormat: "PPR",
    source: "runtime test",
    positions: {},
    overall: [{ ...VALID_RUNTIME_PLAYER }],
  };
}

describe("fantasy snapshot normalization", () => {
  it("rejects a snapshot labeled for a different scoring route", () => {
    expect(() =>
      normalizeFantasySnapshot(
        { ...buildRuntimeSnapshot(), scoringFormat: "STANDARD" },
        "ppr"
      )
    ).toThrow(/scoringFormat.*does not match/i);
  });

  it("rejects an empty payload instead of relabeling it as a usable board", () => {
    expect(() => normalizeFantasySnapshot({}, "ppr")).toThrow(/contains no players/i);
  });

  it.each([
    FANTASY_SNAPSHOT_SCHEMA_VERSION + 1,
    0,
    -1,
    1.5,
    "7",
  ])("rejects unsupported schemaVersion %p", (schemaVersion) => {
    expect(() =>
      normalizeFantasySnapshot({ ...buildRuntimeSnapshot(), schemaVersion }, "ppr")
    ).toThrow(/schemaVersion.*not supported/i);
  });

  it("continues to normalize missing and older schema versions", () => {
    const { schemaVersion: _missingSchemaVersion, ...missingSchema } = buildRuntimeSnapshot();
    expect(normalizeFantasySnapshot(missingSchema, "ppr").overall).toHaveLength(1);
    expect(
      normalizeFantasySnapshot({ ...buildRuntimeSnapshot(), schemaVersion: 1 }, "ppr").overall
    ).toHaveLength(1);
  });

  it.each([undefined, "", "   "])(
    "rejects current-schema provenance %p",
    (source) => {
      expect(() =>
        normalizeFantasySnapshot({ ...buildRuntimeSnapshot(), source }, "ppr")
      ).toThrow(/source is required/i);
    }
  );

  it("keeps the public source default only for a legacy snapshot", () => {
    const legacy = buildRuntimeSnapshot();
    const normalized = normalizeFantasySnapshot(
      { ...legacy, schemaVersion: 1, source: undefined },
      "ppr"
    );

    expect(normalized.source).toMatch(/FantasyPros public consensus pages/);
  });

  it("keeps VORP only when the ranking and its source metadata agree", () => {
    const snapshot = {
      ...buildRuntimeSnapshot(),
      vorpSource: {
        provider: "FantasyPros projected VORP",
        asOf: "2026-08-25T12:00:00.000Z",
        urls: {
          "12": "https://www.fantasypros.com/nfl/rankings/ppr-vorp.php",
        },
        matchedCounts: { "12": 1 },
      },
      vorpRankings: {
        "12": [{ playerId: "runtime-rb", rank: 1, value: 100 }],
      },
    };

    const normalized = normalizeFantasySnapshot(snapshot, "ppr");
    expect(normalized.vorpSource).toEqual(snapshot.vorpSource);
    expect(normalized.vorpRankings["12"]).toEqual([
      { playerId: "runtime-rb", rank: 1, value: 100 },
    ]);

    const mismatched = normalizeFantasySnapshot(
      {
        ...snapshot,
        vorpSource: {
          ...snapshot.vorpSource,
          matchedCounts: { "12": 2 },
        },
      },
      "ppr"
    );
    expect(mismatched.vorpSource).toBeNull();
    expect(mismatched.vorpRankings).toEqual({});
  });

  it.each([
    ["id", "   "],
    ["name", ""],
    ["team", "   "],
    ["position", "FLEX"],
    ["averageRank", 0],
    ["averageRank", Number.NaN],
    ["standardDeviation", -1],
    ["standardDeviation", Number.POSITIVE_INFINITY],
  ])("rejects a player with invalid %s", (field, value) => {
    const snapshot = buildRuntimeSnapshot();
    snapshot.overall = [{ ...VALID_RUNTIME_PLAYER, [field]: value }];

    expect(() => normalizeFantasySnapshot(snapshot, "ppr")).toThrow(
      new RegExp(String(field), "i")
    );
  });

  it("preserves an unavailable expert spread without inventing a value", () => {
    const snapshot = buildRuntimeSnapshot();
    delete (snapshot.overall[0] as Partial<Player>).standardDeviation;

    const normalized = normalizeFantasySnapshot(snapshot, "ppr");

    expect(normalized.overall[0].standardDeviation).toBeUndefined();
    expect(normalized.overall[0]).not.toHaveProperty("standardDeviation");
  });

  it("rejects duplicate ids within a slice and players in the wrong position slice", () => {
    const duplicateIds = buildRuntimeSnapshot();
    duplicateIds.overall = [
      { ...VALID_RUNTIME_PLAYER },
      { ...VALID_RUNTIME_PLAYER, name: "Duplicate Player" },
    ];
    expect(() => normalizeFantasySnapshot(duplicateIds, "ppr")).toThrow(/duplicate player id/i);

    const wrongSlice = buildRuntimeSnapshot();
    wrongSlice.positions = {
      RB: [{ ...VALID_RUNTIME_PLAYER, position: "WR" }],
    };
    expect(() => normalizeFantasySnapshot(wrongSlice, "ppr")).toThrow(/RB.*position WR/i);
  });

  it("drops only the unusable rows in lenient mode instead of blanking the board", () => {
    const snapshot = buildRuntimeSnapshot();
    snapshot.overall = [
      { ...VALID_RUNTIME_PLAYER, id: "keep-1", name: "Keeper One" },
      { ...VALID_RUNTIME_PLAYER, id: "drop-1", name: "Bad Rank", averageRank: 0 },
      { ...VALID_RUNTIME_PLAYER, id: "keep-2", name: "Keeper Two" },
    ];

    // Strict is the default and still refuses the whole snapshot.
    expect(() => normalizeFantasySnapshot(snapshot, "ppr")).toThrow(/averageRank/i);

    const lenient = normalizeFantasySnapshot(snapshot, "ppr", { lenient: true });
    expect(lenient.overall.map((player) => player.id)).toEqual(["keep-1", "keep-2"]);
  });

  it("allows actual RB, WR, and TE positions in the FLEX slice", () => {
    const snapshot = buildRuntimeSnapshot();
    snapshot.positions = {
      FLEX: (["RB", "WR", "TE"] as const).map((position, index) => ({
        ...VALID_RUNTIME_PLAYER,
        id: `flex-${position}`,
        name: `Flex Player ${index + 1}`,
        position,
        averageRank: index + 1,
      })),
    };

    expect(normalizeFantasySnapshot(snapshot, "ppr").positions.FLEX).toHaveLength(3);
  });

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

  it("strips position-scale rank fields from position-only players in the cross-board union", () => {
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
              id: "rb-deep",
              name: "Deep Back",
              team: "GB",
              position: "RB",
              // Position-board scale: RB139, not overall pick 139.
              averageRank: 139,
              standardDeviation: 9,
              rankEcr: 139,
              rankAverage: 139.4,
              positionRank: 139,
              minRank: 120,
              maxRank: 160,
              tier: 12,
              adp: 163.5,
              adpTimesDrafted: 40,
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
            rankEcr: 1,
            tier: 1,
          },
        ],
      },
      "ppr"
    );

    const [overallPlayer, positionOnlyPlayer] = getCrossBoardFantasyPlayers(snapshot);
    expect(overallPlayer).toMatchObject({ id: "rb-1", rankEcr: 1, tier: 1, averageRank: 1 });
    expect(positionOnlyPlayer.id).toBe("rb-deep");
    expect(positionOnlyPlayer.rankEcr).toBeUndefined();
    expect(positionOnlyPlayer.rankAverage).toBeUndefined();
    expect(positionOnlyPlayer.minRank).toBeUndefined();
    expect(positionOnlyPlayer.maxRank).toBeUndefined();
    expect(positionOnlyPlayer.tier).toBeUndefined();
    expect(positionOnlyPlayer.standardDeviation).toBeUndefined();
    expect(positionOnlyPlayer.averageRank).toBeNaN();
    // The overall-scale market price and the honestly labeled position rank survive.
    expect(positionOnlyPlayer).toMatchObject({ positionRank: 139, adp: 163.5, adpTimesDrafted: 40 });
    // With the expert rank gone, getValueVsAdp can no longer manufacture a
    // cross-scale Value chip for this player (the original compare-tray bug).
    expect(getValueVsAdp(positionOnlyPlayer)).toBeNull();
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

  it("omits an unavailable expert spread", () => {
    const { standardDeviation: _spread, ...playerWithoutSpread } = basePlayer;
    expect(publishFantasyPlayer(playerWithoutSpread as Player)).not.toHaveProperty(
      "standardDeviation"
    );
  });

  it("publishes finite ADP uncertainty and sample fields", () => {
    expect(
      publishFantasyPlayer({
        ...basePlayer,
        adpHigh: 8,
        adpLow: 22,
        adpStandardDeviation: 3.4,
        adpTimesDrafted: 91,
      })
    ).toMatchObject({
      adpHigh: 8,
      adpLow: 22,
      adpStandardDeviation: 3.4,
      adpTimesDrafted: 91,
    });

    const invalid = publishFantasyPlayer({
      ...basePlayer,
      adpHigh: Number.NaN,
      adpLow: Number.POSITIVE_INFINITY,
      adpStandardDeviation: Number.NaN,
      adpTimesDrafted: Number.NaN,
    });
    expect("adpHigh" in invalid).toBe(false);
    expect("adpLow" in invalid).toBe(false);
    expect("adpStandardDeviation" in invalid).toBe(false);
    expect("adpTimesDrafted" in invalid).toBe(false);
  });
});
