import { writeFile } from "fs/promises";
import path from "path";
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  FANTASY_PUBLIC_POSITIONS,
  fetchFantasyProsPublicConsensusBoard,
  type FantasyPublicPosition,
} from "@/lib/fantasyProsPublicSource";
import { Player, ScoringFormat } from "@/types";

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
  overall: Player[];
  positions: Record<FantasyPositionDataPosition, Player[]>;
  upstreamUpdatedAt: string | null;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
  backoffMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const wait = backoffMs * attempt;
        console.warn(
          `[retry] ${label} attempt ${attempt}/${attempts} failed (${
            error instanceof Error ? error.message : String(error)
          }). Retrying in ${wait}ms.`
        );
        await pause(wait);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`[retry] ${label} failed after ${attempts} attempts`);
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
    overall: Player[];
    positions: Record<"QB" | "RB" | "WR" | "TE" | "K" | "DST", Player[]>;
    upstreamUpdatedAt: string | null;
  }
> = ${serialized};
`;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const sharedData = {} as Record<FantasyPositionDataPosition, Player[]>;

  for (const position of FANTASY_PUBLIC_POSITIONS) {
    if (position === "OVERALL" || !SHARED_POSITIONS.has(position)) {
      continue;
    }

    const board = await withRetry(`STANDARD ${position}`, () =>
      fetchFantasyProsPublicConsensusBoard("STANDARD", position)
    );
    sharedData[position] = board.players;
    await pause(250);
  }

  const scoringFormats: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];
  const dataset = {} as Record<ScoringFormat, FantasyPositionDataset>;

  for (const scoringFormat of scoringFormats) {
    const overallBoard = await withRetry(`${scoringFormat} OVERALL`, () =>
      fetchFantasyProsPublicConsensusBoard(scoringFormat, "OVERALL")
    );
    await pause(250);

    const positions = {} as Record<FantasyPositionDataPosition, Player[]>;

    for (const position of FANTASY_POSITION_DATA_POSITIONS) {
      if (SHARED_POSITIONS.has(position)) {
        positions[position] = sharedData[position];
        continue;
      }

      const board = await withRetry(`${scoringFormat} ${position}`, () =>
        fetchFantasyProsPublicConsensusBoard(scoringFormat, position)
      );
      positions[position] = board.players;
      await pause(250);
    }

    dataset[scoringFormat] = {
      overall: overallBoard.players,
      positions,
      upstreamUpdatedAt: overallBoard.upstreamUpdatedAt,
    };
  }

  await writeFile(OUTPUT_PATH, renderGeneratedModule(dataset, generatedAt), "utf8");

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
