export type NFLView = "league" | "afc" | "nfc" | "playoffs";

export type NFLConference = "AFC" | "NFC";

export type NFLDivision =
  | "AFC East"
  | "AFC North"
  | "AFC South"
  | "AFC West"
  | "NFC East"
  | "NFC North"
  | "NFC South"
  | "NFC West";

export interface NFLTeamOption {
  id: string;
  abbr: string;
  name: string;
  shortName: string;
  location: string;
  nickname: string;
  conference: NFLConference;
  division: NFLDivision;
  primaryColor: string | null;
  secondaryColor: string | null;
  logo: string | null;
}

export interface NFLTeamProfile extends NFLTeamOption {
  wordmark: string | null;
}

export interface NFLFixtureTeam {
  id: string;
  abbr: string;
  shortName: string;
  crest: string | null;
}

export interface NFLFixture {
  id: string;
  utcDate: string;
  status: string;
  week: number | null;
  matchday: number | null;
  gameType: string | null;
  homeTeam: NFLFixtureTeam;
  awayTeam: NFLFixtureTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "TIE" | null;
    home: number | null;
    away: number | null;
  };
}

export interface NFLFormSummary {
  sequence: Array<"W" | "T" | "L">;
  wins: number;
  ties: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface NFLTeamSnapshot {
  team: NFLTeamProfile | null;
  recentFixtures: NFLFixture[];
  upcomingFixtures: NFLFixture[];
  form: NFLFormSummary;
  generatedAt: string;
}

export interface NFLTeamStanding {
  id: string;
  abbr: string;
  name: string;
  shortName: string;
  conference: NFLConference;
  division: NFLDivision;
  divisionRank: number;
  conferenceRank: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  seed: number | null;
  playoffResult: string | null;
}

export interface NFLLeader {
  rank: number;
  name: string;
  teamId: string;
  teamCode: string;
  position: string;
  total: number;
  perGame: number;
  games: number;
}

export interface NFLLeaderboards {
  passing: NFLLeader[];
  rushing: NFLLeader[];
  receiving: NFLLeader[];
  sacks: NFLLeader[];
}

export interface NFLSnapshot {
  season: string;
  week: number;
  updatedAt: string;
  sourceLabel: string;
  sourceUrls: {
    standings: string;
    games: string;
    teams: string;
    leaders: string;
  };
  teams: NFLTeamStanding[];
  leaders: NFLLeaderboards;
  recentFixtures: NFLFixture[];
  upcomingFixtures: NFLFixture[];
  teamOptions: NFLTeamOption[];
  teamSnapshots: Record<string, NFLTeamSnapshot>;
}

export type NFLSummarySnapshot = Omit<NFLSnapshot, "teamSnapshots">;

export interface NFLRouteState {
  view: NFLView;
  team: string;
}
