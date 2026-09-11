import { isUndraftedFloorAdp } from "@/lib/draftAnalytics";
import type { Player } from "@/types";
import {
  DEFAULT_BEST_BALL_CONTEST_ID,
  getContestPreset,
  hasSupportedBestBallAdp,
} from "./contests";
import {
  evaluateBestBallConsensusConsistency,
  isBestBallConsensusDivergent,
} from "./sourceCapabilities";
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

function getBestBallEcr(player: Player): number {
  if (isFiniteNumber(player.rankEcr)) return player.rankEcr;
  if (isFiniteNumber(player.averageRank)) return player.averageRank;
  return Number.POSITIVE_INFINITY;
}

export function isBestBallPosition(position: Player["position"]): position is BestBallPosition {
  return BEST_BALL_POSITIONS.includes(position as BestBallPosition);
}

const WITHHELD_ECR_CLAUSE =
  "The published PPR best ball consensus rank for this player sits outside its own expert range, so the ECR is withheld.";

/** Standard formats start with current Underdog ADP. Superflex uses its own
 * half PPR consensus because the snapshot has no separate Superflex ADP feed.
 *
 * When the PPR consensus fails its own self-consistency test (see
 * evaluateBestBallConsensusConsistency), each divergent row is stamped
 * `consensusWithheld: true` and its `rankReason` drops the ECR clause. The
 * order is untouched: ADP lenses still order on ADP, and the ECR fallback
 * still orders on the published `rankEcr`, because manufacturing an order from
 * `rankAverage` would be a local adjustment. The flag only tells the UI which
 * rows should print no value, reach, tier, position rank, or ECR.
 */
export function sortBestBallRankings(
  players: readonly Player[],
  contest: BestBallContestId | BestBallContestPreset = DEFAULT_BEST_BALL_CONTEST_ID
): RankedBestBallPlayer[] {
  const preset = typeof contest === "string" ? getContestPreset(contest) : contest;
  const boardConsistent = evaluateBestBallConsensusConsistency(players).ok;
  const eligible = players
    .map((player, sourceIndex) => ({ player, sourceIndex, ecr: getBestBallEcr(player) }))
    .filter(({ player, ecr }) => isBestBallPosition(player.position) && Number.isFinite(ecr));

  return eligible
    .map(({ player, sourceIndex, ecr }) => {
      const isSuperflex = preset.lineupVariant === "superflex";
      const supportsAdp = hasSupportedBestBallAdp(preset);
      const hasSuperflexRank = isSuperflex && isFiniteNumber(player.superflexRank);
      const atUndraftedFloor =
        isFiniteNumber(player.adp) &&
        isUndraftedFloorAdp(Number(player.adp), preset.rounds, preset.teams);
      const hasUnderdogAdp = supportsAdp && isFiniteNumber(player.adp) && !atUndraftedFloor;
      const consensusWithheld = !boardConsistent && isBestBallConsensusDivergent(player);
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
        isUndraftedAtContestFloor: supportsAdp && atUndraftedFloor,
        consensusWithheld,
        rankReason:
          hasSuperflexRank
            ? `The sourced Superflex consensus rank is ${Number(player.superflexRank).toFixed(0)}.`
            : isSuperflex
              ? "No separate Superflex consensus match is available, so the best ball rank is unchanged."
              : hasUnderdogAdp
                ? consensusWithheld
                  ? `The current standard Underdog ADP is ${Number(player.adp).toFixed(1)}. ${WITHHELD_ECR_CLAUSE}`
                  : `The current standard Underdog ADP is ${Number(player.adp).toFixed(1)}. The PPR best ball ECR is ${ecr}.`
                : !supportsAdp
                  ? consensusWithheld
                    ? `This contest has no matching ADP source, so the board keeps the published PPR best ball order and does not score market value. ${WITHHELD_ECR_CLAUSE}`
                    : "This contest has no matching ADP source, so the board uses PPR best ball ECR and does not score market value."
                : atUndraftedFloor
                  ? consensusWithheld
                    ? `The Underdog ADP of ${Number(player.adp).toFixed(1)} sits at the undrafted floor, so the board keeps the published PPR best ball order instead. ${WITHHELD_ECR_CLAUSE}`
                    : `The Underdog ADP of ${Number(player.adp).toFixed(1)} sits at the undrafted floor, so the board uses the PPR best ball ECR of ${ecr} instead.`
                  : consensusWithheld
                    ? `No Underdog ADP match is available, so the board keeps the published PPR best ball order. ${WITHHELD_ECR_CLAUSE}`
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
