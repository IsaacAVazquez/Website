import type { Player } from "@/types";
import {
  DEFAULT_BEST_BALL_CONTEST_ID,
  getContestPreset,
  getStrategyProfile,
} from "./contests";
import { sortBestBallRankings } from "./rankings";
import { getAdaptiveRosterTargets } from "./strategy";
import type {
  BestBallPosition,
  BestBallRecommendation,
  BestBallRecommendationComponents,
  BestBallRecommendationReason,
  RecommendBestBallOptions,
} from "./types";

function roundScore(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPassCatcher(player: Player): boolean {
  return player.position === "WR" || player.position === "TE";
}

function formsQbPassCatcherStack(candidate: Player, roster: readonly Player[]): number {
  const team = candidate.team.trim().toUpperCase();
  if (!team || team === "FA") return 0;
  if (candidate.position === "QB") {
    return roster.filter(
      (player) => player.team.trim().toUpperCase() === team && isPassCatcher(player)
    ).length;
  }
  if (isPassCatcher(candidate)) {
    return roster.filter(
      (player) => player.team.trim().toUpperCase() === team && player.position === "QB"
    ).length;
  }
  return 0;
}

function spikeWeekSignal(player: Player): { value: number; detail: string } {
  const weekly = player.weeklyProjections
    ?.map((projection) => projection.projectedPoints)
    .filter(isFiniteNumber);
  if (weekly && weekly.length >= 2) {
    const mean = weekly.reduce((sum, value) => sum + value, 0) / weekly.length;
    const variance = weekly.reduce((sum, value) => sum + (value - mean) ** 2, 0) / weekly.length;
    const deviation = Math.sqrt(variance);
    return {
      value: clamp(deviation / 8, 0, 1),
      detail: `Weekly projection spread supplies a ${deviation.toFixed(1)} point weekly variance input.`,
    };
  }

  const positionProxy: Partial<Record<Player["position"], number>> = {
    WR: 1,
    TE: 0.7,
    QB: 0.5,
    RB: 0.35,
  };
  return {
    value: positionProxy[player.position] ?? 0,
    detail: `No weekly projection spread is available, so the model uses a visible ${player.position} position proxy.`,
  };
}

export function recommendBestBallPlayers({
  players,
  picks,
  userTeamNumber,
  currentPickNumber,
  contestId = DEFAULT_BEST_BALL_CONTEST_ID,
  week17Opponents = {},
  limit = 12,
}: RecommendBestBallOptions): BestBallRecommendation[] {
  const preset = getContestPreset(contestId);
  const profile = getStrategyProfile(preset);
  const userPicks = picks.filter((pick) => pick.teamNumber === userTeamNumber);
  const roster = userPicks.map((pick) => pick.player);
  const draftedIds = new Set(picks.map((pick) => pick.player.id));
  const rankedPlayers = sortBestBallRankings(players, preset);
  const rankById = new Map(rankedPlayers.map((player) => [player.id, player]));
  const round = Math.floor((Math.max(1, currentPickNumber) - 1) / preset.teams) + 1;
  const targets = getAdaptiveRosterTargets(userPicks, contestId, round);
  const draftProgress = clamp((round - 1) / Math.max(1, preset.rounds - 1), 0, 1);
  const earlyAdpMultiplier = 1.35 - draftProgress * 0.85;
  const hasContestAdp = preset.format !== "superflex";

  const recommendations = rankedPlayers
    .filter((player) => !draftedIds.has(player.id))
    .map((player): BestBallRecommendation => {
      const ranking = rankById.get(player.id) ?? player;
      const position = player.position as BestBallPosition;
      const target = targets.targets[position];
      const baseRank = roundScore(Math.max(0, (220 - ranking.adjustedRank) / 10));

      const adpDelta = hasContestAdp && isFiniteNumber(player.adp)
        ? currentPickNumber - player.adp
        : null;
      const adpValue =
        adpDelta === null
          ? 0
          : roundScore(
              clamp(adpDelta / 8, -4, 4) * profile.adpValueWeight * earlyAdpMultiplier
            );

      const gap = Math.max(0, target.recommended - target.drafted);
      const rosterNeed = roundScore(
        gap > 0
          ? profile.rosterNeedWeight * (gap / Math.max(1, target.recommended))
          : -profile.rosterNeedWeight * 0.35 * (target.drafted - target.recommended + 1)
      );

      const stackMatches = formsQbPassCatcherStack(player, roster);
      const stackSchedule = roundScore(stackMatches * profile.correlationWeight);

      const byeMatches = isFiniteNumber(player.byeWeek)
        ? roster.filter((rosterPlayer) => rosterPlayer.byeWeek === player.byeWeek).length
        : 0;
      const samePositionByeMatches = isFiniteNumber(player.byeWeek)
        ? roster.filter(
            (rosterPlayer) =>
              rosterPlayer.byeWeek === player.byeWeek && rosterPlayer.position === player.position
          ).length
        : 0;
      const byeRisk = roundScore(
        -profile.byeCoverageWeight * (byeMatches + samePositionByeMatches * 0.5)
      );

      const sameTeamCount = roster.filter(
        (rosterPlayer) =>
          rosterPlayer.team.trim().toUpperCase() === player.team.trim().toUpperCase()
      ).length;
      const concentrationRisk = roundScore(
        -Math.max(0, sameTeamCount + 1 - 2) * profile.concentrationPenalty
      );

      const spikeSignal = spikeWeekSignal(player);
      const spikeWeek = roundScore(spikeSignal.value * profile.spikeWeekWeight);

      const candidateTeam = player.team.trim().toUpperCase();
      const candidateOpponent = (week17Opponents[candidateTeam] ?? "").trim().toUpperCase();
      const week17Opponent =
        profile.week17Treatment === "tiebreaker" && candidateOpponent
          ? roster.filter(
              (rosterPlayer) => rosterPlayer.team.trim().toUpperCase() === candidateOpponent
            ).length
          : 0;

      const components: BestBallRecommendationComponents = {
        baseRank,
        adpValue,
        rosterNeed,
        stackSchedule,
        byeRisk,
        concentrationRisk,
        spikeWeek,
      };
      const reasons: BestBallRecommendationReason[] = [
        {
          component: "baseRank",
          score: baseRank,
          detail:
            preset.format === "superflex"
              ? `The sourced Superflex consensus rank is ${ranking.adjustedRank}.`
              : isFiniteNumber(player.adp)
                ? `The current standard Underdog ADP is ${player.adp.toFixed(1)}. The PPR best ball ECR is ${ranking.bestBallEcr}.`
                : `No Underdog ADP match is available, so the PPR best ball ECR of ${ranking.bestBallEcr} sets the base rank.`,
        },
        {
          component: "adpValue",
          score: adpValue,
          detail:
            !hasContestAdp
              ? "This snapshot has no separate Superflex ADP source, so standard lineup ADP adds no score."
              : adpDelta === null
              ? "No separate ADP match is available, so ADP adds no score."
              : `ADP is ${player.adp?.toFixed(1)} at pick ${currentPickNumber}, with a larger ADP weight in earlier rounds.`,
        },
        {
          component: "rosterNeed",
          score: rosterNeed,
          detail: `The roster has ${target.drafted} ${position} and the adaptive target is ${target.recommended}.`,
        },
        {
          component: "stackSchedule",
          score: stackSchedule,
          detail:
            stackMatches > 0
              ? `This pick forms ${stackMatches} same team QB and pass catcher connection${stackMatches === 1 ? "" : "s"}.`
              : "This pick does not add a same team QB and pass catcher connection.",
        },
        {
          component: "byeRisk",
          score: byeRisk,
          detail:
            byeMatches > 0
              ? `${byeMatches} drafted player${byeMatches === 1 ? "" : "s"} already share${byeMatches === 1 ? "s" : ""} this bye week.`
              : "This pick does not add a known bye week conflict.",
        },
        {
          component: "concentrationRisk",
          score: concentrationRisk,
          detail:
            concentrationRisk < 0
              ? `This would be player ${sameTeamCount + 1} from ${candidateTeam}.`
              : "This pick stays below the same team concentration threshold.",
        },
        {
          component: "spikeWeek",
          score: spikeWeek,
          detail:
            profile.spikeWeekWeight > 0
              ? spikeSignal.detail
              : "This contest profile has no separate weekly variance adjustment.",
        },
      ];

      return {
        player,
        score: roundScore(Object.values(components).reduce((sum, value) => sum + value, 0)),
        components,
        reasons,
        tiebreakers: { week17Opponent },
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.tiebreakers.week17Opponent - left.tiebreakers.week17Opponent ||
        (rankById.get(left.player.id)?.bestBallRank ?? Number.POSITIVE_INFINITY) -
          (rankById.get(right.player.id)?.bestBallRank ?? Number.POSITIVE_INFINITY)
    );

  return recommendations.slice(0, Math.max(0, Math.floor(limit)));
}
