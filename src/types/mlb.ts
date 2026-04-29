export type MlbView = "all" | "al" | "nl" | "wildcard";

export type MlbDetailTab = "team" | "games" | "leaders";

export type MlbLeague = "AL" | "NL";

export interface MlbTeamOption {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  league: MlbLeague;
  division: string;
  venue: string | null;
  logo: string | null;
}

export interface MlbTeamProfile extends MlbTeamOption {
  founded: number | null;
  primaryColor: string | null;
}

export interface MlbGameTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  crest: string | null;
}

export interface MlbGame {
  id: string;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  homeTeam: MlbGameTeam;
  awayTeam: MlbGameTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | null;
    home: number | null;
    away: number | null;
  };
}

export interface MlbFormSummary {
  sequence: Array<"W" | "L">;
  wins: number;
  losses: number;
  runsFor: number;
  runsAgainst: number;
}

export interface MlbTeamSnapshot {
  team: MlbTeamProfile | null;
  recentGames: MlbGame[];
  upcomingGames: MlbGame[];
  form: MlbFormSummary;
  generatedAt: string;
}

export interface MlbStandingsRow {
  id: string;
  code: string;
  name: string;
  shortName: string;
  league: MlbLeague;
  division: string;
  divisionRank: number;
  leagueRank: number;
  wildCardRank: number | null;
  gamesBack: number;
  wildCardGamesBack: number | null;
  wins: number;
  losses: number;
  pct: number;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  streak: string;
  last10: string;
}

export interface MlbLeader {
  rank: number;
  name: string;
  teamId: string;
  teamCode: string;
  total: number;
  games: number;
  perGame: number;
}

export interface MlbHittingLeaders {
  homeRuns: MlbLeader[];
  runsBattedIn: MlbLeader[];
  battingAverage: MlbLeader[];
}

export interface MlbPitchingLeaders {
  earnedRunAverage: MlbLeader[];
  wins: MlbLeader[];
  strikeouts: MlbLeader[];
}

export interface MlbSnapshotSourceUrls {
  standings: string;
  schedule: string;
  leaders: string;
}

export interface MlbSnapshot {
  season: string;
  updatedAt: string;
  sourceLabel: string;
  sourceUrls: MlbSnapshotSourceUrls;
  teams: MlbTeamOption[];
  standings: MlbStandingsRow[];
  recentGames: MlbGame[];
  upcomingGames: MlbGame[];
  hittingLeaders: MlbHittingLeaders;
  pitchingLeaders: MlbPitchingLeaders;
  teamSnapshots: Record<string, MlbTeamSnapshot>;
}

export type MlbSummarySnapshot = Omit<MlbSnapshot, "teamSnapshots">;

export interface MlbRouteState {
  view: MlbView;
  team: string;
}
