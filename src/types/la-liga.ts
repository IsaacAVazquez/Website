export type LaLigaView = "table" | "title-race" | "europe" | "relegation";

export interface LaLigaTeamOption {
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

export interface LaLigaTeamProfile extends LaLigaTeamOption {
  founded: number | null;
  clubColors: string | null;
  /**
   * Manager/head coach name, sourced from football-data.org's team-detail
   * `coach.name` field when upstream provides one. Optional because older
   * snapshots won't have it and some upstream responses omit `coach` entirely.
   */
  manager?: string | null;
}

export interface LaLigaFixtureTeam {
  id: string;
  name: string;
  shortName: string;
  tla: string | null;
  crest: string | null;
}

export interface LaLigaFixture {
  id: string;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  homeTeam: LaLigaFixtureTeam;
  awayTeam: LaLigaFixtureTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    home: number | null;
    away: number | null;
  };
}

export interface LaLigaFormSummary {
  sequence: Array<"W" | "D" | "L">;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface LaLigaTeamSnapshot {
  team: LaLigaTeamProfile | null;
  recentFixtures: LaLigaFixture[];
  upcomingFixtures: LaLigaFixture[];
  form: LaLigaFormSummary;
  generatedAt: string;
}

export interface LaLigaClub {
  id: string;
  code: string;
  name: string;
  shortName: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  /**
   * Club brand accent hex, resolved from the `src/data/clubColors.ts` lookup.
   * `LaLigaClub` is a flat standings row (it doesn't nest a team object), so
   * the accent lives here directly rather than on `LaLigaTeamOption`. Optional
   * so older committed snapshots still satisfy the type.
   */
  accentColor?: string | null;
}

export interface LaLigaLeader {
  rank: number;
  name: string;
  clubId: string;
  clubCode: string;
  total: number;
  appearances: number;
  perMatch: number;
}

/** One entry of the season-long goals-per-matchday series (matchday → total league goals). */
export interface LaLigaMatchdayGoals {
  matchday: number;
  totalGoals: number;
}

export interface LaLigaSnapshot {
  season: string;
  matchday: number;
  updatedAt: string;
  sourceLabel: string;
  sourceUrls: {
    standings: string;
    scorers: string;
    assists: string;
  };
  clubs: LaLigaClub[];
  scorers: LaLigaLeader[];
  assists: LaLigaLeader[];
  /**
   * Season-to-date goals scored per matchday, ascending by matchday, derived
   * from a full-season fetch of FINISHED matches. Optional/defaults to `[]` —
   * older committed snapshots won't have it, and a pre-season snapshot (no
   * matches played yet) legitimately has an empty series.
   */
  goalsPerMatchday?: LaLigaMatchdayGoals[];
  recentFixtures: LaLigaFixture[];
  upcomingFixtures: LaLigaFixture[];
  teams: LaLigaTeamOption[];
  teamSnapshots: Record<string, LaLigaTeamSnapshot>;
}

export type LaLigaSummarySnapshot = Omit<LaLigaSnapshot, "teamSnapshots">;

export type LaLigaDetailTab = "club" | "fixtures" | "scorers";

export interface LaLigaRouteState {
  view: LaLigaView;
  club: string;
  detail: LaLigaDetailTab;
}
