import {
  fantasyPositionData,
  fantasyPositionDataGeneratedAt,
  fantasyPositionDataSource,
} from "@/data/fantasyPositionData.generated";
import { Player, Position, ScoringFormat } from "@/types";

export type FantasyPositionDataPosition = Extract<Position, "QB" | "RB" | "WR" | "TE" | "K" | "DST">;

// The optional chains cover a generated file that is missing a scoring format
// or a position, which the declared type cannot rule out for committed JSON.
export function getFantasyPositionData(
  position: FantasyPositionDataPosition,
  scoringFormat: ScoringFormat
): Player[] {
  return fantasyPositionData[scoringFormat]?.positions?.[position] ?? [];
}

export function getFantasyOverallData(scoringFormat: ScoringFormat): Player[] {
  return fantasyPositionData[scoringFormat]?.overall ?? [];
}

export function getFantasyPositionDataMetadata(scoringFormat: ScoringFormat) {
  return {
    generatedAt: fantasyPositionDataGeneratedAt,
    source: fantasyPositionDataSource,
    upstreamUpdatedAt: fantasyPositionData[scoringFormat]?.upstreamUpdatedAt ?? null,
  };
}
