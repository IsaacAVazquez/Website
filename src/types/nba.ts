export type NbaConference = "east" | "west";

export type NbaView = "east" | "west" | "playoff" | "play-in";

export interface NbaTeamOption {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string | null;
  logo: string | null;
  conference: NbaConference;
  division: string | null;
  venue: string | null;
}

export interface NbaTeamProfile extends NbaTeamOption {
  founded: number | null;
  primaryColor: string | null;
}

export interface NbaFixtureTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string | null;
  crest: string | null;
}

export interface NbaFixture {
  id: string;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  homeTeam: NbaFixtureTeam;
  awayTeam: NbaFixtureTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | null;
    home: number | null;
    away: number | null;
  };
}

export interface NbaFormSummary {
  sequence: Array<"W" | "L">;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface NbaTeamSnapshot {
  team: NbaTeamProfile | null;
  recentFixtures: NbaFixture[];
  upcomingFixtures: NbaFixture[];
  form: NbaFormSummary;
  generatedAt: string;
}

export interface NbaTeam {
  id: string;
  abbreviation: string;
  name: string;
  shortName: string;
  conference: NbaConference;
  division: string | null;
  conferenceSeed: number;
  position: number;
  wins: number;
  losses: number;
  winPercent: number;
  gamesBack: number;
  gamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  streak: string | null;
  homeRecord: string | null;
  awayRecord: string | null;
  lastTen: string | null;
}

export interface NbaLeader {
  rank: number;
  name: string;
  teamId: string;
  teamAbbreviation: string;
  total: number;
  appearances: number;
  perGame: number;
}

export interface NbaSnapshot {
  season: string;
  updatedAt: string;
  sourceLabel: string;
  sourceUrls: {
    standings: string;
    leaders: string;
    scoreboard: string;
  };
  teamsByConference: {
    east: NbaTeam[];
    west: NbaTeam[];
  };
  scorers: NbaLeader[];
  rebounders: NbaLeader[];
  assistLeaders: NbaLeader[];
  recentFixtures: NbaFixture[];
  upcomingFixtures: NbaFixture[];
  teams: NbaTeamOption[];
  teamSnapshots: Record<string, NbaTeamSnapshot>;
}

export type NbaSummarySnapshot = Omit<NbaSnapshot, "teamSnapshots">;

export interface NbaRouteState {
  view: NbaView;
  team: string;
}
