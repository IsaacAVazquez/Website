import { golfSnapshot } from "@/data/golfSnapshot";
import type {
  GolfPlayerSnapshot,
  GolfSummary,
} from "@/types/golf";

interface GolfSnapshotError extends Error {
  status: number;
}

function createGolfSnapshotError(message: string, status: number): GolfSnapshotError {
  return Object.assign(new Error(message), { status });
}

export function createEmptyGolfSummary(): GolfSummary {
  return {
    tournament: null,
    heroStats: {
      leaderName: null,
      leaderScore: null,
      playersUnderPar: 0,
      cutLine: null,
      cutState: "unknown",
      cutCount: null,
      fieldSize: 0,
    },
    leaderboard: [],
    players: [],
  };
}

export function createEmptyGolfPlayerSnapshot(): GolfPlayerSnapshot {
  return {
    player: null,
    tournamentStatus: {
      position: "—",
      totalToPar: 0,
      today: 0,
      thru: "—",
      status: "Snapshot unavailable",
      movement: 0,
      nextTeeTime: null,
    },
    roundByRound: [],
    scoring: {
      birdies: 0,
      bogeys: 0,
      pars: 0,
      eagles: 0,
      doubleBogeys: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Golf player ids are URL-friendly slugs like "scottie-scheffler" — lowercase
// letters/digits with `-` separators, capped at 64 chars to keep the regex
// from being abused. The shape check runs before membership so route handlers
// can return 400 (bad input) vs 404 (unknown id).
const GOLF_PLAYER_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/i;

export function isGolfPlayerIdShape(playerId: string): boolean {
  return GOLF_PLAYER_ID_PATTERN.test(playerId);
}

export function isValidGolfPlayerId(playerId: string): boolean {
  // Use hasOwn (not `in`) so prototype keys like "constructor"/"toString" — which
  // pass the case-insensitive shape regex — don't resolve through the prototype
  // chain and turn a 404 into a cacheable 200 serializing a built-in.
  return (
    GOLF_PLAYER_ID_PATTERN.test(playerId) &&
    Object.hasOwn(golfSnapshot.playerSnapshots, playerId)
  );
}

export async function getGolfSummary(): Promise<GolfSummary> {
  return golfSnapshot.summary;
}

export async function getGolfPlayerSnapshot(playerId: string): Promise<GolfPlayerSnapshot> {
  const snapshot = Object.hasOwn(golfSnapshot.playerSnapshots, playerId)
    ? golfSnapshot.playerSnapshots[playerId]
    : undefined;

  if (!snapshot) {
    throw createGolfSnapshotError("Golf player snapshot was not found.", 404);
  }

  return snapshot;
}
