/**
 * @jest-environment node
 */
import {
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  getFantasyPlayersForPosition,
} from "@/lib/fantasy";
import {
  loadFantasySnapshot,
  loadFantasySnapshotSeed,
  resetFantasySnapshotCache,
} from "@/lib/fantasySnapshotServer";
import { buildFantasyVorpIndex, sortPlayersByVorpRank } from "@/lib/fantasyVorp";
import type { Player } from "@/types";

const ids = (players: readonly Player[]) => players.map((player) => player.id);

describe("fantasySnapshotServer", () => {
  it("serves the parsed snapshot from cache within the TTL", async () => {
    resetFantasySnapshotCache();
    const first = await loadFantasySnapshot("ppr");
    const second = await loadFantasySnapshot("ppr");
    // A cache hit returns the same object; without the cache each call parses
    // the ~700KB file afresh and would return a different reference.
    expect(second).toBe(first);
  });

  it("loads published snapshots from disk with sourced overall metadata", async () => {
    const scoringFormats = {
      ppr: "PPR",
      half_ppr: "HALF_PPR",
      standard: "STANDARD",
    } as const;

    for (const [scoring, expectedFormat] of Object.entries(scoringFormats) as Array<
      [keyof typeof scoringFormats, (typeof scoringFormats)[keyof typeof scoringFormats]]
    >) {
      const snapshot = await loadFantasySnapshot(scoring);

      expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);
      expect(snapshot.scoringFormat).toBe(expectedFormat);
      expect(snapshot.overall.length).toBeGreaterThan(100);
      expect(snapshot.upstreamUpdatedAt).toMatch(/^20\d{2}-/);
      expect(snapshot.sliceMetadata.overall.sourceKind).toBe("overall_consensus");
      expect(snapshot.sliceMetadata.overall.rangeKind).toBe("overall");
      expect(snapshot.sliceMetadata.qb.available).toBe(true);
      expect(snapshot.sliceMetadata.qb.sourceKind).toBe("shared_position_consensus");
      expect(snapshot.overall.every((player) => !("projectedPoints" in player))).toBe(true);
      expect(snapshot.overall.every((player) => !("expertRanks" in player))).toBe(true);
      expect(snapshot.overall.every((player) => !("overallValue" in player))).toBe(true);
    }
  });

  it("returns the right slice for flex when the snapshot supports it", async () => {
    const snapshot = await loadFantasySnapshot("half_ppr");
    const flexPlayers = getFantasyPlayersForPosition(snapshot, "flex");

    expect(snapshot.sliceMetadata.flex.available).toBe(true);
    expect(snapshot.sliceMetadata.flex.sourceKind).toBe("derived_flex");
    expect(flexPlayers.length).toBeGreaterThan(100);
    expect(flexPlayers.every((player) => ["RB", "WR", "TE"].includes(player.position))).toBe(true);
  });
});

describe("loadFantasySnapshotSeed", () => {
  it("seeds the first page of the requested slice in board order and nothing else", async () => {
    const full = await loadFantasySnapshot("ppr");
    const seed = await loadFantasySnapshotSeed({
      scoring: "ppr",
      position: "wr",
      ranking: "consensus",
      teams: 12,
    });

    expect(ids(seed.positions.WR)).toEqual(
      ids(getFantasyPlayersForPosition(full, "wr").slice(0, 40))
    );
    expect(seed.overall).toEqual([]);
    expect(seed.positions.RB).toEqual([]);
    expect(seed.sliceMetadata).toEqual(full.sliceMetadata);
    expect(seed.adpSource).toEqual(full.adpSource);
    expect(seed.vorpSource).toEqual(full.vorpSource);

    const seeded = new Set(ids(seed.positions.WR));
    expect(seed.vorpRankings["10"]).toBeUndefined();
    for (const entry of seed.vorpRankings["12"] ?? []) {
      expect(seeded.has(entry.playerId)).toBe(true);
    }
    // The seed rides in the HTML, so it has to stay small.
    expect(JSON.stringify(seed).length).toBeLessThan(60_000);
  });

  it("seeds the overall board in VORP order when the VORP ranking is requested", async () => {
    const full = await loadFantasySnapshot("ppr");
    const index = buildFantasyVorpIndex(full.vorpRankings, 10);
    if (!full.vorpSource || index.size === 0) return; // a degraded VORP commit has nothing to order

    const seed = await loadFantasySnapshotSeed({
      scoring: "ppr",
      position: "overall",
      ranking: "vorp",
      teams: 10,
    });

    expect(ids(seed.overall)).toEqual(
      ids(sortPlayersByVorpRank(full.overall.filter((player) => index.has(player.id)), index).slice(0, 40))
    );
    expect(seed.positions.WR).toEqual([]);
    expect(seed.vorpRankings["10"]?.length).toBe(40);
  });
});
