import { fantasyAdpData, fantasyAdpDataGeneratedAt } from "@/data/fantasyAdpData.generated";
import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import type { ScoringFormat } from "@/types";

export interface FantasyAdpDataset {
  entries: FantasyAdpEntry[];
  asOf: string | null;
  sampleSize: number | null;
  sourceUrl: string;
}

const EMPTY_DATASET: FantasyAdpDataset = {
  entries: [],
  asOf: null,
  sampleSize: null,
  sourceUrl: "",
};

/**
 * Reads the generated ADP dataset for a scoring format, tolerating an
 * out-of-shape module the same way `fantasyPositionData.ts` does — a thin or
 * missing dataset degrades to "no ADP" rather than throwing at build time.
 */
export function getFantasyAdpDataset(scoringFormat: ScoringFormat): FantasyAdpDataset {
  const dataset = (fantasyAdpData as Partial<Record<ScoringFormat, unknown>>)[scoringFormat];

  if (!dataset || typeof dataset !== "object") {
    return EMPTY_DATASET;
  }

  const candidate = dataset as Partial<FantasyAdpDataset>;

  return {
    entries: Array.isArray(candidate.entries) ? candidate.entries : [],
    asOf: typeof candidate.asOf === "string" && candidate.asOf ? candidate.asOf : null,
    sampleSize:
      typeof candidate.sampleSize === "number" && Number.isFinite(candidate.sampleSize)
        ? candidate.sampleSize
        : null,
    sourceUrl: typeof candidate.sourceUrl === "string" ? candidate.sourceUrl : "",
  };
}

export function getFantasyAdpDataGeneratedAt(): string | null {
  return typeof fantasyAdpDataGeneratedAt === "string" && fantasyAdpDataGeneratedAt
    ? fantasyAdpDataGeneratedAt
    : null;
}
