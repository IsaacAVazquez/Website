import type { MlbStandingsRow } from "@/types/mlb";

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
  record: string;
  /** "—" for the division leader, otherwise the fixed-point gap. */
  gamesBack: string;
  divisionRank: number;
  /** Wins first, then losses. Shorter than 10 early in the season; never padded. */
  squares: ScoreboardSquare[];
}

export interface ScoreboardDivision {
  name: string;
  teams: ScoreboardTeam[];
}

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
  const byDivision = Map.groupBy(
    standings.filter((row) => row.division),
    (row) => row.division
  );

  return DIVISION_ORDER.filter((name) => byDivision.has(name)).map((name) => ({
    name,
    teams: byDivision
      .get(name)!
      .slice()
      .sort((a, b) => a.divisionRank - b.divisionRank)
      .map((row) => ({
        id: row.id,
        code: row.code,
        name: row.shortName,
        record: `${row.wins}-${row.losses}`,
        gamesBack: formatGamesBack(row),
        divisionRank: row.divisionRank,
        squares: last10Squares(row.last10),
      })),
  }));
}
