import type { FantasyGameLogEntry } from "@/lib/fantasyGameLogSource";
import type { ScoringFormat } from "@/types";
import raw from "./fantasyGameLogData.generated.json";

export const fantasyGameLogDataGeneratedAt: string | null = raw.generatedAt;

export const fantasyGameLogData = raw.data as Record<
  ScoringFormat,
  {
    entries: FantasyGameLogEntry[];
    season: number | null;
    seasonType: string;
    sourceUrl: string;
    throughWeek: number | null;
  }
>;
