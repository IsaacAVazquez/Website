import type { BestBallSnapshot, BestBallSourceMetadata } from "@/lib/bestBallSnapshot";
import { getFantasySourceCapabilities } from "@/lib/fantasyUtils";
import type { Player } from "@/types";
import { getStrategyProfile, hasSupportedBestBallAdp } from "./contests";
import type { BestBallContestPreset } from "./types";

/**
 * How far FantasyPros' published `rank_ecr` may sit outside the same row's
 * published `[rank_min, rank_max]` band before the row counts as divergent.
 * On every healthy board measured (the 2026-09-03 best ball build and both
 * redraft boards) no row inside the top 150 by `rank_ave` misses the band by
 * more than 10; on the broken four-expert boards of 2026-09-06 and 2026-09-09,
 * 33 and 39 of the same 150 did, with Jahmyr Gibbs at ECR 54 against a band of
 * 1 to 2. The deep tail drifts on healthy data too, where fewer experts rank
 * every player, so the sample is capped at the top of the board by `rank_ave`
 * rather than the whole list.
 */
export const BEST_BALL_CONSENSUS_BAND_TOLERANCE = 10;
export const BEST_BALL_CONSENSUS_SAMPLE_SIZE = 150;
export const BEST_BALL_CONSENSUS_MAX_DIVERGENT = 5;

export interface BestBallConsensusConsistency {
  ok: boolean;
  /** Rows the test looked at, the top of the board by published `rank_ave`. */
  sampled: number;
  /** Rows in the sample whose `rank_ecr` misses their own band past the tolerance. */
  divergent: number;
  /** The worst offenders, for a log line or an error message. */
  examples: readonly string[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Distance a published consensus rank sits outside the same row's published
 * expert band. Zero inside the band, null when the provider did not publish
 * the band for the row (the official API omits it on some boards).
 */
export function getBestBallConsensusBandGap(player: Player): number | null {
  if (
    !isFiniteNumber(player.rankEcr) ||
    !isFiniteNumber(player.minRank) ||
    !isFiniteNumber(player.maxRank)
  ) {
    return null;
  }
  if (player.rankEcr < player.minRank) return player.minRank - player.rankEcr;
  if (player.rankEcr > player.maxRank) return player.rankEcr - player.maxRank;
  return 0;
}

/** True when a row's own published fields contradict each other past the tolerance. */
export function isBestBallConsensusDivergent(player: Player): boolean {
  const gap = getBestBallConsensusBandGap(player);
  return gap !== null && gap > BEST_BALL_CONSENSUS_BAND_TOLERANCE;
}

/**
 * Provider self-consistency test for the PPR best ball consensus. It compares
 * nothing against the market or against any local model; it only asks whether
 * the provider's own `rank_ecr` agrees with the provider's own expert band on
 * the rows that matter, so passing it is not a judgment about the rankings.
 * Shared by the builder (which fails the fetch) and the readers (which pause
 * the model output and withhold the divergent rows).
 */
export function evaluateBestBallConsensusConsistency(
  players: readonly Player[]
): BestBallConsensusConsistency {
  const sample = players
    .filter((player) => isFiniteNumber(player.rankAverage))
    .sort(
      (left, right) =>
        Number(left.rankAverage) - Number(right.rankAverage) ||
        (left.rankEcr ?? 0) - (right.rankEcr ?? 0)
    )
    .slice(0, BEST_BALL_CONSENSUS_SAMPLE_SIZE);
  const divergent = sample
    .map((player) => ({ player, gap: getBestBallConsensusBandGap(player) ?? 0 }))
    .filter(({ gap }) => gap > BEST_BALL_CONSENSUS_BAND_TOLERANCE)
    .sort((left, right) => right.gap - left.gap);

  return {
    ok: divergent.length <= BEST_BALL_CONSENSUS_MAX_DIVERGENT,
    sampled: sample.length,
    divergent: divergent.length,
    examples: divergent.slice(0, 5).map(
      ({ player }) =>
        `${player.name} (ECR ${player.rankEcr}, experts ${player.minRank} to ${player.maxRank}, average ${Number(player.rankAverage).toFixed(2)})`
    ),
  };
}

export function assertBestBallConsensusConsistency(players: readonly Player[]): void {
  const consistency = evaluateBestBallConsensusConsistency(players);
  if (consistency.ok) return;
  throw new Error(
    `Best ball rankings source disagrees with its own expert ranges: ${consistency.divergent} of the top ${consistency.sampled} players by average rank carry a consensus rank more than ${BEST_BALL_CONSENSUS_BAND_TOLERANCE} places outside their published range (${consistency.examples.join("; ")}).`
  );
}

function formatConsensusDate(asOf: string | null): string {
  if (!asOf || Number.isNaN(Date.parse(asOf))) return "an undated pull";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(asOf));
}

/**
 * Board-level reading for the PPR best ball consensus in a loaded snapshot.
 * Returns a plain clause (lowercase, no trailing period) when the published
 * consensus fails its own self-consistency test, or null when it passes. The
 * board client renders it as a dated note; the tracker folds it into
 * getBestBallModelSourceIssue so the model output pauses.
 */
export function getBestBallConsensusIssue(snapshot: BestBallSnapshot): string | null {
  const consistency = evaluateBestBallConsensusConsistency(snapshot.players);
  if (consistency.ok) return null;
  return `the PPR best ball consensus published ${formatConsensusDate(snapshot.rankingSource.asOf)} disagrees with its own expert ranges on ${consistency.divergent} of its top ${consistency.sampled} players, so its ranks are withheld`;
}

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
 * selected contest actually uses is current enough, complete enough, and
 * consistent with itself.
 */
export function getBestBallModelSourceIssue(
  snapshot: BestBallSnapshot,
  preset: BestBallContestPreset,
  now: Date = new Date()
): string | null {
  const rankingSource = getBestBallRankingSource(snapshot, preset);
  if (rankingSource === null) return "the required ranking source is unavailable";

  // The Superflex lens orders and scores on its own half PPR Superflex
  // consensus, which publishes no expert band to test against, so the PPR
  // self-consistency test applies to the standard lenses only.
  if (preset.lineupVariant !== "superflex") {
    const consensusIssue = getBestBallConsensusIssue(snapshot);
    if (consensusIssue !== null) return consensusIssue;
  }

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
