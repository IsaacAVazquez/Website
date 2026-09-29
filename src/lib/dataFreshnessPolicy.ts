import { getNflWeek1Kickoff } from "./fantasyUtils";

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

/**
 * NBA runs mid-October through June. October is day-aware rather than a whole
 * month because the refresh cron starts on the 15th; see the note on the policy.
 */
function isNbaInSeason(now: Date): boolean {
  const value = month(now);
  if (value === 10) return now.getUTCDate() >= 15;
  return inMonthRange(now, 11, 12) || inMonthRange(now, 1, 6);
}

/**
 * The cron starts March 20 and this window opens April 5, by when Opening Day
 * has passed in any season. Until the first game the API returns no standings
 * and the builder keeps last season's file, which a tight target would fail.
 */
function isMlbInSeason(now: Date): boolean {
  const value = month(now);
  if (value === 4) return now.getUTCDate() >= 5;
  if (value === 11) return now.getUTCDate() <= 6;
  return inMonthRange(now, 5, 10);
}

/**
 * FantasyPros freezes its draft board when Week 1 opens and leaves it frozen
 * through the winter (the 2026 board last moved on 2026-09-10). Over that
 * stretch the board's own timestamp says nothing about whether the refresh
 * works, and grading it failed the run every day.
 */
const FANTASY_FROZEN_DAYS = 200;

function isFantasyBoardFrozen(now: Date): boolean {
  const year = now.getUTCFullYear();
  return [year, year - 1].some((season) => {
    const sinceKickoff = now.getTime() - getNflWeek1Kickoff(season);
    return sinceKickoff >= 0 && sinceKickoff < FANTASY_FROZEN_DAYS * DAY_MS;
  });
}

/**
 * Targets for lanes that refresh every few hours. They come from run history
 * and not from the cron lines: in September 2026 GitHub started about two
 * thirds of the scheduled runs, the worst gap between Premier League refreshes
 * was 10.1 hours, and publication added up to 9.5 more. A 4 or 8 hour target
 * read stale on production for a third to a half of all hours and failed any
 * run that fell back once.
 */
const LIVE_TARGET_MS = 20 * HOUR_MS;

// A finished tournament's snapshot is its final record and has no maximum age.
const ARCHIVE_MS = 100 * 365 * DAY_MS;

const POLICIES: Record<DataSurfaceId, DataFreshnessPolicy> = {
  // The summary API serves live USGS data at request time; the committed
  // artifact is only the cold-start fallback, refreshed daily (06:20 UTC, and
  // the run has started as much as seven hours late).
  earthquake: { source: "git-snapshot", maxAgeMs: () => 36 * HOUR_MS },
  "bay-area-transit": { source: "git-snapshot", maxAgeMs: () => LIVE_TARGET_MS },
  "formula-1": {
    source: "git-snapshot",
    maxAgeMs: (now) => (isLiveEventWeekend(now) ? LIVE_TARGET_MS : 36 * HOUR_MS),
  },
  "github-trending": { source: "git-snapshot", maxAgeMs: () => 48 * HOUR_MS },
  golf: {
    source: "git-snapshot",
    maxAgeMs: (now) => (isLiveEventWeekend(now) ? LIVE_TARGET_MS : 36 * HOUR_MS),
  },
  investments: { source: "git-snapshot", maxAgeMs: () => 102 * HOUR_MS },
  spacex: { source: "git-snapshot", maxAgeMs: () => 36 * HOUR_MS },
  // The 2026 tournament ended July 19. The old rule asked for a refresh inside
  // 90 minutes every June and July of every year and went stale for good 45
  // days after the final. Give the next tournament its own dates when it is added.
  "world-cup": { source: "git-snapshot", maxAgeMs: () => ARCHIVE_MS },
  "premier-league": {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 8, 12) || inMonthRange(now, 1, 5) ? LIVE_TARGET_MS : 75 * DAY_MS),
  },
  "la-liga": {
    source: "git-snapshot",
    maxAgeMs: (now) => (inMonthRange(now, 8, 12) || inMonthRange(now, 1, 5) ? LIVE_TARGET_MS : 75 * DAY_MS),
  },
  mlb: {
    source: "git-snapshot",
    maxAgeMs: (now) => (isMlbInSeason(now) ? LIVE_TARGET_MS : 170 * DAY_MS),
  },
  nba: {
    source: "git-snapshot",
    // The refresh cron deliberately starts October 15 ("20 */4 15-31 10 *"),
    // because ESPN has no regular-season leaders before tip-off and the
    // workflow's leaders gate fails on an empty board. A whole-month range
    // declared an 8-hour target from October 1 while no job was scheduled until
    // the 15th, so the surface reported stale-fallback for two weeks with
    // nothing able to clear it and no failure issue, because no run fired. Keep
    // this window aligned with the schedule that actually runs.
    maxAgeMs: (now) => (isNbaInSeason(now) ? LIVE_TARGET_MS : 150 * DAY_MS),
  },
  nfl: {
    source: "git-snapshot",
    // The refresh runs daily in season, so three days is two missed runs.
    maxAgeMs: (now) => (inMonthRange(now, 9, 12) || inMonthRange(now, 1, 2) ? 3 * DAY_MS : 240 * DAY_MS),
  },
  "fantasy-football": {
    // Daily through draft season, frozen from the opener, weekly in spring.
    source: "git-snapshot",
    maxAgeMs: (now) =>
      isFantasyBoardFrozen(now)
        ? FANTASY_FROZEN_DAYS * DAY_MS
        : inMonthRange(now, 7, 9)
          ? 36 * HOUR_MS
          : 10 * DAY_MS,
  },
  "score-pools": { source: "git-snapshot", maxAgeMs: () => LIVE_TARGET_MS },
  // Review windows for hand kept data, set to how fast each one's facts move.
  // At 30 days four of these six were overdue at all times, which told nobody
  // anything.
  "frontier-models": { source: "curated-snapshot", maxAgeMs: () => 45 * DAY_MS },
  "tech-startups": { source: "curated-snapshot", maxAgeMs: () => 90 * DAY_MS },
  "ai-dev-tools": { source: "curated-snapshot", maxAgeMs: () => 60 * DAY_MS },
  "museum-log": { source: "curated-snapshot", maxAgeMs: () => 180 * DAY_MS },
  "travel-deals": { source: "curated-snapshot", maxAgeMs: () => 180 * DAY_MS },
  "food-map": { source: "curated-snapshot", maxAgeMs: () => 180 * DAY_MS },
  // Measured from when the seed was built, which is what the daily refresh
  // controls. It used to read the newest poll's date, so a quiet month at the
  // source would have failed a lane that was working. The page prints the
  // newest poll date for each series.
  polling: { source: "git-snapshot", maxAgeMs: () => 48 * HOUR_MS },
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
