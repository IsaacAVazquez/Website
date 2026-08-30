import type { BestBallSnapshot, BestBallSourceMetadata } from "@/lib/bestBallSnapshot";
import { getFantasySourceCapabilities } from "@/lib/fantasyUtils";
import { getStrategyProfile, hasSupportedBestBallAdp } from "./contests";
import type { BestBallContestPreset } from "./types";

export function getBestBallRankingSource(
  snapshot: BestBallSnapshot,
  preset: BestBallContestPreset
): BestBallSourceMetadata | null {
  return preset.lineupVariant === "superflex"
    ? snapshot.superflexSource
    : snapshot.rankingSource;
}

/**
 * One source gate for both best ball trackers. The board may remain visible
 * when a source is unavailable, but model output pauses until every source the
 * selected contest actually uses is current enough and complete enough.
 */
export function getBestBallModelSourceIssue(
  snapshot: BestBallSnapshot,
  preset: BestBallContestPreset,
  now: Date = new Date()
): string | null {
  const rankingSource = getBestBallRankingSource(snapshot, preset);
  if (rankingSource === null) return "the required ranking source is unavailable";

  const capabilities = getFantasySourceCapabilities({
    rankingAsOf: rankingSource.asOf,
    marketAsOf: snapshot.adpSource?.asOf,
    scheduleAsOf: snapshot.scheduleSource?.asOf,
    season: snapshot.season,
    now,
  });
  if (!capabilities.ranking.usable) return "the required ranking source is stale";

  if (hasSupportedBestBallAdp(preset)) {
    if (snapshot.adpSource === null) {
      return "the matching standard-season Underdog ADP source is unavailable";
    }
    if (!capabilities.market.current) {
      return "the matching standard-season Underdog ADP source is stale";
    }
  }

  if (getStrategyProfile(preset).week17Treatment !== "none") {
    if (snapshot.scheduleSource === null) {
      return "the Week 17 schedule source is unavailable";
    }
    if (!capabilities.schedule.usable) {
      return "the Week 17 schedule source is stale";
    }
    if (Object.keys(snapshot.week17Opponents).length < 30) {
      return "the Week 17 schedule source is incomplete";
    }
  }

  return null;
}
