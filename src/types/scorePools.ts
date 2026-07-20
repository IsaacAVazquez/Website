// ============================================================
// Score pools — snapshot types
//
// The committed snapshot carries fixtures, results, standings, and
// a capped append-only odds history per fixture, so line movement
// stays queryable and every number has a timestamp. Providers are
// swappable at build time; nothing here knows which one filled a
// field beyond the source labels.
// ============================================================

export type SnapshotFixtureStatus = "scheduled" | "in_play" | "finished" | "postponed";

export interface SnapshotScore {
  home: number;
  away: number;
}

export interface SnapshotResult {
  ninetyMinutes: SnapshotScore;
  /** Score after 120 minutes; null when the game ended in 90. */
  afterExtraTime: SnapshotScore | null;
  /** Set only when a shootout decided it. */
  penaltyWinner: "home" | "away" | null;
}

export interface SnapshotOddsEntry {
  /** When these prices were captured (or last confirmed unchanged). */
  fetchedAt: string;
  bookmaker: string | null;
  /** True when the prices were entered by hand rather than fetched. */
  manual: boolean;
  /** Decimal odds. `draw` null for two-way sports. */
  moneyline: { home: number; draw: number | null; away: number };
  totals: { line: number; over: number | null; under: number | null } | null;
}

export interface SnapshotFixture {
  id: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  stage: string | null;
  round: string | null;
  /** True when the game can go to extra time and penalties. */
  knockout: boolean;
  status: SnapshotFixtureStatus;
  result: SnapshotResult | null;
  /** Null until a lineups feed confirms (or denies) the starting elevens. */
  lineupsConfirmed: boolean | null;
  /** Short human-readable injury/suspension notes, best-effort. */
  injuryNotes: string[];
  /** Append-only odds history, oldest first, capped per fixture. */
  odds: SnapshotOddsEntry[];
}

export interface SnapshotStandingsRow {
  team: string;
  position: number;
  played: number;
  points: number;
  /** Explicit clinch state when a feed or manual entry provides it; the
   * engine only derives dead-rubber suggestions from non-null values. */
  qualified: boolean | null;
  eliminated: boolean | null;
}

export interface SnapshotStandingsGroup {
  group: string | null;
  rows: SnapshotStandingsRow[];
}

export interface ScorePoolLeagueSnapshot {
  key: string;
  name: string;
  sport: string;
  season: string | null;
  /** Where fixtures/odds came from, for on-page provenance. */
  sources: { fixtures: string; odds: string };
  /** When this league's data was last refreshed. */
  generatedAt: string;
  /** True when the league is sample/manual data rather than a live feed. */
  sample: boolean;
  notes: string[];
  fixtures: SnapshotFixture[];
  standings: SnapshotStandingsGroup[];
}

export interface ScorePoolsSnapshot {
  generatedAt: string;
  leagues: ScorePoolLeagueSnapshot[];
}
