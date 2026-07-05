export type PremierLeagueView = "table" | "title-race" | "europe" | "relegation";

export type PremierLeagueDetailTab = "club" | "fixtures" | "scorers";

export interface PremierLeagueRouteState {
  view: PremierLeagueView;
  team: string | null;
  detail: PremierLeagueDetailTab;
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
  /**
   * Club brand accent hex, resolved from the `src/data/clubColors.ts` lookup
   * (upstream never exposes a hex, only a free-text `clubColors` description).
   * Optional so older committed snapshots (predating this field) still satisfy
   * the type — treat a missing/`null` value as "fall back to a neutral token."
   */
  accentColor?: string | null;
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

export interface PremierLeagueScorer {
  rank: number;
  name: string;
  teamId: string;
  teamName: string;
  goals: number;
  assists: number;
  appearances: number;
}

/** One entry of the season-long goals-per-matchday series (matchday → total league goals). */
export interface PremierLeagueMatchdayGoals {
  matchday: number;
  totalGoals: number;
}

export interface PremierLeagueSummary {
  competition: PremierLeagueCompetitionMeta | null;
  standings: PremierLeagueStandingRow[];
  recentFixtures: PremierLeagueFixture[];
  upcomingFixtures: PremierLeagueFixture[];
  teams: PremierLeagueTeamOption[];
  scorers: PremierLeagueScorer[];
  /**
   * Season-to-date goals scored per matchday, ascending by matchday, derived
   * from a full-season fetch of FINISHED matches. Optional/defaults to `[]` —
   * older committed snapshots won't have it, and a pre-season snapshot (no
   * matches played yet) legitimately has an empty series.
   */
  goalsPerMatchday?: PremierLeagueMatchdayGoals[];
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
  /**
   * Manager/head coach name, sourced from football-data.org's team-detail
   * `coach.name` field when upstream provides one. Optional because older
   * snapshots won't have it and some upstream responses omit `coach` entirely.
   */
  manager?: string | null;
}

export interface PremierLeagueTeamSnapshot {
  team: PremierLeagueTeamProfile | null;
  recentFixtures: PremierLeagueFixture[];
  upcomingFixtures: PremierLeagueFixture[];
  form: PremierLeagueFormSummary;
  generatedAt: string;
}

export interface PremierLeagueSnapshotSourceUrls {
  provider: string;
  standings: string;
  fixtures: string;
  teams: string;
}

export interface PremierLeagueSnapshot {
  sourceLabel: string;
  sourceUrls: PremierLeagueSnapshotSourceUrls;
  summary: PremierLeagueSummary;
  teamSnapshots: Record<string, PremierLeagueTeamSnapshot>;
}
