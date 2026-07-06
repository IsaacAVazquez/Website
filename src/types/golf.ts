export type GolfView = "leaderboard" | "players";

export interface GolfRouteState {
  view: GolfView;
  player: string | null;
}

/**
 * Cut state for the tournament. "made" once the cut score is set, "pending"
 * while a cut is scheduled but not yet applied (early rounds), "none" for a
 * genuine no-cut event (signature/limited-field), and "unknown" when ESPN
 * hasn't given us enough to tell — so the UI never asserts a false "No cut".
 */
export type GolfCutState = "made" | "pending" | "none" | "unknown";

export interface GolfTournament {
  id: string;
  name: string;
  tour: string;
  course: string;
  coursePar: number;
  location: string;
  startDate: string;
  endDate: string;
  roundLabel: string;
  status: string;
  fieldSize: number;
  cutLine: number | null;
  cutState: GolfCutState;
  cutCount: number | null;
  generatedAt: string;
}

export interface GolfHeroStats {
  leaderName: string | null;
  leaderScore: number | null;
  playersUnderPar: number;
  cutLine: number | null;
  cutState: GolfCutState;
  cutCount: number | null;
  fieldSize: number;
}

export interface GolfPlayerOption {
  id: string;
  name: string;
  country: string;
  position: string;
}

export interface GolfLeaderboardEntry {
  playerId: string;
  playerName: string;
  country: string;
  position: string;
  totalToPar: number;
  today: number;
  thru: string;
  status: string;
  roundScores: number[];
  movement: number;
}

export interface GolfSummary {
  tournament: GolfTournament | null;
  heroStats: GolfHeroStats;
  leaderboard: GolfLeaderboardEntry[];
  players: GolfPlayerOption[];
}

export interface GolfPlayerProfile {
  id: string;
  name: string;
  country: string;
}

export interface GolfRoundBreakdown {
  round: number;
  score: number;
  relativeToPar: number;
}

export interface GolfScoringBreakdown {
  birdies: number;
  bogeys: number;
  pars: number;
  eagles: number;
  doubleBogeys: number;
}

export interface GolfPlayerTournamentStatus {
  position: string;
  totalToPar: number;
  today: number;
  thru: string;
  status: string;
  movement: number;
  nextTeeTime: string | null;
}

export interface GolfPlayerSnapshot {
  player: GolfPlayerProfile | null;
  tournamentStatus: GolfPlayerTournamentStatus;
  roundByRound: GolfRoundBreakdown[];
  scoring: GolfScoringBreakdown;
  generatedAt: string;
}

export interface GolfSnapshot {
  summary: GolfSummary;
  playerSnapshots: Record<string, GolfPlayerSnapshot>;
}
