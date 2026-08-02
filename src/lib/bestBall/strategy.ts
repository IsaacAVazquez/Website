import type { Player } from "@/types";
import { DEFAULT_BEST_BALL_CONTEST_ID, getContestPreset } from "./contests";
import { BEST_BALL_POSITIONS } from "./types";
import type {
  AdaptiveRosterTargets,
  BestBallByeConflict,
  BestBallContestId,
  BestBallDraftPick,
  BestBallPosition,
  BestBallRosterAnalysis,
  BestBallRosterComposition,
  BestBallStack,
  BestBallTeamConcentration,
  BestBallWeek17Pair,
} from "./types";

export const STANDARD_ROSTER_SEARCH_SPACE: Readonly<
  Record<BestBallPosition, Readonly<{ minimum: number; maximum: number }>>
> = Object.freeze({
  QB: { minimum: 2, maximum: 3 },
  RB: { minimum: 4, maximum: 7 },
  WR: { minimum: 6, maximum: 9 },
  TE: { minimum: 2, maximum: 3 },
});

export const SUPERFLEX_ROSTER_SEARCH_SPACE: typeof STANDARD_ROSTER_SEARCH_SPACE = Object.freeze({
  QB: { minimum: 3, maximum: 4 },
  RB: { minimum: 4, maximum: 7 },
  WR: { minimum: 5, maximum: 8 },
  TE: { minimum: 2, maximum: 3 },
});

const EMPTY_COUNTS: BestBallRosterComposition = { QB: 0, RB: 0, WR: 0, TE: 0 };

function isBestBallPosition(value: Player["position"]): value is BestBallPosition {
  return BEST_BALL_POSITIONS.includes(value as BestBallPosition);
}

function rosterPlayers(picks: readonly BestBallDraftPick[]): Player[] {
  return picks.map((pick) => pick.player).filter((player) => isBestBallPosition(player.position));
}

export function countBestBallPositions(
  picks: readonly BestBallDraftPick[]
): BestBallRosterComposition {
  const counts = { ...EMPTY_COUNTS };
  for (const pick of picks) {
    if (isBestBallPosition(pick.player.position)) counts[pick.player.position] += 1;
  }
  return counts;
}

function enumerateCompositions(
  searchSpace: typeof STANDARD_ROSTER_SEARCH_SPACE,
  counts: BestBallRosterComposition,
  rosterSize: number
): BestBallRosterComposition[] {
  const compositions: BestBallRosterComposition[] = [];
  for (let QB = Math.max(searchSpace.QB.minimum, counts.QB); QB <= Math.max(searchSpace.QB.maximum, counts.QB); QB += 1) {
    for (let RB = Math.max(searchSpace.RB.minimum, counts.RB); RB <= Math.max(searchSpace.RB.maximum, counts.RB); RB += 1) {
      for (let WR = Math.max(searchSpace.WR.minimum, counts.WR); WR <= Math.max(searchSpace.WR.maximum, counts.WR); WR += 1) {
        for (let TE = Math.max(searchSpace.TE.minimum, counts.TE); TE <= Math.max(searchSpace.TE.maximum, counts.TE); TE += 1) {
          if (QB + RB + WR + TE === rosterSize) compositions.push({ QB, RB, WR, TE });
        }
      }
    }
  }
  return compositions;
}

function picksThroughRound(
  picks: readonly BestBallDraftPick[],
  position: BestBallPosition,
  round: number
): number {
  return picks.filter((pick) => pick.player.position === position && pick.round <= round).length;
}

export function getAdaptiveRosterTargets(
  picks: readonly BestBallDraftPick[],
  contestId: BestBallContestId = DEFAULT_BEST_BALL_CONTEST_ID,
  upcomingRound?: number
): AdaptiveRosterTargets {
  const preset = getContestPreset(contestId);
  const isSuperflex = preset.format === "superflex";
  const searchSpace = isSuperflex ? SUPERFLEX_ROSTER_SEARCH_SPACE : STANDARD_ROSTER_SEARCH_SPACE;
  const counts = countBestBallPositions(picks);
  const latestCompletedRound = picks.reduce((latest, pick) => Math.max(latest, pick.round), 0);
  const currentRound = Number.isInteger(upcomingRound) && Number(upcomingRound) > 0
    ? Number(upcomingRound)
    : latestCompletedRound;
  const desired: Record<BestBallPosition, number> = isSuperflex
    ? { QB: 3.5, RB: 5, WR: 7, TE: 2.5 }
    : { QB: 2.5, RB: 5.5, WR: 7.5, TE: 2.5 };
  const preferenceWeight: Record<BestBallPosition, number> = { QB: 1, RB: 1, WR: 1, TE: 1 };
  const positionReasons: Record<BestBallPosition, string> = {
    QB: "The range keeps enough weekly QB coverage without assuming a third QB is always required.",
    RB: "The range balances usable RB weeks with the larger WR lineup requirement.",
    WR: "The three WR slots and flex keep WR as the largest roster group.",
    TE: "The range keeps enough weekly TE coverage without treating TE like a flex-only position.",
  };
  const reasons: string[] = [];

  const earlyQb = picksThroughRound(picks, "QB", 6) >= 1;
  const delayedQb = currentRound >= 9 && counts.QB === 0;
  if (earlyQb) {
    desired.QB = isSuperflex ? 3 : 2;
    preferenceWeight.QB = 25;
    positionReasons.QB = "An early QB lowers the preferred QB count inside the allowed range.";
    reasons.push(positionReasons.QB);
  } else if (delayedQb) {
    desired.QB = searchSpace.QB.maximum;
    preferenceWeight.QB = 25;
    positionReasons.QB = "No QB through Round 8 raises the preferred QB count for weekly coverage.";
    reasons.push(positionReasons.QB);
  }

  const earlyTe = picksThroughRound(picks, "TE", 6) >= 1;
  const delayedTe = currentRound >= 9 && counts.TE === 0;
  if (earlyTe) {
    desired.TE = 2;
    preferenceWeight.TE = 25;
    positionReasons.TE = "An early TE lowers the preferred TE count inside the allowed range.";
    reasons.push(positionReasons.TE);
  } else if (delayedTe) {
    desired.TE = 3;
    preferenceWeight.TE = 25;
    positionReasons.TE = "No TE through Round 8 raises the preferred TE count for weekly coverage.";
    reasons.push(positionReasons.TE);
  }

  if (picksThroughRound(picks, "RB", 4) >= 2) {
    desired.RB = 4;
    preferenceWeight.RB = 5;
    positionReasons.RB = "Two early RB picks lower the preferred RB count and leave more roster spots for receivers.";
    reasons.push(positionReasons.RB);
  } else if (currentRound >= 7 && picksThroughRound(picks, "RB", 6) <= 1) {
    desired.RB = 6;
    preferenceWeight.RB = 5;
    positionReasons.RB = "Delayed RB investment raises the preferred RB count for later weekly coverage.";
    reasons.push(positionReasons.RB);
  }

  if (picksThroughRound(picks, "WR", 5) >= 3) {
    desired.WR = 7;
    preferenceWeight.WR = 5;
    positionReasons.WR = "Three early WR picks lower the preferred WR count inside the allowed range.";
    reasons.push(positionReasons.WR);
  } else if (currentRound >= 7 && picksThroughRound(picks, "WR", 6) <= 2) {
    desired.WR = searchSpace.WR.maximum;
    preferenceWeight.WR = 5;
    positionReasons.WR = "Delayed WR investment raises the preferred WR count because the lineup starts three.";
    reasons.push(positionReasons.WR);
  }

  for (const position of BEST_BALL_POSITIONS) {
    if (counts[position] > searchSpace[position].maximum) {
      positionReasons[position] = `The roster already has ${counts[position]} ${position}, above the normal maximum of ${searchSpace[position].maximum}. Completed picks stay fixed while the remaining targets rebalance the roster.`;
      reasons.push(positionReasons[position]);
    }
  }

  const compositions = enumerateCompositions(searchSpace, counts, preset.rosterSize);
  const scoreComposition = (composition: BestBallRosterComposition): number =>
    BEST_BALL_POSITIONS.reduce(
      (score, position) =>
        score + preferenceWeight[position] * (composition[position] - desired[position]) ** 2,
      0
    );
  const sortedCompositions = [...compositions].sort(
    (left, right) =>
      scoreComposition(left) - scoreComposition(right) ||
      left.QB - right.QB ||
      left.TE - right.TE ||
      left.RB - right.RB ||
      right.WR - left.WR
  );

  const closestCompletion = { ...counts };
  let remainingSpots = Math.max(0, preset.rosterSize - rosterPlayers(picks).length);
  while (remainingSpots > 0) {
    const [nextPosition] = [...BEST_BALL_POSITIONS].sort((left, right) => {
      const leftGap = Math.max(searchSpace[left].minimum, desired[left]) - closestCompletion[left];
      const rightGap = Math.max(searchSpace[right].minimum, desired[right]) - closestCompletion[right];
      return rightGap - leftGap || BEST_BALL_POSITIONS.indexOf(left) - BEST_BALL_POSITIONS.indexOf(right);
    });
    closestCompletion[nextPosition] += 1;
    remainingSpots -= 1;
  }
  if (sortedCompositions.length === 0) {
    reasons.push(
      "The remaining roster spots cannot reach a standard construction range, so the targets show the closest finish that preserves every completed pick."
    );
  }

  const recommended = sortedCompositions[0] ?? closestCompletion;
  const bestScore = sortedCompositions.length > 0 ? scoreComposition(recommended) : 0;
  const nearby = sortedCompositions.filter(
    (composition) => scoreComposition(composition) <= bestScore + 1.5
  );
  const targetPool = nearby.length > 0 ? nearby : [recommended];

  const targets = Object.fromEntries(
    BEST_BALL_POSITIONS.map((position) => [
      position,
      {
        minimum: Math.min(...targetPool.map((composition) => composition[position])),
        recommended: recommended[position],
        maximum: Math.max(...targetPool.map((composition) => composition[position])),
        drafted: counts[position],
        reason: positionReasons[position],
      },
    ])
  ) as AdaptiveRosterTargets["targets"];

  return {
    rosterSize: preset.rosterSize,
    draftedCount: rosterPlayers(picks).length,
    currentRound,
    counts,
    recommended,
    targets,
    validCompositions: sortedCompositions,
    reasons,
  };
}

function normalizedTeam(team: string): string {
  return team.trim().toUpperCase();
}

export function findQbPassCatcherStacks(
  picks: readonly BestBallDraftPick[]
): BestBallStack[] {
  const byTeam = new Map<string, Player[]>();
  for (const player of rosterPlayers(picks)) {
    const team = normalizedTeam(player.team);
    if (!team || team === "FA") continue;
    byTeam.set(team, [...(byTeam.get(team) ?? []), player]);
  }

  return [...byTeam.entries()]
    .map(([team, players]) => {
      const quarterbacks = players.filter((player) => player.position === "QB");
      const passCatchers = players.filter(
        (player) => player.position === "WR" || player.position === "TE"
      );
      return {
        team,
        quarterbacks,
        passCatchers,
        playerIds: [...quarterbacks, ...passCatchers].map((player) => player.id),
      };
    })
    .filter((stack) => stack.quarterbacks.length > 0 && stack.passCatchers.length > 0)
    .sort((left, right) => right.playerIds.length - left.playerIds.length || left.team.localeCompare(right.team));
}

export function findSameTeamConcentrations(
  picks: readonly BestBallDraftPick[],
  minimumPlayers = 3
): BestBallTeamConcentration[] {
  const byTeam = new Map<string, Player[]>();
  for (const player of rosterPlayers(picks)) {
    const team = normalizedTeam(player.team);
    if (!team || team === "FA") continue;
    byTeam.set(team, [...(byTeam.get(team) ?? []), player]);
  }
  return [...byTeam.entries()]
    .filter(([, players]) => players.length >= minimumPlayers)
    .map(([team, players]) => ({ team, count: players.length, players }))
    .sort((left, right) => right.count - left.count || left.team.localeCompare(right.team));
}

export function findByeWeekConflicts(
  picks: readonly BestBallDraftPick[],
  minimumPlayers = 2
): BestBallByeConflict[] {
  const byWeek = new Map<number, Player[]>();
  for (const player of rosterPlayers(picks)) {
    if (!Number.isInteger(player.byeWeek) || (player.byeWeek ?? 0) < 1) continue;
    const week = player.byeWeek as number;
    byWeek.set(week, [...(byWeek.get(week) ?? []), player]);
  }
  return [...byWeek.entries()]
    .filter(([, players]) => players.length >= minimumPlayers)
    .map(([byeWeek, players]) => {
      const positionCounts: Partial<Record<BestBallPosition, number>> = {};
      for (const player of players) {
        if (isBestBallPosition(player.position)) {
          positionCounts[player.position] = (positionCounts[player.position] ?? 0) + 1;
        }
      }
      return { byeWeek, count: players.length, players, positionCounts };
    })
    .sort((left, right) => right.count - left.count || left.byeWeek - right.byeWeek);
}

export function findWeek17OpponentPairs(
  picks: readonly BestBallDraftPick[],
  week17Opponents: Readonly<Record<string, string>> = {}
): BestBallWeek17Pair[] {
  const playersByTeam = new Map<string, Player[]>();
  for (const player of rosterPlayers(picks)) {
    const team = normalizedTeam(player.team);
    if (!team || team === "FA") continue;
    playersByTeam.set(team, [...(playersByTeam.get(team) ?? []), player]);
  }

  const seen = new Set<string>();
  const pairs: BestBallWeek17Pair[] = [];
  for (const [team, players] of playersByTeam) {
    const opponent = normalizedTeam(week17Opponents[team] ?? "");
    const opponentPlayers = playersByTeam.get(opponent);
    if (!opponent || !opponentPlayers) continue;
    const teams = [team, opponent].sort() as [string, string];
    const key = teams.join("::");
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      teams,
      playersByTeam: {
        [team]: players,
        [opponent]: opponentPlayers,
      },
    });
  }
  return pairs.sort((left, right) => left.teams.join().localeCompare(right.teams.join()));
}

export function analyzeBestBallRoster(
  picks: readonly BestBallDraftPick[],
  week17Opponents: Readonly<Record<string, string>> = {},
  contestId: BestBallContestId = DEFAULT_BEST_BALL_CONTEST_ID,
  upcomingRound?: number
): BestBallRosterAnalysis {
  return {
    targets: getAdaptiveRosterTargets(picks, contestId, upcomingRound),
    stacks: findQbPassCatcherStacks(picks),
    concentrations: findSameTeamConcentrations(picks),
    byeConflicts: findByeWeekConflicts(picks),
    week17Pairs: findWeek17OpponentPairs(picks, week17Opponents),
  };
}
