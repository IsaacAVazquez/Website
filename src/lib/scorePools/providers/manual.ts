// ============================================================
// Manual + CSV fallback adapter
//
// Plenty of pools run on games no provider covers, or on
// correct-score markets thin enough that the odds get entered by
// hand. Manual leagues and fixtures are first-class here: typed
// entries in scripts/data, or CSV drops parsed by the builder.
// Everything hand-entered is tagged `manual: true` so the UI can
// say so.
// ============================================================

import { toDecimal } from "../odds";
import type { OddsFormat } from "../types";
import type {
  SnapshotFixture,
  SnapshotFixtureStatus,
  SnapshotOddsEntry,
  SnapshotScore,
  SnapshotStandingsGroup,
} from "@/types/scorePools";

export interface ManualOddsInput {
  moneyline: { home: number | string; draw?: number | string; away: number | string };
  totals?: { line: number; over?: number | string; under?: number | string };
  /** Format of the prices as entered. Defaults to decimal. */
  format?: OddsFormat;
  bookmaker?: string;
  fetchedAt?: string;
}

export interface ManualResultInput {
  ninetyMinutes: SnapshotScore;
  afterExtraTime?: SnapshotScore;
  penaltyWinner?: "home" | "away";
}

export interface ManualFixtureInput {
  id: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  stage?: string;
  round?: string;
  knockout?: boolean;
  status?: SnapshotFixtureStatus;
  odds?: ManualOddsInput;
  result?: ManualResultInput;
}

export interface ManualLeagueInput {
  key: string;
  name: string;
  sport?: string;
  season?: string;
  /** Marks demo/sample data so the UI can disclose it. */
  sample?: boolean;
  notes?: string[];
  allKnockout?: boolean;
  fixtures: ManualFixtureInput[];
  standings?: SnapshotStandingsGroup[];
}

export function manualOddsToEntry(
  input: ManualOddsInput,
  defaultFetchedAt: string,
): SnapshotOddsEntry {
  const format = input.format ?? "decimal";
  const convert = (value: number | string) => toDecimal(value, format);
  return {
    fetchedAt: input.fetchedAt ?? defaultFetchedAt,
    bookmaker: input.bookmaker ?? null,
    manual: true,
    moneyline: {
      home: convert(input.moneyline.home),
      draw: input.moneyline.draw !== undefined ? convert(input.moneyline.draw) : null,
      away: convert(input.moneyline.away),
    },
    totals: input.totals
      ? {
          line: input.totals.line,
          over: input.totals.over !== undefined ? convert(input.totals.over) : null,
          under: input.totals.under !== undefined ? convert(input.totals.under) : null,
        }
      : null,
  };
}

export function manualFixtureToSnapshot(
  input: ManualFixtureInput,
  defaults: { allKnockout?: boolean },
  defaultFetchedAt: string,
): SnapshotFixture {
  return {
    id: input.id,
    kickoff: input.kickoff,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    stage: input.stage ?? null,
    round: input.round ?? null,
    knockout: input.knockout ?? defaults.allKnockout ?? false,
    status: input.status ?? (input.result ? "finished" : "scheduled"),
    result: input.result
      ? {
          ninetyMinutes: input.result.ninetyMinutes,
          afterExtraTime: input.result.afterExtraTime ?? null,
          penaltyWinner: input.result.penaltyWinner ?? null,
        }
      : null,
    lineupsConfirmed: null,
    injuryNotes: [],
    odds: input.odds ? [manualOddsToEntry(input.odds, defaultFetchedAt)] : [],
  };
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

type CsvColumn =
  | "fixtureId"
  | "homeTeam"
  | "awayTeam"
  | "kickoff"
  | "knockout"
  | "stage"
  | "mlHome"
  | "mlDraw"
  | "mlAway"
  | "totalLine"
  | "totalOver"
  | "totalUnder"
  | "format"
  | "bookmaker"
  | "fetchedAt";

/**
 * Parse a CSV of fixtures and odds. Strict on purpose: a header row naming
 * the columns (any order, extras ignored), one fixture per row, no quoted
 * commas. Empty cells mean "not provided". Throws with the row number on
 * anything malformed, since silently skipping hand-entered odds is worse
 * than failing loudly.
 *
 * Expected header:
 *   fixtureId,homeTeam,awayTeam,kickoff,knockout,stage,mlHome,mlDraw,mlAway,
 *   totalLine,totalOver,totalUnder,format,bookmaker,fetchedAt
 */
export function parseScorePoolsCsv(csvText: string): ManualFixtureInput[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((cell) => cell.trim());
  const index = new Map<string, number>();
  header.forEach((name, i) => index.set(name, i));
  for (const required of ["fixtureId", "homeTeam", "awayTeam", "kickoff", "mlHome", "mlAway"]) {
    if (!index.has(required)) {
      throw new Error(`Score-pools CSV is missing the required "${required}" column`);
    }
  }

  const fixtures: ManualFixtureInput[] = [];
  for (let row = 1; row < lines.length; row++) {
    const cells = lines[row].split(",").map((cell) => cell.trim());
    const cell = (name: CsvColumn): string | undefined => {
      const i = index.get(name);
      if (i === undefined) return undefined;
      const value = cells[i];
      return value === undefined || value === "" ? undefined : value;
    };
    const requiredCell = (name: CsvColumn): string => {
      const value = cell(name);
      if (value === undefined) {
        throw new Error(`Score-pools CSV row ${row + 1} is missing "${name}"`);
      }
      return value;
    };

    const format = (cell("format") ?? "decimal") as OddsFormat;
    if (!["decimal", "american", "fractional"].includes(format)) {
      throw new Error(`Score-pools CSV row ${row + 1} has unknown odds format "${format}"`);
    }
    const totalLine = cell("totalLine");
    fixtures.push({
      id: requiredCell("fixtureId"),
      homeTeam: requiredCell("homeTeam"),
      awayTeam: requiredCell("awayTeam"),
      kickoff: requiredCell("kickoff"),
      knockout: cell("knockout") === "true",
      stage: cell("stage"),
      odds: {
        moneyline: {
          home: requiredCell("mlHome"),
          draw: cell("mlDraw"),
          away: requiredCell("mlAway"),
        },
        totals: totalLine
          ? {
              line: Number.parseFloat(totalLine),
              over: cell("totalOver"),
              under: cell("totalUnder"),
            }
          : undefined,
        format,
        bookmaker: cell("bookmaker"),
        fetchedAt: cell("fetchedAt"),
      },
    });
  }
  return fixtures;
}
