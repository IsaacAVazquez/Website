import type { Player } from "@/types";
import { isUndraftedFloorAdp } from "@/lib/draftAnalytics";
import {
  DEFAULT_BEST_BALL_CONTEST_ID,
  getContestPreset,
  getStrategyProfile,
  hasSupportedBestBallAdp,
} from "./contests";
import { sortBestBallRankings } from "./rankings";
import { getNextUserPick } from "./draft";
import { getAdaptiveRosterTargets } from "./strategy";
import { clamp } from "@/lib/utils";
import type {
  AdaptiveRosterTargets,
  BestBallContestPreset,
  BestBallPosition,
  BestBallRosterComposition,
  RankedBestBallPlayer,
  BestBallRecommendation,
  BestBallRecommendationComponents,
  BestBallRecommendationReason,
  RecommendBestBallOptions,
} from "./types";

function roundScore(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPassCatcher(player: Player): boolean {
  return player.position === "WR" || player.position === "TE";
}

function teamOf(player: Player): string {
  return player.team.trim().toUpperCase();
}

function hasUsableAdp(player: Player, rounds: number, teams: number): boolean {
  return (
    isFiniteNumber(player.adp) &&
    player.adp > 0 &&
    !isUndraftedFloorAdp(player.adp, rounds, teams)
  );
}

/**
 * Counts completed Week 17 game stacks, meaning one side of a Week 17 game supplies a QB
 * and at least one of his pass catchers while the other side supplies any skill player.
 * Both directions of a game can count, which is how a double stack scores twice.
 */
function countWeek17GameStacks(
  players: readonly Player[],
  week17Opponents: Readonly<Record<string, string>>
): number {
  const byTeam = new Map<string, Player[]>();
  for (const player of players) {
    const team = teamOf(player);
    if (!team || team === "FA") continue;
    byTeam.set(team, [...(byTeam.get(team) ?? []), player]);
  }

  let stacks = 0;
  for (const [team, teamPlayers] of byTeam) {
    const opponent = (week17Opponents[team] ?? "").trim().toUpperCase();
    const opponentPlayers = opponent ? byTeam.get(opponent) : undefined;
    if (!opponentPlayers || opponentPlayers.length === 0) continue;
    const hasQb = teamPlayers.some((player) => player.position === "QB");
    const hasPassCatcher = teamPlayers.some(isPassCatcher);
    if (hasQb && hasPassCatcher) stacks += 1;
  }
  return stacks;
}

/**
 * Scores how close a position is to a tier cliff. Urgency comes from how few players are left
 * in the candidate's own tier, and magnitude comes from the board gap between the last player
 * in that tier and the first player of the next one, so a thin tier that sits right next to the
 * following tier does not read as scarce. Returns 0 when the snapshot has no tier for a player.
 */
function tierCliffSignal(
  candidate: RankedBestBallPlayer,
  available: readonly RankedBestBallPlayer[],
  useSuperflexTier: boolean
): { value: number; remainingInTier: number; gap: number } {
  const empty = { value: 0, remainingInTier: 0, gap: 0 };
  const tierOf = (player: RankedBestBallPlayer): number | undefined =>
    useSuperflexTier ? player.superflexTier : player.tier;
  const rankOf = (player: RankedBestBallPlayer): number | undefined =>
    useSuperflexTier ? player.superflexRank : player.bestBallEcr;
  const tier = tierOf(candidate);
  if (!isFiniteNumber(tier) || tier <= 0) return empty;

  const sameTier = available.filter((player) => tierOf(player) === tier);
  if (sameTier.length === 0) return empty;

  const laterTierNumbers = available
    .map(tierOf)
    .filter((candidateTier): candidateTier is number =>
      isFiniteNumber(candidateTier) && candidateTier > tier
    );
  const nextTierNumber = laterTierNumbers.length > 0
    ? Math.min(...laterTierNumbers)
    : null;
  // No next tier means this is the bottom tier on the board, which is an artifact of where the
  // rankings stop rather than real scarcity, so it earns nothing.
  if (nextTierNumber === null) return empty;

  const sameTierRanks = sameTier.map(rankOf).filter(isFiniteNumber);
  const nextTierRanks = available
    .filter((player) => tierOf(player) === nextTierNumber)
    .map(rankOf)
    .filter(isFiniteNumber);
  if (sameTierRanks.length === 0 || nextTierRanks.length === 0) return empty;
  const gap = Math.max(0, Math.min(...nextTierRanks) - Math.max(...sameTierRanks));

  // A tier with one player left is fully urgent; four or more left is not scarce at all.
  const urgency = clamp((4 - sameTier.length) / 3, 0, 1);
  const magnitude = clamp(gap / 12, 0, 1);

  return { value: urgency * magnitude, remainingInTier: sameTier.length, gap };
}

/**
 * How many board spots a position gives up by waiting a full turn. It finds the best player
 * at the position whose market price says he is still there at the user's next pick, and
 * returns the board gap between him and the best one available right now.
 *
 * This is the scarcity a tier cliff cannot see. A position can sit in a perfectly deep tier
 * and still be the one to take now, because the whole tier will be gone by the time the turn
 * comes back around, and the tier cliff term reads that as no cliff at all.
 *
 * Three outcomes, because two of them would otherwise both read as a zero cost and mean
 * opposite things. A `measured` cost is the board gap. `exhausted` means the position has
 * a readable market and every player in it is priced to be gone before the turn returns,
 * which is the most scarce a position can be. `unmeasurable` means the board cannot answer
 * at all, because there is no next pick, no readable rank, or no readable ADP anywhere in
 * the pool, and that has to stay distinct from a position the market says will keep.
 */
type PositionWaitCost =
  | { kind: "measured"; cost: number }
  | { kind: "exhausted" }
  | { kind: "unmeasurable" };

function positionWaitCost(
  available: readonly RankedBestBallPlayer[],
  followingUserPick: number | null,
  rankOf: (player: RankedBestBallPlayer) => number | undefined,
  hasReadableAdp: (player: RankedBestBallPlayer) => boolean
): PositionWaitCost {
  if (followingUserPick === null) return { kind: "unmeasurable" };
  const ranked = available
    .map((player) => ({ rank: rankOf(player), player }))
    .filter((entry): entry is { rank: number; player: RankedBestBallPlayer } =>
      isFiniteNumber(entry.rank)
    )
    .sort((left, right) => left.rank - right.rank);
  if (ranked.length === 0) return { kind: "unmeasurable" };

  const priced = ranked.filter((entry) => hasReadableAdp(entry.player));
  if (priced.length === 0) return { kind: "unmeasurable" };

  const survivor = priced.find((entry) => Number(entry.player.adp) >= followingUserPick);
  if (!survivor) return { kind: "exhausted" };
  return { kind: "measured", cost: Math.max(0, survivor.rank - ranked[0].rank) };
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

  return {
    value: 0,
    detail: "No weekly projection spread is available, so weekly variation adds no score.",
  };
}

function isRosterFeasibleAfterPick(
  position: BestBallPosition,
  targets: AdaptiveRosterTargets
): boolean {
  if (targets.draftedCount >= targets.rosterSize) return false;

  const countsAfterPick = { ...targets.counts };
  countsAfterPick[position] += 1;

  if (targets.validCompositions.length > 0) {
    return targets.validCompositions.some((composition) =>
      (Object.keys(countsAfterPick) as BestBallPosition[]).every(
        (candidatePosition) => countsAfterPick[candidatePosition] <= composition[candidatePosition]
      )
    );
  }

  const remainingSpots = targets.rosterSize - targets.draftedCount - 1;
  const minimumStillNeeded = (Object.keys(countsAfterPick) as BestBallPosition[]).reduce(
    (sum, candidatePosition) =>
      sum +
      Math.max(0, targets.targets[candidatePosition].minimum - countsAfterPick[candidatePosition]),
    0
  );
  const maximumRemainingCapacity = (Object.keys(countsAfterPick) as BestBallPosition[]).reduce(
    (sum, candidatePosition) =>
      sum +
      Math.max(0, targets.targets[candidatePosition].maximum - countsAfterPick[candidatePosition]),
    0
  );

  return minimumStillNeeded <= remainingSpots && maximumRemainingCapacity >= remainingSpots;
}

function minimumWorstByeLineupGap(
  players: readonly Player[],
  lineup: BestBallContestPreset["lineup"],
  compositions: readonly BestBallRosterComposition[]
): number | null {
  if (compositions.length === 0) return null;
  const byeWeeks = [
    ...new Set(
      players
        .map((player) => player.byeWeek)
        .filter((byeWeek): byeWeek is number =>
          Number.isInteger(byeWeek) && Number(byeWeek) > 0
        )
    ),
  ];
  if (byeWeeks.length === 0) return 0;

  const byeCountsByWeek = new Map<number, BestBallRosterComposition>();
  for (const player of players) {
    if (!Number.isInteger(player.byeWeek) || Number(player.byeWeek) < 1) continue;
    if (!["QB", "RB", "WR", "TE"].includes(player.position)) continue;
    const week = Number(player.byeWeek);
    const counts = byeCountsByWeek.get(week) ?? { QB: 0, RB: 0, WR: 0, TE: 0 };
    counts[player.position as BestBallPosition] += 1;
    byeCountsByWeek.set(week, counts);
  }

  return Math.min(
    ...compositions.map((composition) => {
      let worstGap = 0;
      for (const byeWeek of byeWeeks) {
        const byeCounts = byeCountsByWeek.get(byeWeek) ?? { QB: 0, RB: 0, WR: 0, TE: 0 };
        const active = {
          QB: Math.max(0, composition.QB - byeCounts.QB),
          RB: Math.max(0, composition.RB - byeCounts.RB),
          WR: Math.max(0, composition.WR - byeCounts.WR),
          TE: Math.max(0, composition.TE - byeCounts.TE),
        };
        const baseGap = (Object.keys(active) as BestBallPosition[]).reduce(
          (sum, candidatePosition) =>
            sum + Math.max(0, lineup[candidatePosition] - active[candidatePosition]),
          0
        );
        const skillSurplus = (["RB", "WR", "TE"] as const).reduce(
          (sum, candidatePosition) =>
            sum + Math.max(0, active[candidatePosition] - lineup[candidatePosition]),
          0
        );
        const flexFilled = Math.min(lineup.FLEX, skillSurplus);
        const skillAfterFlex = Math.max(0, skillSurplus - flexFilled);
        const quarterbackSurplus = Math.max(0, active.QB - lineup.QB);
        const superflexGap = Math.max(
          0,
          (lineup.SUPERFLEX ?? 0) - skillAfterFlex - quarterbackSurplus
        );
        worstGap = Math.max(
          worstGap,
          baseGap + (lineup.FLEX - flexFilled) + superflexGap
        );
      }
      return worstGap;
    })
  );
}

/**
 * How far the market price may pull a player off his expert consensus rank.
 *
 * The base rank term is `currentPick - ECR` and this term is `weight * (ECR - ADP)`.
 * At a weight of 1 the two sum to `currentPick - ADP`, the consensus rank cancels
 * out of the arithmetic entirely, and the score becomes a pure market reading, which
 * is what this engine did until 2026-08-23. A player 40 consensus spots worse then
 * outscored a better one on a single slot of ADP. At 0 the market is ignored and a
 * player who has fallen ten rounds past his price looks no better than one going on time.
 *
 * At 0.5 the score resolves to `currentPick - (ECR + ADP) / 2`, so a sourced expert
 * board and a sourced market count the same amount. That split is tuned judgment and
 * not a fitted parameter, and it is the one number to turn if the board leans too far
 * toward either side.
 */
const ADP_VALUE_WEIGHT = 0.5;

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
  const hasContestAdp = hasSupportedBestBallAdp(preset);
  const rankedPlayers = sortBestBallRankings(players, preset)
    .map((player) =>
      hasContestAdp && !hasUsableAdp(player, preset.rounds, preset.teams)
        ? {
            ...player,
            adjustedRank: player.bestBallEcr,
            rankAdjustment: 0,
            rankReason: `No usable Underdog ADP is available, so the board uses the PPR best ball ECR of ${player.bestBallEcr}.`,
          }
        : player
    )
    .sort(
      (left, right) =>
        left.adjustedRank - right.adjustedRank ||
        left.bestBallEcr - right.bestBallEcr ||
        left.bestBallRank - right.bestBallRank
    )
    .map((player, index) => ({ ...player, bestBallRank: index + 1 }));
  const rankById = new Map(rankedPlayers.map((player) => [player.id, player]));
  const round = Math.floor((Math.max(1, currentPickNumber) - 1) / preset.teams) + 1;
  const targets = getAdaptiveRosterTargets(userPicks, contestId, round);
  const nextUserPick = getNextUserPick(
    currentPickNumber,
    userTeamNumber,
    preset.teams,
    preset.rounds
  );
  const followingUserPick = nextUserPick === currentPickNumber
    ? getNextUserPick(currentPickNumber + 1, userTeamNumber, preset.teams, preset.rounds)
    : nextUserPick;

  // rankedPlayers is already board-sorted, so each position list stays in board order.
  const availableByPosition = new Map<BestBallPosition, RankedBestBallPlayer[]>();
  for (const ranked of rankedPlayers) {
    if (draftedIds.has(ranked.id)) continue;
    const position = ranked.position as BestBallPosition;
    availableByPosition.set(position, [...(availableByPosition.get(position) ?? []), ranked]);
  }

  const useSuperflexBoard = preset.lineupVariant === "superflex";
  const boardRankOf = (player: RankedBestBallPlayer): number | undefined =>
    useSuperflexBoard ? player.superflexRank : player.bestBallEcr;

  // The cost of waiting a turn belongs to the board rather than to any one candidate, so it
  // is measured once per position. Each position is then read against the most expensive of
  // the positions the roster still needs, because the question a draft board has to answer
  // is which position to take now, not what a gap is worth in the abstract. Positions the
  // roster is already done with are left out of that comparison so a scarce QB the build has
  // no room for cannot make every position the roster does need look cheap.
  const waitCostByPosition = new Map<BestBallPosition, PositionWaitCost>();
  for (const [position, pool] of availableByPosition) {
    waitCostByPosition.set(
      position,
      positionWaitCost(
        pool,
        followingUserPick,
        boardRankOf,
        // Survival is a market question, so a preset whose slate the snapshot's ADP does not
        // price gets no wait cost at all and leans on the tier cliff instead.
        (player) => hasContestAdp && hasUsableAdp(player, preset.rounds, preset.teams)
      )
    );
  }
  const highestWaitCost = Math.max(
    0,
    ...[...waitCostByPosition.entries()]
      .filter(
        ([position]) =>
          targets.targets[position].recommended > targets.targets[position].drafted
      )
      .map(([, entry]) => (entry.kind === "measured" ? entry.cost : 0))
  );

  const recommendations = rankedPlayers
    .filter((player) => !draftedIds.has(player.id))
    .filter(
      (player) =>
        !hasContestAdp || hasUsableAdp(player, preset.rounds, preset.teams)
    )
    .filter(
      (player) => preset.lineupVariant !== "superflex" || isFiniteNumber(player.superflexRank)
    )
    .filter((player) =>
      isRosterFeasibleAfterPick(player.position as BestBallPosition, targets)
    )
    .map((player): BestBallRecommendation => {
      const ranking = rankById.get(player.id) ?? player;
      const position = player.position as BestBallPosition;
      const target = targets.targets[position];
      const hasUsableContestAdp =
        hasContestAdp &&
        hasUsableAdp(player, preset.rounds, preset.teams);
      const sourceRank = preset.lineupVariant === "superflex"
        ? ranking.adjustedRank
        : ranking.bestBallEcr;
      const baseRank = roundScore(currentPickNumber - sourceRank);
      const adpValue = hasUsableContestAdp
        ? roundScore(ADP_VALUE_WEIGHT * (sourceRank - Number(player.adp)))
        : 0;
      const adpDelta = hasUsableContestAdp
        ? currentPickNumber - Number(player.adp)
        : null;

      const gap = Math.max(0, target.recommended - target.drafted);
      const rosterNeed = roundScore(
        gap > 0
          ? clamp(
              (profile.rosterNeedWeight / 4) * (gap / Math.max(1, target.recommended)),
              0,
              2
            )
          : clamp(-0.5 * (target.drafted - target.recommended + 1), -2, 0)
      );

      const stackMatches = formsQbPassCatcherStack(player, roster);
      const stackSchedule = roundScore(
        clamp(stackMatches * (profile.correlationWeight / 2), 0, 2)
      );

      const samePositionByeMatches = isFiniteNumber(player.byeWeek)
        ? roster.filter(
            (rosterPlayer) =>
              rosterPlayer.byeWeek === player.byeWeek && rosterPlayer.position === player.position
          ).length
        : 0;
      const countsAfterPick = { ...targets.counts };
      countsAfterPick[position] += 1;
      const feasibleCompositionsAfterPick = targets.validCompositions.filter((composition) =>
        (Object.keys(countsAfterPick) as BestBallPosition[]).every(
          (candidatePosition) =>
            countsAfterPick[candidatePosition] <= composition[candidatePosition]
        )
      );
      const byeGapBefore = minimumWorstByeLineupGap(
        roster,
        preset.lineup,
        targets.validCompositions
      );
      const byeGapAfter = minimumWorstByeLineupGap(
        [...roster, player],
        preset.lineup,
        feasibleCompositionsAfterPick
      );
      const byeCoverageFailure =
        byeGapBefore !== null && byeGapAfter !== null
          ? Math.max(0, byeGapAfter - byeGapBefore)
          : 0;
      const byeRisk = roundScore(
        -clamp(byeCoverageFailure * (profile.byeCoverageWeight / 3), 0, 2)
      );

      const sameTeamCount = roster.filter(
        (rosterPlayer) => teamOf(rosterPlayer) === teamOf(player)
      ).length;
      const concentrationRisk = roundScore(
        -clamp(
          Math.max(0, sameTeamCount + 1 - profile.concentrationFloor) *
            profile.concentrationPenalty,
          0,
          2
        )
      );

      const spikeSignal = spikeWeekSignal(player);
      const spikeWeek = roundScore(
        clamp(spikeSignal.value * (profile.spikeWeekWeight / 5), 0, 1)
      );

      const candidateTeam = teamOf(player);
      const candidateOpponent = (week17Opponents[candidateTeam] ?? "").trim().toUpperCase();
      const week17Opponent =
        profile.week17Treatment !== "none" && candidateOpponent
          ? roster.filter((rosterPlayer) => teamOf(rosterPlayer) === candidateOpponent).length
          : 0;

      const gameStackDelta =
        profile.week17Treatment === "scored"
          ? countWeek17GameStacks([...roster, player], week17Opponents) -
            countWeek17GameStacks(roster, week17Opponents)
          : 0;
      const gameStack = roundScore(clamp(gameStackDelta, 0, 1));

      // Scarcity only applies to a position the roster still needs, so a thin tier never
      // argues for a fourth QB the build has no room to start.
      const needsPosition = target.recommended > target.drafted;
      const cliff = tierCliffSignal(
        ranking,
        availableByPosition.get(position) ?? [],
        useSuperflexBoard
      );
      const waitEntry = waitCostByPosition.get(position) ?? { kind: "unmeasurable" as const };
      const waitCost = waitEntry.kind === "measured" ? waitEntry.cost : null;
      // Two factors, both needed. The relative one reads this position against the scarcest
      // position the roster still needs, which is the choice a drafter actually faces. The
      // absolute one holds the term down when the whole board is deep, because on its own the
      // relative factor hands the full bonus to whichever position leads, even when it leads
      // by a single board spot. A cost of one full round of picks counts as fully scarce.
      // A position with no survivor at all is as scarce as the term can express.
      const relativeWait =
        waitCost !== null && highestWaitCost > 0 ? clamp(waitCost / highestWaitCost, 0, 1) : 0;
      const absoluteWait = waitCost !== null ? clamp(waitCost / preset.teams, 0, 1) : 0;
      const waitSignal =
        waitEntry.kind === "exhausted" ? 1 : relativeWait * absoluteWait;
      const scarcitySignal = Math.max(cliff.value, waitSignal);
      const tierScarcity = roundScore(
        needsPosition
          ? clamp(scarcitySignal * (profile.scarcityWeight / 2), 0, 2)
          : 0
      );
      const waitUntilNextTurn =
        hasUsableContestAdp &&
        followingUserPick !== null &&
        Number(player.adp) >= followingUserPick + 4;

      const components: BestBallRecommendationComponents = {
        baseRank,
        adpValue,
        rosterNeed,
        stackSchedule,
        gameStack,
        tierScarcity,
        byeRisk,
        concentrationRisk,
        spikeWeek,
      };
      const reasons: BestBallRecommendationReason[] = [
        {
          component: "baseRank",
          score: baseRank,
          detail:
            preset.lineupVariant === "superflex"
              ? `The sourced Superflex consensus rank is ${ranking.adjustedRank}.`
              : hasUsableContestAdp
                ? `The current standard Underdog ADP is ${Number(player.adp).toFixed(1)}. The PPR best ball ECR is ${ranking.bestBallEcr}.`
                : `No matching contest ADP is available, so the PPR best ball ECR of ${ranking.bestBallEcr} sets the base rank.`,
        },
        {
          component: "adpValue",
          score: adpValue,
          detail:
            !hasContestAdp
              ? preset.lineupVariant === "superflex"
                ? "This snapshot has no separate Superflex ADP source, so standard lineup ADP adds no score."
                : "This snapshot has no matching ADP source for this contest slate, so market value adds no score."
              : adpDelta === null
              ? "No separate ADP match is available, so ADP adds no score."
              : `ADP is ${player.adp?.toFixed(1)} and the PPR best ball ECR is ${ranking.bestBallEcr}. The market moves the score by ${ADP_VALUE_WEIGHT} points per pick of disagreement, so consensus and market carry equal weight.`,
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
          component: "gameStack",
          score: gameStack,
          detail:
            profile.week17Treatment !== "scored"
              ? "This contest profile does not score Week 17 game stacks."
              : gameStackDelta > 0
                ? `This pick completes a Week 17 game stack against ${candidateOpponent}, the finals week that carries the largest share of tournament value.`
                : candidateOpponent
                  ? `This pick does not complete a Week 17 game stack. The Week 17 opponent is ${candidateOpponent}.`
                  : "No Week 17 opponent is known for this team, so no game stack score applies.",
        },
        {
          component: "tierScarcity",
          score: tierScarcity,
          detail: !needsPosition
            ? `The roster already has its target ${position} count, so no scarcity adjustment applies.`
            : waitEntry.kind === "exhausted" && waitSignal >= cliff.value
              ? `Every ${position} left on the board is priced to be gone before your next pick at ${followingUserPick}, which is as scarce as this reading goes.`
              : waitCost !== null && waitCost > 0 && waitSignal >= cliff.value
                ? `Waiting a turn on ${position} costs ${waitCost.toFixed(0)} board spots, because the best one the market says lasts until pick ${followingUserPick} sits that far below the best one available now. The most expensive position this roster still needs costs ${highestWaitCost.toFixed(0)}.`
                : cliff.value > 0
                  ? `${cliff.remainingInTier} player${cliff.remainingInTier === 1 ? " remains" : "s remain"} in this ${position} tier, and the next tier starts ${cliff.gap.toFixed(0)} board spots later.`
                  : waitEntry.kind === "unmeasurable"
                    ? `No readable ADP covers the ${position} board here, so the cost of waiting a turn cannot be measured and only the tier cliff applies.`
                    : `The market says a comparable ${position} lasts until your next pick at ${followingUserPick}, so no scarcity adjustment applies.`,
        },
        {
          component: "byeRisk",
          score: byeRisk,
          detail:
            byeCoverageFailure > 0
              ? `This pick creates ${byeCoverageFailure} additional uncovered starting slot${byeCoverageFailure === 1 ? "" : "s"} in the best single final composition across every published bye.`
              : samePositionByeMatches > 0
                ? `This adds another ${position} on the same bye, but at least one feasible final composition still covers the weekly lineup.`
                : "This pick does not create a lineup coverage failure in a feasible final roster.",
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
        tiebreakers: { week17Opponent, waitUntilNextTurn },
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        Number(left.tiebreakers.waitUntilNextTurn) -
          Number(right.tiebreakers.waitUntilNextTurn) ||
        right.tiebreakers.week17Opponent - left.tiebreakers.week17Opponent ||
        (rankById.get(left.player.id)?.bestBallRank ?? Number.POSITIVE_INFINITY) -
          (rankById.get(right.player.id)?.bestBallRank ?? Number.POSITIVE_INFINITY)
    );

  return recommendations.slice(0, Math.max(0, Math.floor(limit)));
}
