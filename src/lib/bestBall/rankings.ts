import { isUndraftedFloorAdp } from "@/lib/draftAnalytics";
import type { Player } from "@/types";
import { DEFAULT_BEST_BALL_CONTEST_ID, getContestPreset } from "./contests";
import { BEST_BALL_POSITIONS } from "./types";
import type {
  BestBallContestId,
  BestBallContestPreset,
  BestBallPosition,
  RankedBestBallPlayer,
} from "./types";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getBestBallEcr(player: Player): number {
  if (isFiniteNumber(player.rankEcr)) return player.rankEcr;
  if (isFiniteNumber(player.averageRank)) return player.averageRank;
  return Number.POSITIVE_INFINITY;
}

export function isBestBallPosition(position: Player["position"]): position is BestBallPosition {
  return BEST_BALL_POSITIONS.includes(position as BestBallPosition);
}

/** Standard formats start with current Underdog ADP. Superflex uses its own
 * half PPR consensus because the snapshot has no separate Superflex ADP feed.
 */
export function sortBestBallRankings(
  players: readonly Player[],
  contest: BestBallContestId | BestBallContestPreset = DEFAULT_BEST_BALL_CONTEST_ID
): RankedBestBallPlayer[] {
  const preset = typeof contest === "string" ? getContestPreset(contest) : contest;
  const eligible = players
    .map((player, sourceIndex) => ({ player, sourceIndex, ecr: getBestBallEcr(player) }))
    .filter(({ player, ecr }) => isBestBallPosition(player.position) && Number.isFinite(ecr));

  return eligible
    .map(({ player, sourceIndex, ecr }) => {
      const isSuperflex = preset.format === "superflex";
      const hasSuperflexRank = isSuperflex && isFiniteNumber(player.superflexRank);
      const atUndraftedFloor =
        isFiniteNumber(player.adp) &&
        isUndraftedFloorAdp(Number(player.adp), preset.rounds, preset.teams);
      const hasUnderdogAdp = !isSuperflex && isFiniteNumber(player.adp) && !atUndraftedFloor;
      const adjustedRank = hasSuperflexRank
        ? Number(player.superflexRank)
        : hasUnderdogAdp
          ? Number(player.adp)
          : ecr;
      const rankAdjustment = adjustedRank - ecr;

      return {
        ...player,
        bestBallRank: 0,
        bestBallEcr: ecr,
        adjustedRank,
        rankAdjustment,
        rankReason:
          hasSuperflexRank
            ? `The sourced Superflex consensus rank is ${Number(player.superflexRank).toFixed(0)}.`
            : isSuperflex
              ? "No separate Superflex consensus match is available, so the best ball rank is unchanged."
              : hasUnderdogAdp
                ? `The current standard Underdog ADP is ${Number(player.adp).toFixed(1)}. The PPR best ball ECR is ${ecr}.`
                : atUndraftedFloor
                  ? `The Underdog ADP of ${Number(player.adp).toFixed(1)} sits at the undrafted floor, so the board uses the PPR best ball ECR of ${ecr} instead.`
                  : "No Underdog ADP match is available, so the board uses the PPR best ball ECR.",
        sourceIndex,
      };
    })
    .sort(
      (left, right) =>
        left.adjustedRank - right.adjustedRank ||
        left.bestBallEcr - right.bestBallEcr ||
        left.sourceIndex - right.sourceIndex
    )
    .map(({ sourceIndex: _sourceIndex, ...player }, index) => ({
      ...player,
      bestBallRank: index + 1,
    }));
}
