/**
 * @jest-environment node
 */
import {
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  FantasySnapshot,
  getFantasyPlayersForPosition,
} from "@/lib/fantasy";
import { loadFantasySnapshot } from "@/lib/fantasySnapshotServer";

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

describe("fantasySnapshotServer", () => {
  it("loads published snapshots from disk with derived overall metadata and no mismatches", async () => {
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
      expect(snapshot.sliceMetadata.overall.sourceKind).toBe("derived_overall");
      expect(snapshot.sliceMetadata.overall.rangeKind).toBe("overall");
      expect(snapshot.sliceMetadata.qb.available).toBe(true);
      expect(snapshot.sliceMetadata.qb.sourceKind).toBe("shared_position_consensus");
      expect(countOverallPositionMismatches(snapshot)).toBe(0);
      expect(snapshot.overall.every((player) => !("overallValue" in player))).toBe(true);
    }
  });

  it("returns the right slice for flex when the snapshot supports it", async () => {
    const snapshot = await loadFantasySnapshot("half_ppr");
    const flexPlayers = getFantasyPlayersForPosition(snapshot, "flex");

    expect(snapshot.sliceMetadata.flex.available).toBe(true);
    expect(flexPlayers.length).toBeGreaterThan(100);
    expect(flexPlayers.every((player) => ["RB", "WR", "TE"].includes(player.position))).toBe(true);
  });
});
