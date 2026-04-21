export type LaLigaView = "table" | "title-race" | "europe" | "relegation";

export interface LaLigaTeamOption {
  id: string;
  name: string;
  shortName: string;
  tla: string | null;
  crest: string | null;
  venue: string | null;
}

export interface LaLigaTeamProfile extends LaLigaTeamOption {
  founded: number | null;
  clubColors: string | null;
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
  recentFixtures: LaLigaFixture[];
  upcomingFixtures: LaLigaFixture[];
  teams: LaLigaTeamOption[];
  teamSnapshots: Record<string, LaLigaTeamSnapshot>;
}

export type LaLigaSummarySnapshot = Omit<LaLigaSnapshot, "teamSnapshots">;

export interface LaLigaRouteState {
  view: LaLigaView;
  club: string;
}
