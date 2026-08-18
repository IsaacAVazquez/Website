import { fantasyGameLogData } from "@/data/fantasyGameLogData.generated";
import type { FantasyGameLogEntry } from "@/lib/fantasyGameLogSource";
import type { ScoringFormat } from "@/types";

export interface FantasyGameLogDataset {
  entries: FantasyGameLogEntry[];
  season: number | null;
  seasonType: string;
  sourceUrl: string;
  throughWeek: number | null;
}

const EMPTY_DATASET: FantasyGameLogDataset = {
  entries: [],
  season: null,
  seasonType: "REG",
  sourceUrl: "",
  throughWeek: null,
};

/**
 * Reads the generated per-game scoring dataset for a scoring format, tolerating
 * an out-of-shape module the same way `fantasyAdpData.ts` does — a thin or
 * missing dataset degrades to "no scoring history" rather than throwing at
 * build time, and the drawer simply omits the panel.
 */
export function getFantasyGameLogDataset(scoringFormat: ScoringFormat): FantasyGameLogDataset {
  const dataset = (fantasyGameLogData as Partial<Record<ScoringFormat, unknown>>)[scoringFormat];

  if (!dataset || typeof dataset !== "object") {
    return EMPTY_DATASET;
  }

  const candidate = dataset as Partial<FantasyGameLogDataset>;

  return {
    entries: Array.isArray(candidate.entries) ? candidate.entries : [],
    season:
      typeof candidate.season === "number" && Number.isInteger(candidate.season)
        ? candidate.season
        : null,
    seasonType: typeof candidate.seasonType === "string" ? candidate.seasonType : "REG",
    sourceUrl: typeof candidate.sourceUrl === "string" ? candidate.sourceUrl : "",
    throughWeek:
      typeof candidate.throughWeek === "number" && Number.isInteger(candidate.throughWeek)
        ? candidate.throughWeek
        : null,
  };
}
