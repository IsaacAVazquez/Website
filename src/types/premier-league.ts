export type PremierLeagueView = "overview" | "fixtures" | "team";

export interface PremierLeagueRouteState {
  view: PremierLeagueView;
  team: string | null;
}

export interface PremierLeagueCompetitionMeta {
  code: string;
  name: string;
  areaName: string | null;
  emblem: string | null;
  seasonLabel: string;
  currentMatchday: number | null;
  winner: string | null;
}

export interface PremierLeagueTeamOption {
  id: string;
  name: string;
  shortName: string;
  tla: string | null;
  crest: string | null;
  venue: string | null;
}

export interface PremierLeagueStandingRow {
  position: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  team: PremierLeagueTeamOption;
}

export interface PremierLeagueFixtureTeam {
  id: string;
  name: string;
  shortName: string;
  tla: string | null;
  crest: string | null;
}

export interface PremierLeagueFixture {
  id: string;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  homeTeam: PremierLeagueFixtureTeam;
  awayTeam: PremierLeagueFixtureTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    home: number | null;
    away: number | null;
  };
}

export interface PremierLeagueSummary {
  competition: PremierLeagueCompetitionMeta | null;
  standings: PremierLeagueStandingRow[];
  recentFixtures: PremierLeagueFixture[];
  upcomingFixtures: PremierLeagueFixture[];
  teams: PremierLeagueTeamOption[];
  generatedAt: string;
}

export interface PremierLeagueFormSummary {
  sequence: Array<"W" | "D" | "L">;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface PremierLeagueTeamProfile extends PremierLeagueTeamOption {
  founded: number | null;
  clubColors: string | null;
  website: string | null;
  address: string | null;
}

export interface PremierLeagueTeamSnapshot {
  team: PremierLeagueTeamProfile | null;
  recentFixtures: PremierLeagueFixture[];
  upcomingFixtures: PremierLeagueFixture[];
  form: PremierLeagueFormSummary;
  generatedAt: string;
}
