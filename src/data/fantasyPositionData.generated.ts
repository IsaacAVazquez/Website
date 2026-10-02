import type { Player, ScoringFormat } from "@/types";
import raw from "./fantasyPositionData.generated.json";

export const fantasyPositionDataGeneratedAt: string = raw.generatedAt;
export const fantasyPositionDataSource: string = raw.source;

export const fantasyPositionData = raw.data as Record<
  ScoringFormat,
  {
    season?: number;
    overall: Player[];
    positions: Record<"QB" | "RB" | "WR" | "TE" | "K" | "DST", Player[]>;
    upstreamUpdatedAt: string | null;
  }
>;
