import type { DraftPick, Position } from "@/types";

type PickLike = Pick<DraftPick, "round" | "teamNumber"> & {
  player: { position: Position };
};

const NOTES: Partial<Record<Position, string>> = {
  K: "A kicker in the first two rounds is a bold call. I'd have waited until the last round, but it's your league.",
  DST: "A defense in the first two rounds is a bold call. I'd have waited until the last couple of rounds, but it's your league.",
};

function qualifies(pick: PickLike, userTeam: number): boolean {
  return pick.teamNumber === userTeam && pick.round <= 2 && NOTES[pick.player.position] !== undefined;
}

/**
 * The dry note for a kicker or defense the user takes in round 1 or 2. It
 * fires once per draft, so it returns null when an earlier pick already
 * qualified.
 */
export function getEarlySpecialistNote(
  pick: PickLike,
  userTeam: number,
  earlierPicks: readonly PickLike[] = [],
): string | null {
  if (!qualifies(pick, userTeam)) return null;
  if (earlierPicks.some((earlier) => qualifies(earlier, userTeam))) return null;
  return NOTES[pick.player.position] ?? null;
}
