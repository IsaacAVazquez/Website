/**
 * @jest-environment node
 */
import {
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  getFantasyPlayersForPosition,
} from "@/lib/fantasy";
import { loadFantasySnapshot } from "@/lib/fantasySnapshotServer";

describe("fantasySnapshotServer", () => {
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
