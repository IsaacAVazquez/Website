import { rename, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { withRetry } from "./fetchRetry";
import { readGeneratedSnapshot } from "./snapshotFallback";
import {
  fetchFantasyGameLogBoard,
  MIN_GAME_LOG_GAMES,
  type FantasyGameLogEntry,
} from "@/lib/fantasyGameLogSource";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import { ScoringFormat } from "@/types";

/**
 * Fetches per-game fantasy scoring from nflverse for each scoring format and
 * writes the generated module the snapshot builder reads. Like ADP, this is a
 * layer on top of the FantasyPros consensus refresh and never fails the
 * `update:fantasy` chain: a failed or thin fetch keeps the previous generated
 * data (its own season stays disclosed) or leaves the empty seed in place, and
 * the drawer then ships without the points-per-game panel.
 */

const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "fantasyGameLogData.generated.ts");

interface FantasyGameLogDatasetRecord {
  entries: FantasyGameLogEntry[];
  season: number | null;
  seasonType: string;
  sourceUrl: string;
  throughWeek: number | null;
}

type FantasyGameLogDataRecord = Record<ScoringFormat, FantasyGameLogDatasetRecord>;

const SCORING_FORMATS: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];

/**
 * Players a usable board must carry. A healthy regular season clears several
 * hundred once the `MIN_GAME_LOG_GAMES` floor is applied; a handful means the
 * season has barely started or the release is mid-publish.
 */
export const MIN_GAME_LOG_ENTRIES = 100;

export type GameLogFormatResolution = {
  record: FantasyGameLogDatasetRecord | null;
  source: "fresh" | "previous" | "thin-fresh" | "empty";
};

/**
 * Chooses the record to keep for one scoring format. A fresh board is used only
 * when it clears the entry floor; a thin board or a failed fetch falls back to
 * the previous fuller board so a good season is never overwritten by a
 * half-published release. A newer season always wins once it clears the floor,
 * which is how the panel rolls forward without a manual edit.
 */
export function resolveGameLogFormat(
  fresh: FantasyGameLogDatasetRecord | null,
  previous: FantasyGameLogDatasetRecord | null,
  floor: number = MIN_GAME_LOG_ENTRIES
): GameLogFormatResolution {
  if (fresh && fresh.entries.length >= floor) {
    return { record: fresh, source: "fresh" };
  }
  if (previous && previous.entries.length > 0) {
    return { record: previous, source: "previous" };
  }
  if (fresh && fresh.entries.length > 0) {
    return { record: fresh, source: "thin-fresh" };
  }
  return { record: null, source: "empty" };
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function atomicWriteFile(targetPath: string, contents: string) {
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, targetPath);
}

function renderGeneratedModule(data: FantasyGameLogDataRecord, generatedAt: string): string {
  const serialized = JSON.stringify(data, null, 2);

  return `/**
 * Generated fantasy per-game scoring data.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

import type { FantasyGameLogEntry } from "@/lib/fantasyGameLogSource";
import type { ScoringFormat } from "@/types";

export const fantasyGameLogDataGeneratedAt: string | null = ${JSON.stringify(generatedAt)};

export const fantasyGameLogData: Record<
  ScoringFormat,
  {
    entries: FantasyGameLogEntry[];
    season: number | null;
    seasonType: string;
    sourceUrl: string;
    throughWeek: number | null;
  }
> = ${serialized};
`;
}

/**
 * Seasons to try, newest first. During the offseason the current season's file
 * does not exist yet (or carries a stub), so the completed prior season is what
 * the panel should describe. Trying both in order lets the rollover happen on
 * its own once the new season has enough games behind it.
 */
export function candidateSeasons(now: Date = new Date()): number[] {
  const current = getSnapshotSeason(now);
  return [current, current - 1];
}

async function fetchFirstUsableSeason(
  scoringFormat: ScoringFormat,
  seasons: number[]
): Promise<FantasyGameLogDatasetRecord | null> {
  for (const season of seasons) {
    try {
      const board = await withRetry(`game log ${scoringFormat} ${season}`, () =>
        fetchFantasyGameLogBoard(scoringFormat, season)
      );
      if (board.entries.length >= MIN_GAME_LOG_ENTRIES) {
        return {
          entries: board.entries,
          season: board.season,
          seasonType: board.seasonType,
          sourceUrl: board.sourceUrl,
          throughWeek: board.throughWeek,
        };
      }
      console.warn(
        `[game-log] ${scoringFormat} ${season} returned ${board.entries.length} players ` +
          `(min ${MIN_GAME_LOG_ENTRIES} at a ${MIN_GAME_LOG_GAMES}-game floor); trying an earlier season.`
      );
    } catch (error) {
      console.warn(
        `[game-log] ${scoringFormat} ${season} fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  return null;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const seasons = candidateSeasons();
  const previous = readGeneratedSnapshot<FantasyGameLogDataRecord>(
    OUTPUT_PATH,
    "fantasyGameLogData"
  );
  const dataset = {} as FantasyGameLogDataRecord;
  const notes: string[] = [];

  for (const scoringFormat of SCORING_FORMATS) {
    const fresh = await fetchFirstUsableSeason(scoringFormat, seasons);
    const previousRecord = previous?.[scoringFormat] ?? null;
    const resolution = resolveGameLogFormat(fresh, previousRecord);

    dataset[scoringFormat] = resolution.record ?? {
      entries: [],
      season: previousRecord?.season ?? null,
      seasonType: "REG",
      sourceUrl: previousRecord?.sourceUrl ?? "",
      throughWeek: previousRecord?.throughWeek ?? null,
    };
    notes.push(
      `${scoringFormat}: ${dataset[scoringFormat].entries.length} players (${resolution.source}, ` +
        `season ${dataset[scoringFormat].season ?? "unknown"}, through week ${
          dataset[scoringFormat].throughWeek ?? "?"
        })`
    );
    await pause(250);
  }

  const totalEntries = SCORING_FORMATS.reduce(
    (total, format) => total + (dataset[format]?.entries.length ?? 0),
    0
  );

  if (totalEntries === 0) {
    console.warn(
      "[game-log] no per-game data (fresh or previous); leaving the existing module untouched."
    );
    return;
  }

  await atomicWriteFile(OUTPUT_PATH, renderGeneratedModule(dataset, generatedAt));

  for (const note of notes) console.log(`[game-log] ${note}`);
  console.log(`Wrote fantasy game-log data: ${OUTPUT_PATH}`);
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    // Unexpected failures stay non-fatal: per-game scoring must never block the
    // consensus refresh.
    console.warn(
      `[game-log] unexpected failure: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(0);
  });
}
