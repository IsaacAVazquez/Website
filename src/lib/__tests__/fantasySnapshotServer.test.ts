/**
 * @jest-environment node
 */
import { FANTASY_SNAPSHOT_SCHEMA_VERSION, getFantasyPlayersForPosition } from "@/lib/fantasy";
import { loadFantasySnapshot } from "@/lib/fantasySnapshotServer";

describe("fantasySnapshotServer", () => {
  it("loads published snapshots from disk", async () => {
    const snapshot = await loadFantasySnapshot("ppr");

    expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);
    expect(snapshot.scoringFormat).toBe("PPR");
    expect(snapshot.overall.length).toBeGreaterThan(100);
    expect(snapshot.sliceMetadata.qb.available).toBe(true);
    expect(snapshot.sliceMetadata.qb.sourceKind).toBe("shared_position_consensus");
  });

  it("returns the right slice for flex when the snapshot supports it", async () => {
    const snapshot = await loadFantasySnapshot("half_ppr");
    const flexPlayers = getFantasyPlayersForPosition(snapshot, "flex");

    expect(snapshot.sliceMetadata.flex.available).toBe(true);
    expect(flexPlayers.length).toBeGreaterThan(100);
    expect(flexPlayers.every((player) => ["RB", "WR", "TE"].includes(player.position))).toBe(true);
  });
});
