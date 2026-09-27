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
 * Lays the leaderboard out as slats for the manual-board signature: each
 * player's rounds padded to a common column count and toned by par, plus
 * where (if anywhere) the cut line falls.
 */
export function leaderboardSlats(
  entries: GolfLeaderboardEntry[],
  { cutLine, cutState, coursePar, rounds }: LeaderboardSlatsOptions
): LeaderboardSlatsResult {
  const slats: LeaderboardSlat[] = entries.map((entry) => ({
    playerId: entry.playerId,
    position: entry.position,
    name: entry.playerName,
    rounds: Array.from({ length: rounds }, (_, i) => {
      const score = entry.roundScores[i] ?? null;
      if (score === null) {
        return { score: null, toPar: null, tone: null };
      }
      const toPar = score - coursePar;
      return { score, toPar, tone: parTone(toPar) };
    }),
    total: entry.totalToPar,
    totalTone: parTone(entry.totalToPar),
    madeCut: !MISSED_CUT_STATUS.test(entry.status),
  }));

  let cutIndex: number | null = null;
  if (cutState === "made" && cutLine !== null) {
    for (let i = slats.length - 1; i >= 0; i--) {
      if (slats[i].madeCut) {
        cutIndex = i;
        break;
      }
    }
  }

  return { slats, cutIndex };
}

export type BoardRow = { kind: "slat"; slat: LeaderboardSlat } | { kind: "cutline" } | { kind: "gap" };

/**
 * The hero board's rows: the top of the field, then the cut line under the
 * last player who made it. When that player sits below the top, a gap row
 * stands for the players between, and the player prints above the line.
 */
export function boardRows(slats: LeaderboardSlat[], cutIndex: number | null, topCount: number): BoardRow[] {
  const rows: BoardRow[] = slats.slice(0, topCount).map((slat) => ({ kind: "slat", slat }));
  if (cutIndex === null || cutIndex >= slats.length) return rows;
  if (cutIndex < topCount) {
    rows.splice(cutIndex + 1, 0, { kind: "cutline" });
    return rows;
  }
  if (cutIndex > topCount) rows.push({ kind: "gap" });
  rows.push({ kind: "slat", slat: slats[cutIndex] }, { kind: "cutline" });
  return rows;
}
