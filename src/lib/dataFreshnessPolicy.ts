const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type DataSurfaceId =
  | "earthquake"
  | "bay-area-transit"
  | "formula-1"
  | "github-trending"
  | "golf"
  | "investments"
  | "spacex"
  | "world-cup"
  | "premier-league"
  | "la-liga"
  | "mlb"
  | "nba"
  | "nfl"
  | "fantasy-football"
  | "score-pools"
  | "frontier-models"
  | "tech-startups"
  | "ai-dev-tools"
  | "museum-log"
  | "travel-deals"
  | "food-map"
  | "polling"
  | "news-pulse"
  | "mba-jobs";

interface DataFreshnessPolicy {
  source: "git-snapshot" | "curated-snapshot" | "runtime-fetch";
  maxAgeMs: (now: Date) => number;
}

function month(now: Date): number {
  return now.getUTCMonth() + 1;
}

function isLiveEventWeekend(now: Date): boolean {
  const day = now.getUTCDay();
  return day === 0 || day >= 4;
}

function inMonthRange(now: Date, start: number, end: number): boolean {
  const value = month(now);
  return value >= start && value <= end;
}

const POLICIES: Record<DataSurfaceId, DataFreshnessPolicy> = {
  // The summary API serves live USGS data at request time; the committed
  // artifact is only the cold-start fallback, refreshed daily (06:20 UTC).
  earthquake: { source: "git-snapshot", maxAgeMs: () => 26 * HOUR_MS },
  "bay-area-transit": { source: "git-snapshot", maxAgeMs: () => 8 * HOUR_MS },
  "formula-1": {
    source: "git-snapshot",
    maxAgeMs: (now) => (isLiveEventWeekend(now) ? 4 * HOUR_MS : 36 * HOUR_MS),
  },
  "github-trending": { source: "git-snapshot", maxAgeMs: () => 36 * HOUR_MS },
  golf: {
    source: "git-snapshot",
    maxAgeMs: (now) => (isLiveEventWeekend(now) ? 4 * HOUR_MS : 36 * HOUR_MS),
  },
  investments: { source: "git-snapshot", maxAgeMs: () => 102 * HOUR_MS },
  spacex: { source: "git-snapshot", maxAgeMs: () => 36 * HOUR_MS },
  "world-cup": {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 6, 7) ? 90 * 60 * 1000 : 45 * DAY_MS),
  },
  "premier-league": {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 8, 12) || inMonthRange(now, 1, 5) ? 8 * HOUR_MS : 75 * DAY_MS),
  },
  "la-liga": {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 8, 12) || inMonthRange(now, 1, 5) ? 8 * HOUR_MS : 75 * DAY_MS),
  },
  mlb: {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 3, 11) ? 8 * HOUR_MS : 120 * DAY_MS),
  },
  nba: {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 10, 12) || inMonthRange(now, 1, 6) ? 8 * HOUR_MS : 150 * DAY_MS),
  },
  nfl: {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 9, 12) || inMonthRange(now, 1, 2) ? 8 * DAY_MS : 240 * DAY_MS),
  },
  "fantasy-football": {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 7, 9) ? 30 * HOUR_MS : 10 * DAY_MS),
  },
  "score-pools": { source: "git-snapshot", maxAgeMs: () => 8 * HOUR_MS },
  "frontier-models": { source: "curated-snapshot", maxAgeMs: () => 45 * DAY_MS },
  "tech-startups": { source: "curated-snapshot", maxAgeMs: () => 180 * DAY_MS },
  "ai-dev-tools": { source: "curated-snapshot", maxAgeMs: () => 30 * DAY_MS },
  "museum-log": { source: "curated-snapshot", maxAgeMs: () => 30 * DAY_MS },
  "travel-deals": { source: "curated-snapshot", maxAgeMs: () => 30 * DAY_MS },
  "food-map": { source: "curated-snapshot", maxAgeMs: () => 90 * DAY_MS },
  polling: { source: "git-snapshot", maxAgeMs: () => 21 * DAY_MS },
  // Request-time surfaces. "Source age" is the last refresh that served usable
  // data, read from the durable heartbeat. Targets are generous because these
  // only refresh when the route is actually hit, so a quiet stretch shouldn't
  // read as a broken pipeline. News headlines move faster than job boards.
  "news-pulse": { source: "runtime-fetch", maxAgeMs: () => 6 * HOUR_MS },
  "mba-jobs": { source: "runtime-fetch", maxAgeMs: () => 30 * HOUR_MS },
};

export const DATA_SURFACE_IDS = Object.freeze(
  Object.keys(POLICIES) as DataSurfaceId[]
);

export function getDataFreshnessPolicy(
  surface: DataSurfaceId,
  now = new Date()
): { source: DataFreshnessPolicy["source"]; maxAgeMs: number } {
  const policy = POLICIES[surface];
  return {
    source: policy.source,
    maxAgeMs: policy.maxAgeMs(now),
  };
}
