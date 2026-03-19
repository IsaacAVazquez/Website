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

export function getFantasyPositionData(
  position: FantasyPositionDataPosition,
  scoringFormat: ScoringFormat
): Player[] {
  return fantasyPositionData[scoringFormat]?.[position] ?? [];
}

export function getFantasyPositionDataForScoring(
  scoringFormat: ScoringFormat
): Record<FantasyPositionDataPosition, Player[]> {
  return fantasyPositionData[scoringFormat];
}

export function getFantasyPositionDataMetadata() {
  return {
    generatedAt: fantasyPositionDataGeneratedAt,
    source: fantasyPositionDataSource,
  };
}
