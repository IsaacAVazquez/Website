import { rename, writeFile } from "fs/promises";
import path from "path";
import { withRetry } from "./fetchRetry";
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  FANTASY_PUBLIC_POSITIONS,
  assertFantasyProsRefreshCoverage,
  fetchFantasyProsPublicConsensusBoard,
  type FantasyPublicPosition,
} from "@/lib/fantasyProsPublicSource";
import { fantasyPositionData } from "@/data/fantasyPositionData.generated";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import { Player, ScoringFormat } from "@/types";

async function atomicWriteFile(targetPath: string, contents: string) {
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, targetPath);
}

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "fantasyPositionData.generated.ts"
);

const FANTASY_POSITION_DATA_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;
const SHARED_POSITIONS = new Set<FantasyPublicPosition>(["QB", "K", "DST"]);

type FantasyPositionDataPosition = (typeof FANTASY_POSITION_DATA_POSITIONS)[number];

interface FantasyPositionDataset {
  season: number;
  overall: Player[];
  positions: Record<FantasyPositionDataPosition, Player[]>;
  upstreamUpdatedAt: string | null;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderGeneratedModule(
  data: Record<ScoringFormat, FantasyPositionDataset>,
  generatedAt: string
): string {
  const serialized = JSON.stringify(data, null, 2);

  return `/**
 * Generated fantasy position data.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

import { Player, ScoringFormat } from "@/types";

export const fantasyPositionDataGeneratedAt = ${JSON.stringify(generatedAt)};
export const fantasyPositionDataSource = ${JSON.stringify(FANTASY_PROS_PUBLIC_SOURCE)};

export const fantasyPositionData: Record<
  ScoringFormat,
  {
    season?: number;
    overall: Player[];
    positions: Record<"QB" | "RB" | "WR" | "TE" | "K" | "DST", Player[]>;
    upstreamUpdatedAt: string | null;
  }
> = ${serialized};
`;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const expectedSeason = getSnapshotSeason();
  const sharedData = {} as Record<FantasyPositionDataPosition, Player[]>;

  for (const position of FANTASY_PUBLIC_POSITIONS) {
    if (position === "OVERALL" || !SHARED_POSITIONS.has(position)) {
      continue;
    }

    const board = await withRetry(`STANDARD ${position}`, () =>
      fetchFantasyProsPublicConsensusBoard("STANDARD", position, expectedSeason)
    );
    assertFantasyProsRefreshCoverage(
      board,
      fantasyPositionData.STANDARD.positions[position],
      fantasyPositionData.STANDARD.season
    );
    sharedData[position] = board.players;
    await pause(250);
  }

  const scoringFormats: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];
  const dataset = {} as Record<ScoringFormat, FantasyPositionDataset>;

  for (const scoringFormat of scoringFormats) {
    const overallBoard = await withRetry(`${scoringFormat} OVERALL`, () =>
      fetchFantasyProsPublicConsensusBoard(scoringFormat, "OVERALL", expectedSeason)
    );
    assertFantasyProsRefreshCoverage(
      overallBoard,
      fantasyPositionData[scoringFormat].overall,
      fantasyPositionData[scoringFormat].season
    );
    await pause(250);

    const positions = {} as Record<FantasyPositionDataPosition, Player[]>;

    for (const position of FANTASY_POSITION_DATA_POSITIONS) {
      if (SHARED_POSITIONS.has(position)) {
        positions[position] = sharedData[position];
        continue;
      }

      const board = await withRetry(`${scoringFormat} ${position}`, () =>
        fetchFantasyProsPublicConsensusBoard(scoringFormat, position, expectedSeason)
      );
      assertFantasyProsRefreshCoverage(
        board,
        fantasyPositionData[scoringFormat].positions[position],
        fantasyPositionData[scoringFormat].season
      );
      positions[position] = board.players;
      await pause(250);
    }

    dataset[scoringFormat] = {
      season: overallBoard.season,
      overall: overallBoard.players,
      positions,
      upstreamUpdatedAt: overallBoard.upstreamUpdatedAt,
    };
  }

  await atomicWriteFile(OUTPUT_PATH, renderGeneratedModule(dataset, generatedAt));

  for (const scoringFormat of scoringFormats) {
    const counts = Object.fromEntries(
      [
        ["OVERALL", dataset[scoringFormat].overall.length],
        ...FANTASY_POSITION_DATA_POSITIONS.map((position) => [
          position,
          dataset[scoringFormat].positions[position].length,
        ]),
      ]
    );

    console.log(`${scoringFormat}:`, counts);
  }

  console.log(`Wrote fantasy position data: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
