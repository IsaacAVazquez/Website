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

const SPECIALISTS: Partial<Record<Position, string>> = { K: "kicker", DST: "defense" };

/**
 * The note for a second kicker or a second defense on the user's roster, in
 * any round. It fires once per draft as well, so a roster that already holds
 * two of either gets nothing, and it says "too" when the early note above ran
 * earlier in the same draft.
 */
export function getSecondSpecialistNote(
  pick: PickLike,
  userTeam: number,
  earlierPicks: readonly PickLike[] = [],
): string | null {
  const name = SPECIALISTS[pick.player.position];
  if (!name || pick.teamNumber !== userTeam) return null;
  const mine = earlierPicks.filter((earlier) => earlier.teamNumber === userTeam);
  const held = (position: string) =>
    mine.filter((earlier) => earlier.player.position === position).length;
  if (held(pick.player.position) !== 1) return null;
  if (Object.keys(SPECIALISTS).some((position) => held(position) >= 2)) return null;
  const too = mine.some((earlier) => qualifies(earlier, userTeam)) ? " too" : "";
  return `A second ${name} is a bold call${too}. I'd want that roster spot back, but it's your league.`;
}

/** The note the draft tracker shows for a pick, with the early one first. */
export function getSpecialistNote(
  pick: PickLike,
  userTeam: number,
  earlierPicks: readonly PickLike[] = [],
): string | null {
  return (
    getEarlySpecialistNote(pick, userTeam, earlierPicks) ??
    getSecondSpecialistNote(pick, userTeam, earlierPicks)
  );
}
