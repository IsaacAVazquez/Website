import { getRosterNeeds } from "@/lib/draftAnalytics";
import {
  buildFantasyReplacementCutoffs,
  calculateFantasyReplacementSourceValue,
  calculateReplacementRelativeValue,
  getFantasyReplacementExpertRank,
  hasReliableFantasyReplacementMarket,
  type FantasyReplacementCutoff,
} from "@/lib/fantasyReplacement";
import { getAdpSurvivalThreshold } from "@/lib/fantasyUtils";
import { clamp } from "@/lib/utils";
import type {
  Player,
  RedraftLineupSettings,
  TeamRoster,
} from "@/types";

export const REDRAFT_DRAFT_DECISION_MODEL_VERSION = "redraft-decision-v2";

export const REDRAFT_DECISION_POSITIONS = ["QB", "RB", "WR", "TE"] as const;
export type RedraftDecisionPosition = (typeof REDRAFT_DECISION_POSITIONS)[number];
export type RedraftDecisionNeed = "starter" | "depth" | "filled";
export type RedraftDecisionCoverage = "supported" | "limited" | "unavailable";
export type RedraftDecisionOrder = "snake" | "linear";

export interface RedraftDecisionPick {
  teamNumber: number;
  player: Player;
}

export interface RedraftDecisionRoom {
  teams: number;
  rounds: number;
  userTeam: number;
  draftOrder: RedraftDecisionOrder;
  lineup: RedraftLineupSettings;
}

export interface RedraftDraftDecisionInput {
  players: readonly Player[];
  positionBoards: Partial<
    Record<RedraftDecisionPosition, readonly Player[]>
  >;
  picks: readonly RedraftDecisionPick[];
  room: RedraftDecisionRoom;
  currentPick: number;
  rankingUsable: boolean;
  marketCurrent: boolean;
  /**
   * Projected season points above replacement per player id, when the source
   * covers this league size. Lets the wait reading price a survivor drop in
   * points instead of only ordinal rank; omit it and every reading stays ordinal.
   */
  vorpValues?: ReadonlyMap<string, { value: number }>;
}

export interface RedraftReplacementReading {
  player: Player;
  expertRank: number;
  value: number;
  starterValue: number | null;
  depthValue: number | null;
  starterCutoff: number | null;
  rosterCutoff: number | null;
  coverage: RedraftDecisionCoverage;
}

export interface RedraftTierReading {
  tier: number | null;
  positionRank: number | null;
  remaining: number;
  nextTier: number | null;
  nextTierPositionRank: number | null;
  overallBoardGap: number | null;
  signal: number | null;
  coverage: RedraftDecisionCoverage;
}

export interface RedraftWaitSurvivor {
  player: Player;
  expertRank: number;
  rankCost: number;
  replacementDrop: number;
  /** Projected season points below the best option now; null without VORP coverage for both players. */
  pointsDrop: number | null;
}

export type RedraftWaitReading =
  | {
      kind: "measured";
      nextPick: number;
      survivor: RedraftWaitSurvivor;
      plausibleSurvivor: RedraftWaitSurvivor | null;
      saferSurvivor: RedraftWaitSurvivor | null;
      coverage: "supported" | "limited";
    }
  | {
      kind: "no-priced-survivor";
      nextPick: number;
      plausibleSurvivor: RedraftWaitSurvivor | null;
      coverage: "supported" | "limited";
    }
  | {
      kind: "unmeasurable";
      nextPick: number | null;
      reason:
        | "off-clock"
        | "market-unavailable"
        | "no-next-pick"
        | "no-ranked-player"
        | "no-reliable-market";
      coverage: "unavailable";
    };

export interface RedraftPositionDecision {
  position: RedraftDecisionPosition;
  need: RedraftDecisionNeed;
  bestAvailable: RedraftReplacementReading | null;
  tier: RedraftTierReading;
  wait: RedraftWaitReading;
  scarcityScore: number | null;
}

export interface RedraftDraftDecisionReport {
  modelVersion: typeof REDRAFT_DRAFT_DECISION_MODEL_VERSION;
  guidanceAvailable: boolean;
  userOnClock: boolean;
  nextUserPick: number | null;
  followingUserPick: number | null;
  playerValues: readonly RedraftReplacementReading[];
  positions: readonly RedraftPositionDecision[];
  mostAtRisk: RedraftPositionDecision | null;
}

function finitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function positionBoardRank(player: Player): number | null {
  if (finitePositive(player.rankEcr)) return player.rankEcr;
  return finitePositive(player.averageRank) ? player.averageRank : null;
}

export function getRedraftTeamAtPick(
  pickNumber: number,
  teams: number,
  draftOrder: RedraftDecisionOrder
): number | null {
  if (
    !Number.isInteger(pickNumber) ||
    pickNumber < 1 ||
    !Number.isInteger(teams) ||
    teams < 2
  ) {
    return null;
  }
  const round = Math.floor((pickNumber - 1) / teams) + 1;
  const slot = ((pickNumber - 1) % teams) + 1;
  if (draftOrder === "linear") return slot;
  return round % 2 === 1 ? slot : teams - slot + 1;
}

export function getRedraftNextPickForTeam({
  fromPick,
  team,
  teams,
  rounds,
  draftOrder,
  strictlyAfter = false,
}: {
  fromPick: number;
  team: number;
  teams: number;
  rounds: number;
  draftOrder: RedraftDecisionOrder;
  strictlyAfter?: boolean;
}): number | null {
  if (
    !Number.isInteger(team) ||
    team < 1 ||
    team > teams ||
    !Number.isInteger(rounds) ||
    rounds < 1
  ) {
    return null;
  }
  const firstPick = Math.max(1, Math.ceil(fromPick) + (strictlyAfter ? 1 : 0));
  const finalPick = teams * rounds;
  for (let pick = firstPick; pick <= finalPick; pick += 1) {
    if (getRedraftTeamAtPick(pick, teams, draftOrder) === team) return pick;
  }
  return null;
}

function emptyTierReading(): RedraftTierReading {
  return {
    tier: null,
    positionRank: null,
    remaining: 0,
    nextTier: null,
    nextTierPositionRank: null,
    overallBoardGap: null,
    signal: null,
    coverage: "unavailable",
  };
}

function replacementReading(
  player: Player,
  cutoff: FantasyReplacementCutoff
): RedraftReplacementReading | null {
  const expertRank = getFantasyReplacementExpertRank(player);
  if (expertRank === null) return null;
  const sourceValue = calculateFantasyReplacementSourceValue(expertRank, cutoff);
  if (sourceValue === null) return null;

  return {
    player,
    expertRank,
    value: roundOne(sourceValue.value),
    starterValue: finitePositive(cutoff.starter)
      ? roundOne(calculateReplacementRelativeValue(expertRank, cutoff.starter))
      : null,
    depthValue: finitePositive(cutoff.roster)
      ? roundOne(calculateReplacementRelativeValue(expertRank, cutoff.roster))
      : null,
    starterCutoff: cutoff.starter,
    rosterCutoff: cutoff.roster,
    coverage: sourceValue.coverage === 1 ? "supported" : "limited",
  };
}

function countUserPositions(
  picks: readonly RedraftDecisionPick[],
  userTeam: number
): TeamRoster["positionCounts"] {
  const counts: TeamRoster["positionCounts"] = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
  };
  for (const pick of picks) {
    if (pick.teamNumber !== userTeam) continue;
    if (pick.player.position in counts) {
      counts[pick.player.position as keyof typeof counts] += 1;
    }
  }
  return counts;
}

function needByPosition(
  picks: readonly RedraftDecisionPick[],
  room: RedraftDecisionRoom
): Record<RedraftDecisionPosition, RedraftDecisionNeed> {
  const counts = countUserPositions(picks, room.userTeam);
  const needs = getRosterNeeds({
    positionCounts: counts,
    lineup: room.lineup,
    rounds: room.rounds,
  });
  return Object.fromEntries(
    REDRAFT_DECISION_POSITIONS.map((position) => {
      const matching = needs.filter((need) =>
        need.eligiblePositions.includes(position)
      );
      const level = matching.some((need) => need.level === "starter")
        ? "starter"
        : matching.some((need) => need.level === "depth")
          ? "depth"
          : "filled";
      return [position, level];
    })
  ) as Record<RedraftDecisionPosition, RedraftDecisionNeed>;
}

function tierReading({
  best,
  positionBoard,
  draftedIds,
  overallRankById,
  teams,
}: {
  best: Player | null;
  positionBoard: readonly Player[];
  draftedIds: ReadonlySet<string>;
  overallRankById: ReadonlyMap<string, number>;
  teams: number;
}): RedraftTierReading {
  if (!best) return emptyTierReading();
  const bestOnPositionBoard = positionBoard.find((player) => player.id === best.id);
  if (
    !bestOnPositionBoard ||
    !finitePositive(bestOnPositionBoard.tier)
  ) {
    return emptyTierReading();
  }

  const available = positionBoard.filter((player) => !draftedIds.has(player.id));
  const tier = bestOnPositionBoard.tier;
  const sameTier = available.filter((player) => player.tier === tier);
  const laterTiers = available
    .map((player) => player.tier)
    .filter((value): value is number => finitePositive(value) && value > tier);
  const nextTier = laterTiers.length > 0 ? Math.min(...laterTiers) : null;
  const nextTierPlayers = nextTier === null
    ? []
    : available.filter((player) => player.tier === nextTier);
  const currentOverallRanks = sameTier
    .map((player) => overallRankById.get(player.id))
    .filter((rank): rank is number => finitePositive(rank));
  const nextOverallRanks = nextTierPlayers
    .map((player) => overallRankById.get(player.id))
    .filter((rank): rank is number => finitePositive(rank));
  const overallBoardGap =
    currentOverallRanks.length > 0 && nextOverallRanks.length > 0
      ? Math.max(
          0,
          Math.min(...nextOverallRanks) - Math.max(...currentOverallRanks)
        )
      : null;
  const nextTierPositionRanks = nextTierPlayers
    .map(positionBoardRank)
    .filter((rank): rank is number => rank !== null);
  const positionRank = positionBoardRank(bestOnPositionBoard);
  const urgency = clamp((4 - sameTier.length) / 3, 0, 1);
  // One round of picks is the yardstick for a cliff, so the same gap reads
  // steeper in an 8-team room than a 16-team room.
  const magnitude = overallBoardGap === null
    ? null
    : clamp(overallBoardGap / teams, 0, 1);

  return {
    tier,
    positionRank,
    remaining: sameTier.length,
    nextTier,
    nextTierPositionRank:
      nextTierPositionRanks.length > 0
        ? Math.min(...nextTierPositionRanks)
        : null,
    overallBoardGap,
    signal: magnitude === null ? null : roundOne(urgency * magnitude),
    coverage:
      nextTier !== null && overallBoardGap !== null
        ? "supported"
        : nextTier !== null
          ? "limited"
          : "unavailable",
  };
}

function survivorReading(
  player: Player,
  best: RedraftReplacementReading,
  valueById: ReadonlyMap<string, RedraftReplacementReading>,
  vorpValues: ReadonlyMap<string, { value: number }> | undefined
): RedraftWaitSurvivor | null {
  const reading = valueById.get(player.id);
  if (!reading) return null;
  const bestVorp = vorpValues?.get(best.player.id)?.value;
  const survivorVorp = vorpValues?.get(player.id)?.value;
  return {
    player,
    expertRank: reading.expertRank,
    rankCost: roundOne(Math.max(0, reading.expertRank - best.expertRank)),
    replacementDrop: roundOne(Math.max(0, best.value - reading.value)),
    pointsDrop:
      typeof bestVorp === "number" &&
      Number.isFinite(bestVorp) &&
      typeof survivorVorp === "number" &&
      Number.isFinite(survivorVorp)
        ? roundOne(Math.max(0, bestVorp - survivorVorp))
        : null,
  };
}

function waitReading({
  available,
  best,
  valueById,
  userOnClock,
  followingUserPick,
  marketCurrent,
  vorpValues,
}: {
  available: readonly Player[];
  best: RedraftReplacementReading | null;
  valueById: ReadonlyMap<string, RedraftReplacementReading>;
  userOnClock: boolean;
  followingUserPick: number | null;
  marketCurrent: boolean;
  vorpValues: ReadonlyMap<string, { value: number }> | undefined;
}): RedraftWaitReading {
  if (!userOnClock) {
    return {
      kind: "unmeasurable",
      nextPick: null,
      reason: "off-clock",
      coverage: "unavailable",
    };
  }
  if (!marketCurrent) {
    return {
      kind: "unmeasurable",
      nextPick: followingUserPick,
      reason: "market-unavailable",
      coverage: "unavailable",
    };
  }
  if (followingUserPick === null) {
    return {
      kind: "unmeasurable",
      nextPick: null,
      reason: "no-next-pick",
      coverage: "unavailable",
    };
  }
  if (!best) {
    return {
      kind: "unmeasurable",
      nextPick: followingUserPick,
      reason: "no-ranked-player",
      coverage: "unavailable",
    };
  }

  const ranked = available
    .map((player) => ({ player, rank: getFantasyReplacementExpertRank(player) }))
    .filter(
      (entry): entry is { player: Player; rank: number } => entry.rank !== null
    )
    .sort((left, right) => left.rank - right.rank);
  const priced = ranked.filter((entry) =>
    hasReliableFantasyReplacementMarket(entry.player)
  );
  if (priced.length === 0) {
    return {
      kind: "unmeasurable",
      nextPick: followingUserPick,
      reason: "no-reliable-market",
      coverage: "unavailable",
    };
  }

  const midpointEntry = priced.find(
    (entry) => Number(entry.player.adp) >= followingUserPick
  );
  const plausibleEntry = priced.find(
    (entry) =>
      Number(entry.player.adp) + getAdpSurvivalThreshold(entry.player) >=
      followingUserPick
  );
  const saferEntry = priced.find(
    (entry) =>
      Number(entry.player.adp) - getAdpSurvivalThreshold(entry.player) >=
      followingUserPick
  );
  const firstRelevantRank = midpointEntry?.rank ?? plausibleEntry?.rank ?? Number.POSITIVE_INFINITY;
  const missingPriceBeforeReading = ranked.some(
    (entry) =>
      entry.rank < firstRelevantRank &&
      !hasReliableFantasyReplacementMarket(entry.player)
  );
  const coverage = missingPriceBeforeReading ? "limited" : "supported";
  const plausibleSurvivor = plausibleEntry
    ? survivorReading(plausibleEntry.player, best, valueById, vorpValues)
    : null;

  if (!midpointEntry) {
    return {
      kind: "no-priced-survivor",
      nextPick: followingUserPick,
      plausibleSurvivor,
      coverage,
    };
  }

  const survivor = survivorReading(midpointEntry.player, best, valueById, vorpValues);
  if (!survivor) {
    return {
      kind: "unmeasurable",
      nextPick: followingUserPick,
      reason: "no-ranked-player",
      coverage: "unavailable",
    };
  }
  return {
    kind: "measured",
    nextPick: followingUserPick,
    survivor,
    plausibleSurvivor,
    saferSurvivor: saferEntry
      ? survivorReading(saferEntry.player, best, valueById, vorpValues)
      : null,
    coverage,
  };
}

export function calculateRedraftDraftDecision(
  input: RedraftDraftDecisionInput
): RedraftDraftDecisionReport {
  const totalPicks = input.room.teams * input.room.rounds;
  const userOnClock =
    input.currentPick <= totalPicks &&
    getRedraftTeamAtPick(
      input.currentPick,
      input.room.teams,
      input.room.draftOrder
    ) === input.room.userTeam;
  const nextUserPick = getRedraftNextPickForTeam({
    fromPick: input.currentPick,
    team: input.room.userTeam,
    teams: input.room.teams,
    rounds: input.room.rounds,
    draftOrder: input.room.draftOrder,
  });
  const followingUserPick = userOnClock
    ? getRedraftNextPickForTeam({
        fromPick: input.currentPick,
        team: input.room.userTeam,
        teams: input.room.teams,
        rounds: input.room.rounds,
        draftOrder: input.room.draftOrder,
        strictlyAfter: true,
      })
    : null;

  if (!input.rankingUsable) {
    return {
      modelVersion: REDRAFT_DRAFT_DECISION_MODEL_VERSION,
      guidanceAvailable: false,
      userOnClock,
      nextUserPick,
      followingUserPick,
      playerValues: [],
      positions: [],
      mostAtRisk: null,
    };
  }

  const cutoffs = buildFantasyReplacementCutoffs(
    input.players,
    {
      teams: input.room.teams,
      rosterSize: input.room.rounds,
      lineup: input.room.lineup,
    },
    getFantasyReplacementExpertRank
  );
  const playerValues = input.players
    .filter((player) =>
      REDRAFT_DECISION_POSITIONS.includes(
        player.position as RedraftDecisionPosition
      )
    )
    .map((player) =>
      replacementReading(
        player,
        cutoffs[player.position as RedraftDecisionPosition]
      )
    )
    .filter(
      (reading): reading is RedraftReplacementReading => reading !== null
    );
  const valueById = new Map(
    playerValues.map((reading) => [reading.player.id, reading])
  );
  const overallRankById = new Map(
    playerValues.map((reading) => [reading.player.id, reading.expertRank])
  );
  const draftedIds = new Set(input.picks.map((pick) => pick.player.id));
  const needs = needByPosition(input.picks, input.room);

  const partial = REDRAFT_DECISION_POSITIONS.map((position) => {
    const available = input.players
      .filter(
        (player) =>
          player.position === position && !draftedIds.has(player.id)
      )
      .sort(
        (left, right) =>
          (getFantasyReplacementExpertRank(left) ?? Number.POSITIVE_INFINITY) -
            (getFantasyReplacementExpertRank(right) ?? Number.POSITIVE_INFINITY) ||
          left.id.localeCompare(right.id)
      );
    const bestPlayer = available[0] ?? null;
    const best = bestPlayer ? valueById.get(bestPlayer.id) ?? null : null;
    const tier = tierReading({
      best: bestPlayer,
      positionBoard: input.positionBoards[position] ?? [],
      draftedIds,
      overallRankById,
      teams: input.room.teams,
    });
    const wait = waitReading({
      available,
      best,
      valueById,
      userOnClock,
      followingUserPick,
      marketCurrent: input.marketCurrent,
      vorpValues: input.vorpValues,
    });
    return { position, need: needs[position], bestAvailable: best, tier, wait };
  });

  const highestNeededWaitCost = Math.max(
    0,
    ...partial
      .filter((entry) => entry.need !== "filled")
      .map((entry) =>
        entry.wait.kind === "measured" ? entry.wait.survivor.rankCost : 0
      )
  );
  const positions: RedraftPositionDecision[] = partial.map((entry) => {
    if (entry.need === "filled") {
      return { ...entry, scarcityScore: 0 };
    }
    const tierSignal = entry.tier.signal ?? 0;
    const waitSignal =
      entry.wait.kind === "no-priced-survivor" &&
      entry.wait.coverage === "supported"
        ? 1
        : entry.wait.kind === "measured" && highestNeededWaitCost > 0
          ? clamp(
              entry.wait.survivor.rankCost / highestNeededWaitCost,
              0,
              1
            ) *
            clamp(entry.wait.survivor.rankCost / input.room.teams, 0, 1)
          : 0;
    return {
      ...entry,
      scarcityScore: Math.round(Math.max(tierSignal, waitSignal) * 100),
    };
  });
  const mostAtRisk = positions
    .filter(
      (entry) =>
        entry.need !== "filled" &&
        entry.bestAvailable !== null &&
        (entry.scarcityScore ?? 0) > 0
    )
    .sort(
      (left, right) =>
        (right.scarcityScore ?? 0) - (left.scarcityScore ?? 0) ||
        (right.bestAvailable?.value ?? 0) - (left.bestAvailable?.value ?? 0)
    )[0] ?? null;

  return {
    modelVersion: REDRAFT_DRAFT_DECISION_MODEL_VERSION,
    guidanceAvailable: true,
    userOnClock,
    nextUserPick,
    followingUserPick,
    playerValues,
    positions,
    mostAtRisk,
  };
}

/**
 * The per-card copy for a position decision. Shared by the website panel and
 * the draft companion so the two surfaces cannot drift apart.
 */
export function describeRedraftNeed(entry: RedraftPositionDecision): string {
  if (entry.need === "starter") return "Starter open";
  if (entry.need === "depth") return "Depth target";
  return "Target met";
}

export function describeRedraftTier(entry: RedraftPositionDecision): string {
  const tier = entry.tier;
  if (tier.tier === null || tier.positionRank === null) {
    return "No positional tier is published for the best available player.";
  }
  const next = tier.nextTierPositionRank === null
    ? "No later published tier is available."
    : `The next tier begins at ${entry.position}${Math.round(tier.nextTierPositionRank)}${
        tier.overallBoardGap !== null
          ? `, about ${Math.round(tier.overallBoardGap)} overall picks down the board`
          : ""
      }.`;
  return `${entry.position}${Math.round(tier.positionRank)} sits in positional Tier ${tier.tier}, with ${tier.remaining} ${tier.remaining === 1 ? "player" : "players"} left. ${next}`;
}

export function describeRedraftWait(wait: RedraftWaitReading): string {
  if (wait.kind === "measured") {
    const detail = `${wait.survivor.rankCost.toFixed(0)} consensus spots and ${wait.survivor.replacementDrop.toFixed(1)} replacement index points`;
    const roundedPoints =
      wait.survivor.pointsDrop !== null ? Math.round(wait.survivor.pointsDrop) : null;
    const base =
      roundedPoints !== null && roundedPoints >= 1
        ? `At pick #${wait.nextPick}, the market midpoint moves to ${wait.survivor.player.name}. Waiting costs about ${roundedPoints} projected season points (${detail}) against the best option now.`
        : roundedPoints !== null
          ? // A drop that rounds to zero must not read as "waiting is free".
            `At pick #${wait.nextPick}, the market midpoint moves to ${wait.survivor.player.name}. Waiting costs less than one projected season point (${detail}) against the best option now.`
          : `At pick #${wait.nextPick}, the market midpoint moves to ${wait.survivor.player.name}. That is ${detail} below the best option now.`;
    // The band survivors were computed all along and answer the two questions
    // the midpoint cannot: who can be counted on, and what the best case is.
    const extras: string[] = [];
    if (wait.saferSurvivor && wait.saferSurvivor.player.id !== wait.survivor.player.id) {
      extras.push(
        `${wait.saferSurvivor.player.name} is the safer bet to last, with his whole published range clearing that pick.`
      );
    }
    if (
      wait.plausibleSurvivor &&
      wait.plausibleSurvivor.player.id !== wait.survivor.player.id &&
      wait.plausibleSurvivor.player.id !== wait.saferSurvivor?.player.id
    ) {
      extras.push(
        `In the best case, ${wait.plausibleSurvivor.player.name} is still there inside the uncertainty band.`
      );
    }
    return [base, ...extras].join(" ");
  }
  if (wait.kind === "no-priced-survivor") {
    return wait.plausibleSurvivor
      ? `No reliably priced option reaches pick #${wait.nextPick} at the market midpoint. ${wait.plausibleSurvivor.player.name} remains inside the published uncertainty band.`
      : `No reliably priced option reaches pick #${wait.nextPick} at the market midpoint.`;
  }
  switch (wait.reason) {
    case "off-clock":
      return "The cost of waiting returns when your pick is live, after the intervening selections are known.";
    case "market-unavailable":
      return "Current ADP is unavailable, so the board does not estimate who lasts until your next turn.";
    case "no-next-pick":
      return "This is your final turn, so there is no later pick to compare.";
    case "no-ranked-player":
      return "The published board does not have enough overall ranks to measure this position.";
    case "no-reliable-market":
      return "This part of the position board has no ADP sample large enough to measure a later turn.";
  }
}
