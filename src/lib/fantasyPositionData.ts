import {
  fantasyPositionData,
  fantasyPositionDataGeneratedAt,
  fantasyPositionDataSource,
} from "@/data/fantasyPositionData.generated";
import { Player, Position, ScoringFormat } from "@/types";

export const FANTASY_SHARED_SCORING_POSITIONS = ["QB", "K", "DST"] as const;
export const FANTASY_POSITION_DATA_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

export type FantasyPositionDataPosition = Extract<
  Position,
  (typeof FANTASY_POSITION_DATA_POSITIONS)[number]
>;

interface LegacyFantasyPositionData {
  [key: string]: Record<FantasyPositionDataPosition, Player[]>;
}

interface FantasyPositionDataset {
  overall: Player[];
  positions: Record<FantasyPositionDataPosition, Player[]>;
  upstreamUpdatedAt: string | null;
}

const EMPTY_POSITIONS = {
  QB: [],
  RB: [],
  WR: [],
  TE: [],
  K: [],
  DST: [],
} satisfies Record<FantasyPositionDataPosition, Player[]>;

function normalizeFantasyPositionDataset(scoringFormat: ScoringFormat): FantasyPositionDataset {
  const scoringData = (fantasyPositionData as LegacyFantasyPositionData | Record<ScoringFormat, unknown>)[
    scoringFormat
  ] as
    | FantasyPositionDataset
    | Record<FantasyPositionDataPosition, Player[]>
    | undefined;

  if (scoringData && typeof scoringData === "object" && "positions" in scoringData) {
    const dataset = scoringData as FantasyPositionDataset;

    return {
      overall: Array.isArray(dataset.overall) ? dataset.overall : [],
      positions: {
        QB: dataset.positions?.QB ?? [],
        RB: dataset.positions?.RB ?? [],
        WR: dataset.positions?.WR ?? [],
        TE: dataset.positions?.TE ?? [],
        K: dataset.positions?.K ?? [],
        DST: dataset.positions?.DST ?? [],
      },
      upstreamUpdatedAt:
        typeof dataset.upstreamUpdatedAt === "string" ? dataset.upstreamUpdatedAt : null,
    };
  }

  const legacyPositions =
    scoringData && typeof scoringData === "object"
      ? (scoringData as Record<FantasyPositionDataPosition, Player[]>)
      : EMPTY_POSITIONS;

  return {
    overall: [],
    positions: {
      QB: legacyPositions.QB ?? [],
      RB: legacyPositions.RB ?? [],
      WR: legacyPositions.WR ?? [],
      TE: legacyPositions.TE ?? [],
      K: legacyPositions.K ?? [],
      DST: legacyPositions.DST ?? [],
    },
    upstreamUpdatedAt: null,
  };
}

export function getFantasyPositionData(
  position: FantasyPositionDataPosition,
  scoringFormat: ScoringFormat
): Player[] {
  return normalizeFantasyPositionDataset(scoringFormat).positions[position] ?? [];
}

export function getFantasyOverallData(scoringFormat: ScoringFormat): Player[] {
  return normalizeFantasyPositionDataset(scoringFormat).overall;
}

export function getFantasyPositionDataForScoring(
  scoringFormat: ScoringFormat
): Record<FantasyPositionDataPosition, Player[]> {
  return normalizeFantasyPositionDataset(scoringFormat).positions;
}

export function getFantasyPositionDataMetadata(scoringFormat?: ScoringFormat) {
  const dataset = scoringFormat ? normalizeFantasyPositionDataset(scoringFormat) : null;

  return {
    generatedAt: fantasyPositionDataGeneratedAt,
    source: fantasyPositionDataSource,
    upstreamUpdatedAt: dataset?.upstreamUpdatedAt ?? null,
  };
}
