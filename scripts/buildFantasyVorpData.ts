import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { withRetry } from "./fetchRetry";
import {
  FANTASY_VORP_TEAM_SIZES,
  fetchFantasyProsVorpBoard,
  type FantasyProsVorpPlayer,
  type FantasyVorpTeamSize,
} from "@/lib/fantasyProsVorpSource";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import type { ScoringFormat } from "@/types";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "fantasyVorpData.generated.ts"
);
const SCORING_FORMATS: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];

interface FantasyVorpDataset {
  season: number;
  sourceUrl: string;
  accessedAt: string;
  players: FantasyProsVorpPlayer[];
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
  data: Record<
    ScoringFormat,
    Record<FantasyVorpTeamSize, FantasyVorpDataset>
  >,
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

async function main() {
  const generatedAt = new Date().toISOString();
  const expectedSeason = getSnapshotSeason();
  const data = {} as Record<
    ScoringFormat,
    Record<FantasyVorpTeamSize, FantasyVorpDataset>
  >;

  for (const scoringFormat of SCORING_FORMATS) {
    const byTeamSize = {} as Record<FantasyVorpTeamSize, FantasyVorpDataset>;
    for (const teamSize of FANTASY_VORP_TEAM_SIZES) {
      const board = await withRetry(`${scoringFormat} ${teamSize}-team VORP`, () =>
        fetchFantasyProsVorpBoard(scoringFormat, teamSize, expectedSeason)
      );
      byTeamSize[teamSize] = {
        season: board.season,
        sourceUrl: board.sourceUrl,
        accessedAt: board.accessedAt,
        players: board.players,
      };
      console.log(
        `${scoringFormat} ${teamSize}-team VORP: ${board.players.length} players`
      );
      await pause(250);
    }
    data[scoringFormat] = byTeamSize;
  }

  await atomicWriteFile(
    OUTPUT_PATH,
    renderFantasyVorpDataModule(data, generatedAt)
  );
  console.log(`Wrote fantasy VORP data: ${OUTPUT_PATH}`);
}

if (process.env.NODE_ENV !== "test") {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
