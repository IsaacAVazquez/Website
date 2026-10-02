import path from "path";
import { withRetry } from "@/lib/fetchRetry";
import { writeFileAtomic } from "./snapshotFallback";
import {
  FANTASY_PUBLIC_POSITIONS,
  assertFantasyProsRefreshCoverage,
  fetchFantasyProsPublicConsensusBoard,
  type FantasyProsPublicBoard,
  type FantasyPublicPosition,
} from "@/lib/fantasyProsPublicSource";
import { fantasyPositionData } from "@/data/fantasyPositionData.generated";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import { Player, ScoringFormat } from "@/types";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "fantasyPositionData.generated.json"
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

export function recordSourceLabel(
  selectedSourceLabel: string | null,
  board: FantasyProsPublicBoard
): string {
  if (selectedSourceLabel && selectedSourceLabel !== board.sourceLabel) {
    throw new Error(
      `FantasyPros refresh mixed source paths: ${selectedSourceLabel} and ${board.sourceLabel}.`
    );
  }

  return selectedSourceLabel ?? board.sourceLabel;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const expectedSeason = getSnapshotSeason();
  const sharedData = {} as Record<FantasyPositionDataPosition, Player[]>;
  let selectedSourceLabel: string | null = null;

  for (const position of FANTASY_PUBLIC_POSITIONS) {
    if (position === "OVERALL" || !SHARED_POSITIONS.has(position)) {
      continue;
    }

    const board = await withRetry(`STANDARD ${position}`, () =>
      fetchFantasyProsPublicConsensusBoard("STANDARD", position, expectedSeason)
    );
    selectedSourceLabel = recordSourceLabel(selectedSourceLabel, board);
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
    selectedSourceLabel = recordSourceLabel(selectedSourceLabel, overallBoard);
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
      selectedSourceLabel = recordSourceLabel(selectedSourceLabel, board);
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

  if (!selectedSourceLabel) {
    throw new Error("FantasyPros refresh completed without a source label.");
  }

  writeFileAtomic(
    OUTPUT_PATH,
    JSON.stringify({ generatedAt, source: selectedSourceLabel, data: dataset }, null, 2) + "\n"
  );

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

if (process.env.NODE_ENV !== "test") {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
