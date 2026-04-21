export type GolfView = "leaderboard" | "players";

export interface GolfRouteState {
  view: GolfView;
  player: string | null;
}

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
  generatedAt: string;
}

export interface GolfHeroStats {
  leaderName: string | null;
  leaderScore: number | null;
  playersUnderPar: number;
  cutLine: number | null;
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
