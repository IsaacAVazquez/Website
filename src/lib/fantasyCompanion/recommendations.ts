import {
  getContestPreset,
  recommendBestBallPlayers,
} from "@/lib/bestBall";
import type { Player } from "@/types";
import { getAvailablePlayers } from "./players";
import {
  getCurrentPickNumber,
  isFantasyCompanionDraftComplete,
} from "./state";
import type {
  FantasyCompanionDraftState,
  FantasyCompanionRecommendationOptions,
  FantasyCompanionRecommendationResult,
  RedraftRecommendation,
} from "./types";

function positiveFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function redraftSourceRank(player: Player): number {
  return (
    positiveFiniteNumber(player.averageRank) ??
    positiveFiniteNumber(player.rankEcr) ??
    positiveFiniteNumber(player.positionRank) ??
    Number.POSITIVE_INFINITY
  );
}

function normalizedLimit(limit: number | undefined, fallback = 12): number {
  if (limit === undefined) return fallback;
  if (!Number.isFinite(limit)) return 0;
  return Math.max(0, Math.floor(limit));
}

/**
 * Keeps redraft guidance on the scoring-specific consensus board. ADP is
 * displayed as context when present but does not override the sourced rank.
 */
export function rankAvailableRedraftPlayers(
  players: readonly Player[],
  state: FantasyCompanionDraftState,
  limit = 12
): RedraftRecommendation[] {
  if (state.room.kind !== "redraft") {
    throw new TypeError("rankAvailableRedraftPlayers requires a redraft room.");
  }
  if (isFantasyCompanionDraftComplete(state)) return [];

  const currentPick = getCurrentPickNumber(state);
  return getAvailablePlayers(players, state)
    .map((player, sourceIndex) => ({ player, sourceIndex, sourceRank: redraftSourceRank(player) }))
    .filter((entry) => Number.isFinite(entry.sourceRank))
    .sort(
      (left, right) =>
        left.sourceRank - right.sourceRank ||
        (positiveFiniteNumber(left.player.rankEcr) ?? Number.POSITIVE_INFINITY) -
          (positiveFiniteNumber(right.player.rankEcr) ?? Number.POSITIVE_INFINITY) ||
        left.sourceIndex - right.sourceIndex
    )
    .slice(0, normalizedLimit(limit))
    .map(({ player, sourceRank }, index) => {
      const adp = positiveFiniteNumber(player.adp);
      return {
        player,
        rank: index + 1,
        sourceRank,
        valueAtCurrentPick: adp === null ? null : Math.round((currentPick - adp) * 10) / 10,
        reason:
          adp === null
            ? `The ${state.room.scoring} consensus rank is ${sourceRank}. No separate ADP match is available.`
            : `The ${state.room.scoring} consensus rank is ${sourceRank}, and the current ADP is ${adp.toFixed(1)}.`,
      };
    });
}

export function getFantasyCompanionRecommendations({
  state,
  players,
  week17Opponents = {},
  limit,
}: FantasyCompanionRecommendationOptions): FantasyCompanionRecommendationResult {
  if (state.room.kind === "redraft") {
    return {
      kind: "redraft",
      mode: "consensus",
      reason:
        "The redraft list follows the scoring-specific consensus board. ADP is context and does not replace the source rank.",
      recommendations: rankAvailableRedraftPlayers(
        players,
        state,
        normalizedLimit(limit)
      ),
    };
  }

  const preset = getContestPreset(state.room.contestId);
  if (preset.recommendationMode !== "exact") {
    return {
      kind: "best-ball",
      mode: "reference",
      reason: preset.recommendationReason,
      recommendations: [],
    };
  }

  if (isFantasyCompanionDraftComplete(state)) {
    return {
      kind: "best-ball",
      mode: "exact",
      reason: preset.recommendationReason,
      recommendations: [],
    };
  }

  return {
    kind: "best-ball",
    mode: "exact",
    reason: preset.recommendationReason,
    recommendations: recommendBestBallPlayers({
      players,
      picks: state.picks,
      userTeamNumber: state.room.userTeam,
      currentPickNumber: getCurrentPickNumber(state),
      contestId: state.room.contestId,
      week17Opponents,
      limit: normalizedLimit(limit),
    }),
  };
}
