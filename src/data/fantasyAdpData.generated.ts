import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import type { ScoringFormat } from "@/types";
import raw from "./fantasyAdpData.generated.json";

export const fantasyAdpDataGeneratedAt: string = raw.generatedAt;

export const fantasyAdpData = raw.data as Record<
  ScoringFormat,
  {
    entries: FantasyAdpEntry[];
    asOf: string | null;
    sampleSize: number | null;
    sourceUrl: string;
    season?: number | null;
  }
>;
