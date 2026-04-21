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

export function isValidGolfPlayerId(playerId: string): boolean {
  return playerId in golfSnapshot.playerSnapshots;
}

export async function getGolfSummary(): Promise<GolfSummary> {
  return golfSnapshot.summary;
}

export async function getGolfPlayerSnapshot(playerId: string): Promise<GolfPlayerSnapshot> {
  const snapshot = golfSnapshot.playerSnapshots[playerId];

  if (!snapshot) {
    throw createGolfSnapshotError("Golf player snapshot was not found.", 404);
  }

  return snapshot;
}
