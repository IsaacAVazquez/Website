import type { MlbStandingsRow } from "@/types/mlb";
import { groupBy } from "@/lib/utils";

/**
 * The out-of-town scoreboard signature. A manual board carries no primary
 * colour and no game-by-game sequence, only a team, its record, its games
 * back, and a lit/hollow count for the last ten. That is exactly what
 * `MlbStandingsRow.last10` already is (a "W-L" count, not `MlbFormSummary`'s
 * per-game sequence), so the squares are read from it as a count and never
 * imply a game order the data doesn't have.
 */

export type ScoreboardSquare = "W" | "L";

export interface ScoreboardTeam {
  id: string;
  code: string;
  name: string;
  /** The full club name, for the button's accessible name. */
  fullName: string;
  record: string;
  /** "—" for the division leader, otherwise the fixed-point gap. */
  gamesBack: string;
  divisionRank: number;
  /** "W5", "L2", or "" when the feed sent none. */
  streak: string;
  /** True for the three wild card slots in the club's league. */
  holdsWildCard: boolean;
  /** Wins first, then losses. Shorter than 10 early in the season; never padded. */
  squares: ScoreboardSquare[];
}

export interface ScoreboardDivision {
  name: string;
  teams: ScoreboardTeam[];
  /** The race a board prints: a division, or a league's wild card race with its line after the third slot. */
  kind: "division" | "wildcard";
}

/** The number of wild card slots per league since 2022. */
export const WILD_CARD_SLOTS = 3;

const DIVISION_ORDER = [
  "AL East",
  "AL Central",
  "AL West",
  "NL East",
  "NL Central",
  "NL West",
] as const;

/** Parses a "W-L" count like "9-1". Malformed or missing input reads as no games. */
export function last10Squares(last10: string | null | undefined): ScoreboardSquare[] {
  const match = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(last10 ?? "");
  if (!match) return [];
  const wins = Math.min(10, Math.max(0, Number(match[1])));
  const losses = Math.min(10 - wins, Math.max(0, Number(match[2])));
  return [
    ...Array.from({ length: wins }, (): ScoreboardSquare => "W"),
    ...Array.from({ length: losses }, (): ScoreboardSquare => "L"),
  ];
}

function toTeam(row: MlbStandingsRow, gamesBack: string): ScoreboardTeam {
  return {
    id: row.id,
    code: row.code,
    name: row.shortName,
    fullName: row.name,
    record: `${row.wins}-${row.losses}`,
    gamesBack,
    divisionRank: row.divisionRank,
    streak: row.streak ?? "",
    holdsWildCard: row.divisionRank > 1 && row.wildCardRank !== null && row.wildCardRank <= WILD_CARD_SLOTS,
    squares: last10Squares(row.last10),
  };
}

function formatGamesBack(row: MlbStandingsRow): string {
  if (row.divisionRank <= 1 || !Number.isFinite(row.gamesBack) || row.gamesBack <= 0) {
    return "—";
  }
  return row.gamesBack.toFixed(1);
}

/**
 * Groups standings into the six divisions in AL-then-NL, east/central/west
 * order. A division absent from the standings is skipped, and a row whose
 * `division` doesn't match one of the six is skipped rather than crashing.
 */
export function divisionBoard(standings: readonly MlbStandingsRow[]): ScoreboardDivision[] {
  const byDivision = groupBy(
    standings.filter((row) => row.division),
    (row) => row.division
  );

  return DIVISION_ORDER.filter((name) => byDivision.has(name)).map((name) => ({
    name,
    kind: "division" as const,
    teams: byDivision
      .get(name)!
      .slice()
      .sort((a, b) => a.divisionRank - b.divisionRank)
      .map((row) => toTeam(row, formatGamesBack(row))),
  }));
}

/**
 * A slot holder prints its lead over the last wild card slot as "+N" (the last
 * slot, level with the line, prints "—"), and a chaser prints the games it
 * trails the last slot by. The lead is read by rank rather than sign, since
 * snapshots built before 2026-10-12 stored it unsigned.
 */
export function formatWildCardGamesBack(row: MlbStandingsRow): string {
  const gap = row.wildCardGamesBack;
  if (gap === null || !Number.isFinite(gap) || gap === 0) return "—";
  if (row.wildCardRank !== null && row.wildCardRank <= WILD_CARD_SLOTS) return `+${Math.abs(gap).toFixed(1)}`;
  return gap > 0 ? gap.toFixed(1) : "—";
}

/**
 * The two wild card races, AL then NL: every non-leader in the top six of
 * the league's wild card order, the same rows the route's wild card view
 * filters to, with the games back of the last slot.
 */
export function wildCardBoard(standings: readonly MlbStandingsRow[]): ScoreboardDivision[] {
  return (["AL", "NL"] as const)
    .map((league) => ({
      name: `${league} Wild Card`,
      kind: "wildcard" as const,
      teams: standings
        .filter((row) => row.league === league && row.divisionRank > 1 && row.wildCardRank !== null && row.wildCardRank <= 6)
        .toSorted((a, b) => (a.wildCardRank ?? 99) - (b.wildCardRank ?? 99) || b.pct - a.pct)
        .map((row) => toTeam(row, formatWildCardGamesBack(row))),
    }))
    .filter((board) => board.teams.length > 0);
}
