import type {
  PremierLeagueFixture,
  PremierLeagueFixtureTeam,
  PremierLeagueFormSummary,
  PremierLeagueMatchdayGoals,
  PremierLeagueTeamOption,
  PremierLeagueTeamProfile,
} from "./premier-league";

export type LaLigaView = "table" | "title-race" | "europe" | "relegation";

// Both leagues come from the same football-data.org feed, so these shapes are
// the Premier League ones. The La Liga profile never carried website/address.
export type LaLigaTeamOption = PremierLeagueTeamOption;
export type LaLigaTeamProfile = Omit<PremierLeagueTeamProfile, "website" | "address">;
export type LaLigaFixtureTeam = PremierLeagueFixtureTeam;
export type LaLigaFixture = PremierLeagueFixture;
export type LaLigaFormSummary = PremierLeagueFormSummary;
export type LaLigaMatchdayGoals = PremierLeagueMatchdayGoals;

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

export interface LaLigaSnapshot {
  season: string;
  matchday: number;
  /** Full ISO timestamp for freshness checks and publication metadata. */
  generatedAt: string;
  /** Calendar date retained for user-facing date labels. */
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
