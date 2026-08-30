import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { withRetry } from "./fetchRetry";
import { readGeneratedSnapshot } from "./snapshotFallback";
import {
  FANTASY_VORP_TEAM_SIZES,
  fetchFantasyProsVorpBoard,
  getFantasyProsVorpUrl,
  type FantasyProsVorpPlayer,
  type FantasyVorpTeamSize,
} from "@/lib/fantasyProsVorpSource";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import type { ScoringFormat } from "@/types";

/**
 * Fetches the nine published FantasyPros VORP reports (three scoring formats
 * by 10, 12, and 14 teams) into `src/data/fantasyVorpData.generated.ts`.
 *
 * VORP is a fail-soft overlay on the consensus board, like ADP: a report that
 * fails to fetch or parse keeps its previous same-season copy, a report with
 * nothing usable publishes empty so the snapshot builder leaves that league
 * size out, and nothing here ever stops the `update:fantasy` chain.
 */
const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "fantasyVorpData.generated.ts"
);
const SCORING_FORMATS: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];

export interface FantasyVorpDataset {
  season: number;
  sourceUrl: string;
  accessedAt: string;
  players: FantasyProsVorpPlayer[];
}

type FantasyVorpDataRecord = Record<
  ScoringFormat,
  Record<FantasyVorpTeamSize, FantasyVorpDataset>
>;

export type VorpDatasetResolution = {
  record: FantasyVorpDataset | null;
  source: "fresh" | "previous" | "empty";
};

type FetchVorpBoard = typeof fetchFantasyProsVorpBoard;

/**
 * Mirrors resolveAdpFormat: a usable fresh board wins, a failed fetch keeps
 * the previous board from the same season, and anything else is empty. There
 * is no relative-coverage check because the parser already enforces the
 * 300-row floor, sequential ranks, and ordered values on every fresh board.
 */
export function resolveVorpDataset(
  fresh: FantasyVorpDataset | null,
  previous: FantasyVorpDataset | null,
  expectedSeason: number
): VorpDatasetResolution {
  const usable = (dataset: FantasyVorpDataset | null): dataset is FantasyVorpDataset =>
    dataset !== null && dataset.season === expectedSeason && dataset.players.length > 0;
  if (usable(fresh)) return { record: fresh, source: "fresh" };
  if (usable(previous)) return { record: previous, source: "previous" };
  return { record: null, source: "empty" };
}

async function atomicWriteFile(targetPath: string, contents: string) {
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, targetPath);
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function renderFantasyVorpDataModule(
  data: FantasyVorpDataRecord,
  generatedAt: string
): string {
  return `/**
 * Generated fantasy VORP data.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

import type {
  FantasyProsVorpPlayer,
  FantasyVorpTeamSize,
} from "@/lib/fantasyProsVorpSource";
import type { ScoringFormat } from "@/types";

export const fantasyVorpDataGeneratedAt = ${JSON.stringify(generatedAt)};

export interface FantasyVorpDataset {
  season: number;
  sourceUrl: string;
  accessedAt: string;
  players: FantasyProsVorpPlayer[];
}

export const fantasyVorpData: Record<
  ScoringFormat,
  Record<FantasyVorpTeamSize, FantasyVorpDataset>
> = ${JSON.stringify(data, null, 2)};
`;
}

export async function buildFantasyVorpData(
  fetchBoard: FetchVorpBoard = fetchFantasyProsVorpBoard,
  outputPath = OUTPUT_PATH
): Promise<void> {
  const generatedAt = new Date().toISOString();
  const expectedSeason = getSnapshotSeason();
  const previous = readGeneratedSnapshot<FantasyVorpDataRecord>(outputPath, "fantasyVorpData");
  const data = {} as FantasyVorpDataRecord;
  const notes: string[] = [];
  let totalPlayers = 0;

  for (const scoringFormat of SCORING_FORMATS) {
    const byTeamSize = {} as Record<FantasyVorpTeamSize, FantasyVorpDataset>;
    for (const teamSize of FANTASY_VORP_TEAM_SIZES) {
      let fresh: FantasyVorpDataset | null = null;
      try {
        const board = await withRetry(`${scoringFormat} ${teamSize}-team VORP`, () =>
          fetchBoard(scoringFormat, teamSize, expectedSeason)
        );
        fresh = {
          season: board.season,
          sourceUrl: board.sourceUrl,
          accessedAt: board.accessedAt,
          players: board.players,
        };
      } catch (error) {
        console.warn(
          `[vorp] ${scoringFormat} ${teamSize}-team fetch failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      const resolution = resolveVorpDataset(
        fresh,
        previous?.[scoringFormat]?.[teamSize] ?? null,
        expectedSeason
      );
      // An empty board keeps the module's non-partial shape; the snapshot
      // builder treats an empty player list as "publish without this size".
      byTeamSize[teamSize] = resolution.record ?? {
        season: expectedSeason,
        sourceUrl: getFantasyProsVorpUrl(scoringFormat, teamSize),
        accessedAt: "",
        players: [],
      };
      totalPlayers += byTeamSize[teamSize].players.length;
      notes.push(
        `${scoringFormat} ${teamSize}-team: ${byTeamSize[teamSize].players.length} players (${resolution.source}, accessed ${byTeamSize[teamSize].accessedAt || "never"})`
      );
      await pause(250);
    }
    data[scoringFormat] = byTeamSize;
  }

  if (totalPlayers === 0) {
    console.warn("[vorp] no VORP data (fresh or previous); leaving the existing module untouched.");
    return;
  }

  await atomicWriteFile(outputPath, renderFantasyVorpDataModule(data, generatedAt));
  for (const note of notes) console.log(`[vorp] ${note}`);
  console.log(`Wrote fantasy VORP data: ${outputPath}`);
}

if (process.env.NODE_ENV !== "test") {
  buildFantasyVorpData().catch((error) => {
    // Unexpected failures (filesystem, programming errors) are still non-fatal:
    // VORP must never block the consensus refresh.
    console.warn(`[vorp] unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(0);
  });
}
