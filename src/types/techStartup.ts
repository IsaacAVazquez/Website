export type TechStartupSegmentKind = "sector" | "stage";

export type TechStartupSortKey = "momentum" | "valuation" | "raised" | "recent";

export interface TechStartupRound {
  /** Latest disclosed round label, e.g. "Series C", "Seed". */
  stage: string;
  /** Round size in USD. */
  amount: number;
  /** Announcement month, formatted YYYY-MM. */
  date: string;
  /** Lead investor(s) on the round. */
  leadInvestors: string[];
}

export interface TechStartup {
  /** Stable slug used in URLs and segment references. */
  id: string;
  name: string;
  description: string;
  /** Sector segment key, e.g. "sector-ai". */
  sector: string;
  /** Stage bucket segment key, e.g. "stage-late". */
  stage: string;
  headquarters: string;
  country: string;
  founded: number;
  website: string;
  /** Total disclosed funding to date, in USD. */
  totalRaised: number;
  /** Most recent post-money valuation in USD, or null if undisclosed. */
  valuation: number | null;
  /** Headcount band, e.g. "501-1,000". */
  employees: string;
  lastRound: TechStartupRound;
  notableInvestors: string[];
  tags: string[];
  /** Composite momentum score derived from raise recency, round size, and valuation. */
  momentumScore: number;
}

export interface TechStartupSegment {
  key: string;
  label: string;
  kind: TechStartupSegmentKind;
  startupIds: string[];
  startupCount: number;
  totalRaised: number;
  totalValuation: number;
  topStartupId: string | null;
}

export interface TechStartupSnapshotTotals {
  startups: number;
  sectors: number;
  stages: number;
  totalRaised: number;
  totalValuation: number;
  /** Companies with a disclosed valuation at or above $1B. */
  unicornCount: number;
}

export interface TechStartupSnapshot {
  generatedAt: string;
  /** Editorial as-of date for the figures (YYYY-MM-DD). */
  asOf: string;
  /** False while figures remain illustrative and unverified against a single dated source. */
  verified: boolean;
  sourceLabel: string;
  sourceUrl: string;
  disclaimer: string;
  /** ISO 4217 currency the monetary figures are expressed in. */
  currency: string;
  startups: TechStartup[];
  sectors: TechStartupSegment[];
  stages: TechStartupSegment[];
  totals: TechStartupSnapshotTotals;
}

export interface TechStartupRouteState {
  kind: TechStartupSegmentKind;
  segment: string;
  sort: TechStartupSortKey;
  selectedStartupId: string | null;
}
