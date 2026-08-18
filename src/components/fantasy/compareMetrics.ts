import {
  getAdpSignalThreshold,
  hasReliableAdpSample,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

type Direction = "lower" | "higher" | "none";
type MetricValueResolver = (player: Player) => number | null;

function metricValue(player: Player, key: string): number | null {
  switch (key) {
    case "posRank":
      return Number.isFinite(player.positionRank) ? (player.positionRank as number) : null;
    case "rank":
      return Number.isFinite(player.rankEcr)
        ? (player.rankEcr as number)
        : Number.isFinite(player.averageRank)
          ? player.averageRank
          : null;
    case "tier":
      return Number.isFinite(player.tier) ? (player.tier as number) : null;
    case "adp":
      return Number.isFinite(player.adp) ? (player.adp as number) : null;
    case "own":
      return Number.isFinite(player.ownership) ? (player.ownership as number) : null;
    default:
      return null;
  }
}

/**
 * How far apart two players have to be on a row before the better value is
 * called a win. Current ADP snapshots replace the fallback with the larger
 * player-level uncertainty estimate.
 */
export const MIN_MEANINGFUL_DELTA: Record<string, number> = {
  rank: 1,
  posRank: 1,
  tier: 1,
  adp: 10,
  own: 5,
};

/**
 * Index of the player who wins a metric row, or -1 when the result is a wash.
 */
export function bestIndex(
  players: Player[],
  key: string,
  direction: Direction,
  resolveValue?: MetricValueResolver
): number {
  if (direction === "none") return -1;

  const scored = players
    .map((player, index) => ({
      index,
      value: resolveValue ? resolveValue(player) : metricValue(player, key),
    }))
    .filter((entry): entry is { index: number; value: number } => entry.value !== null);
  if (scored.length < 2) return -1;

  const ranked = [...scored].sort((a, b) =>
    direction === "lower" ? a.value - b.value : b.value - a.value,
  );
  const [best, runnerUp] = ranked;
  const gap = Math.abs(best.value - runnerUp.value);
  let threshold = MIN_MEANINGFUL_DELTA[key] ?? 0;
  if (key === "adp") {
    const bestPlayer = players[best.index];
    const runnerUpPlayer = players[runnerUp.index];
    if (!hasReliableAdpSample(bestPlayer) || !hasReliableAdpSample(runnerUpPlayer)) {
      return -1;
    }
    threshold = Math.max(
      getAdpSignalThreshold(bestPlayer),
      getAdpSignalThreshold(runnerUpPlayer)
    );
  }

  return gap > 0 && gap >= threshold ? best.index : -1;
}
