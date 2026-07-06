export type WorldCupView = "groups" | "knockout" | "schedule";

export interface WorldCupRouteState {
  view: WorldCupView;
  team: string | null;
}

export interface WorldCupVenue {
  city: string;
  country: string;
  stadium: string;
}

export interface WorldCupTournament {
  /** Human-readable competition name, e.g. "2026 FIFA World Cup". */
  name: string;
  /** Season key, e.g. "2026". */
  season: string;
  /** Host nations, in opening-match order. */
  hosts: string[];
  /** ISO date (YYYY-MM-DD) of the opening match. */
  startDate: string;
  /** ISO date (YYYY-MM-DD) of the final. */
  endDate: string;
  /** Current phase label, e.g. "Upcoming", "Group stage", "Knockout stage", "Complete". */
  phase: string;
  /** Short status sentence describing where the tournament stands. */
  status: string;
  /** One-line description of the competition format. */
  format: string;
  /** Total number of teams (48 for 2026). */
  teamCount: number;
  /** Total number of groups (12 for 2026). */
  groupCount: number;
  /** Total number of matches across the tournament (104 for 2026). */
  matchCount: number;
  /** Host venues across the three nations. */
  venues: WorldCupVenue[];
  generatedAt: string;
}

export interface WorldCupTeamOption {
  /** URL-safe slug derived from the team name, e.g. "united-states". */
  id: string;
  name: string;
  /** FIFA three-letter code, e.g. "USA". */
  code: string;
  /** Group letter ("A".."L") or "" before/after the group stage. */
  group: string;
  crest: string | null;
}

export interface WorldCupStandingRow {
  teamId: string;
  name: string;
  code: string;
  crest: string | null;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<"W" | "D" | "L">;
}

export interface WorldCupGroup {
  /** Group letter, e.g. "A". */
  letter: string;
  /** Display name, e.g. "Group A". */
  name: string;
  standings: WorldCupStandingRow[];
}

export interface WorldCupFixtureTeam {
  id: string;
  code: string;
  shortName: string;
  crest: string | null;
}

export interface WorldCupFixture {
  id: string;
  utcDate: string;
  /** "SCHEDULED" | "IN_PLAY" | "FINISHED" | "POSTPONED" etc. */
  status: string;
  /** Stage label, e.g. "Group A", "Round of 32", "Final". */
  stage: string;
  /** Group letter for group-stage matches, else null. */
  group: string | null;
  /** Group-stage matchday (1-3) or null for knockout matches. */
  matchday: number | null;
  venue: string | null;
  homeTeam: WorldCupFixtureTeam;
  awayTeam: WorldCupFixtureTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    home: number | null;
    away: number | null;
    /**
     * Penalty shootout tallies for a knockout tie level after regulation
     * (and extra time). Present only when a shootout decided the match, so a
     * "1-1" result with a winner can render as "1-1 (4-2 pens)". Absent from
     * regular-time results.
     */
    shootoutHome?: number | null;
    shootoutAway?: number | null;
  };
}

export interface WorldCupKnockoutRound {
  /** Slug id, e.g. "round-of-32". */
  id: string;
  /** Display name, e.g. "Round of 32". */
  name: string;
  /** Sort order from earliest round (0) to final. */
  order: number;
  fixtures: WorldCupFixture[];
}

export interface WorldCupScorer {
  rank: number;
  name: string;
  teamId: string;
  teamCode: string;
  goals: number;
  assists: number;
  penalties: number;
}

export interface WorldCupFormSummary {
  sequence: Array<"W" | "D" | "L">;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface WorldCupTeamProfile {
  id: string;
  name: string;
  code: string;
  group: string;
  crest: string | null;
}

export interface WorldCupTeamSnapshot {
  team: WorldCupTeamProfile | null;
  standing: WorldCupStandingRow | null;
  recentFixtures: WorldCupFixture[];
  upcomingFixtures: WorldCupFixture[];
  form: WorldCupFormSummary;
  generatedAt: string;
}

export interface WorldCupSnapshot {
  tournament: WorldCupTournament;
  groups: WorldCupGroup[];
  knockout: WorldCupKnockoutRound[];
  recentFixtures: WorldCupFixture[];
  upcomingFixtures: WorldCupFixture[];
  scorers: WorldCupScorer[];
  teamOptions: WorldCupTeamOption[];
  teamSnapshots: Record<string, WorldCupTeamSnapshot>;
}

export type WorldCupSummarySnapshot = Omit<WorldCupSnapshot, "teamSnapshots">;
