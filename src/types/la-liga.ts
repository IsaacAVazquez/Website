export type LaLigaView = "table" | "title-race" | "europe" | "relegation";

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
}

export interface LaLigaRouteState {
  view: LaLigaView;
  club: string;
}
