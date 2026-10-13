import type { GolfCutState, GolfLeaderboardEntry } from "@/types/golf";

/** Tone for a score relative to par. Under par prints in golf's red; even and over stay ink. */
export type ParTone = "under" | "even" | "over";

export interface LeaderboardSlatRound {
  score: number | null;
  toPar: number | null;
  tone: ParTone | null;
}

export interface LeaderboardSlat {
  playerId: string;
  position: string;
  name: string;
  /** Padded to the round count passed in, so every slat lines up in the columns. */
  rounds: LeaderboardSlatRound[];
  total: number;
  totalTone: ParTone;
  /** False for a missed-cut, withdrawn, or disqualified status. */
  madeCut: boolean;
}

export interface LeaderboardSlatsOptions {
  cutLine: number | null;
  cutState: GolfCutState;
  coursePar: number;
  rounds: number;
}

export interface LeaderboardSlatsResult {
  slats: LeaderboardSlat[];
  /** The slat index the cut line draws after, or null when no cut applies to this board. */
  cutIndex: number | null;
}

// The snapshot's own status strings ("Finish", "In clubhouse", "Missed Cut",
// "Withdrawn") name the thing that happened, so matching on them is the
// reliable signal. Comparing a player's total to `cutLine` is not: the cut is
// set after 36 holes, and a made-cut player who plays the weekend badly can
// finish with a worse to-par total than the cut score itself.
const MISSED_CUT_STATUS = /missed cut|^mc$|withdr|^wd$|disqualif|^dq$/i;
const CUT_STATUS = /missed cut|^mc$/i;

/**
 * True once a player carries the missed-cut status. ESPN publishes a cut score
 * through round two as a projection, with a count of the players inside it,
 * and until the round ends nobody has advanced or gone home.
 */
export function isCutMade(entries: GolfLeaderboardEntry[]): boolean {
  return entries.some((entry) => CUT_STATUS.test(entry.status));
}

function parTone(toPar: number): ParTone {
  return toPar < 0 ? "under" : toPar > 0 ? "over" : "even";
}

/** "E" at even, otherwise a signed number, e.g. "-3" or "+4". */
export function formatScoreToPar(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (value === 0) {
    return "E";
  }
  return value > 0 ? `+${value}` : `${value}`;
}

/**
 * Lays the leaderboard out as slats for the board: each
 * player's rounds padded to a common column count and toned by par, plus
 * where (if anywhere) the cut line falls.
 */
export function leaderboardSlats(
  entries: GolfLeaderboardEntry[],
  { cutLine, cutState, coursePar, rounds }: LeaderboardSlatsOptions
): LeaderboardSlatsResult {
  const slats: LeaderboardSlat[] = entries.map((entry) => {
    // `thru` other than "F"/"—" means the player's latest round (the last
    // entry in roundScores, since a round with no strokes yet is filtered out
    // upstream) is still in progress, so its roundScores value is a partial
    // stroke count, not a full round. Comparing that partial total to the
    // full course par would show a wildly wrong tone (a front-nine 34 read
    // against a par-72 course, say), so the in-progress round borrows the
    // live to-par figure (`today`, already shown as the "Today" stat)
    // instead of `score - coursePar`, and carries no tone when there is none.
    const currentRoundIsPartial = entry.thru !== "F" && entry.thru !== "—";
    return {
      playerId: entry.playerId,
      position: entry.position,
      name: entry.playerName,
      rounds: Array.from({ length: rounds }, (_, i) => {
        const score = entry.roundScores[i] ?? null;
        if (score === null) {
          return { score: null, toPar: null, tone: null };
        }
        const isLatestRound = i === entry.roundScores.length - 1;
        const toPar = isLatestRound && currentRoundIsPartial ? entry.today : score - coursePar;
        return { score, toPar, tone: toPar === null ? null : parTone(toPar) };
      }),
      total: entry.totalToPar,
      totalTone: parTone(entry.totalToPar),
      madeCut: !MISSED_CUT_STATUS.test(entry.status),
    };
  });

  let cutIndex: number | null = null;
  if (cutState === "made" && cutLine !== null && isCutMade(entries)) {
    for (let i = slats.length - 1; i >= 0; i--) {
      if (slats[i].madeCut) {
        cutIndex = i;
        break;
      }
    }
  }

  return { slats, cutIndex };
}
