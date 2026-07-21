import type { DraftAnalytics, DraftPick, Player, Position, TeamRoster } from "@/types";

/**
 * Pure draft analytics computed from logged picks. Framework-free so the
 * draft tracker can memoize it cheaply and tests can pin the math.
 *
 * Every signal here compares a pick's draft slot to a market or expert
 * baseline — where the player "should" have gone. That measures draft-day
 * process, not season outcomes, and the UI copy says so.
 */

/** Floor for how far a pick must beat or trail its baseline to be flagged. */
export const REACH_STEAL_MIN_THRESHOLD = 8;
/** Threshold widens by this many spots per round — late-round gaps are noise. */
export const REACH_STEAL_ROUND_FACTOR = 3;
/** Picks of one position count as a run when each lands within this many picks of the last. */
export const POSITION_RUN_WINDOW = 5;
/** Minimum same-position picks before a cluster is called a run. */
export const POSITION_RUN_MIN_COUNT = 3;
/** How many top steals make the best-value list. */
const BEST_VALUE_LIMIT = 5;

/**
 * Starting-lineup targets shared with the draft board's roster-pressure
 * ordering, so "need" and "weakness" never disagree.
 */
export const ROSTER_STARTER_TARGETS = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  K: 1,
  DST: 1,
} as const;

export type RosterTargetPosition = keyof typeof ROSTER_STARTER_TARGETS;

/**
 * Total roster count worth carrying at each position. The extra RB/WR beyond the
 * two base starters cover both the weekly flex slot and bench depth, so the flex
 * is never modeled as its own position; a second TE and a backup QB round it out,
 * and K/DST stay one-deep. Standard-league defaults, hardcoded like the starter
 * targets since the tracker has no per-league roster settings.
 */
export const ROSTER_DEPTH_TARGETS = { RB: 4, WR: 4, QB: 2, TE: 2 } as const;

export type RosterNeedLevel = "starter" | "depth";

export interface RosterNeed {
  slot: RosterTargetPosition;
  level: RosterNeedLevel;
}

/**
 * Tiebreak order when two needs share a level and gap: skill positions before
 * kicker and defense, so the board never nags about a K in the early rounds.
 */
const NEED_POSITION_PRIORITY: Record<RosterTargetPosition, number> = {
  RB: 0,
  WR: 1,
  QB: 2,
  TE: 3,
  K: 4,
  DST: 5,
};

/**
 * What the user's roster still wants, most urgent first, across two levels: an
 * open starting slot (below the base target) and bench depth (a set starting
 * core but below the depth target). The weekly flex is not a position of its
 * own — the RB/WR/TE depth targets already keep those positions wanted after the
 * base starters, which is exactly what fills a flex. Depth is suppressed while
 * any skill starter is still open, so a slot never shows twice. Shared with the
 * board's priority tags and roster-pressure panel so they never disagree.
 */
export function getRosterNeeds(team: {
  positionCounts: TeamRoster["positionCounts"];
}): RosterNeed[] {
  const counts = team.positionCounts;
  const countOf = (position: RosterTargetPosition): number => counts[position] ?? 0;

  const needs: RosterNeed[] = [];

  // 1. Starting slots still open, biggest shortfall first.
  const starterHoles = (Object.keys(ROSTER_STARTER_TARGETS) as RosterTargetPosition[])
    .map((position) => ({ position, gap: ROSTER_STARTER_TARGETS[position] - countOf(position) }))
    .filter((entry) => entry.gap > 0)
    .sort(
      (left, right) =>
        right.gap - left.gap ||
        NEED_POSITION_PRIORITY[left.position] - NEED_POSITION_PRIORITY[right.position]
    );
  for (const hole of starterHoles) {
    needs.push({ slot: hole.position, level: "starter" });
  }

  // 2. Bench depth, once the skill starters (QB/RB/WR/TE) are set. K and DST are
  // required starters people fill last, so their open slots don't hold back depth
  // guidance the way a missing RB or WR would.
  const skillStarterHoleRemaining = starterHoles.some(
    (hole) => hole.position !== "K" && hole.position !== "DST"
  );
  if (!skillStarterHoleRemaining) {
    const depthHoles = (Object.keys(ROSTER_DEPTH_TARGETS) as (keyof typeof ROSTER_DEPTH_TARGETS)[])
      .map((position) => ({ position, gap: ROSTER_DEPTH_TARGETS[position] - countOf(position) }))
      .filter((entry) => entry.gap > 0)
      .sort(
        (left, right) =>
          right.gap - left.gap ||
          NEED_POSITION_PRIORITY[left.position] - NEED_POSITION_PRIORITY[right.position]
      );
    for (const hole of depthHoles) {
      needs.push({ slot: hole.position, level: "depth" });
    }
  }

  return needs;
}

const GRADE_SCALE: readonly { maxPercentile: number; grade: string }[] = [
  { maxPercentile: 0.125, grade: "A+" },
  { maxPercentile: 0.25, grade: "A" },
  { maxPercentile: 0.375, grade: "B+" },
  { maxPercentile: 0.5, grade: "B" },
  { maxPercentile: 0.625, grade: "C+" },
  { maxPercentile: 0.75, grade: "C" },
  { maxPercentile: 0.875, grade: "D+" },
  { maxPercentile: 1, grade: "D" },
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Where the player was expected to go. Market ADP when we have it, otherwise
 * the expert consensus rank. Null means the pick can't be judged at all and is
 * excluded from every signal.
 */
export function getPickBaseline(player: Player): number | null {
  if (isFiniteNumber(player.adp)) {
    return player.adp;
  }
  if (isFiniteNumber(player.rankEcr)) {
    return player.rankEcr;
  }
  if (isFiniteNumber(player.averageRank)) {
    return player.averageRank;
  }
  return null;
}

/**
 * Positive delta means the player lasted past his baseline (a steal),
 * negative means he went early (a reach).
 */
export function getPickDelta(pick: DraftPick): number | null {
  const baseline = getPickBaseline(pick.player);
  return baseline === null ? null : Math.round(pick.pickNumber - baseline);
}

export function getReachStealThreshold(round: number): number {
  return Math.max(REACH_STEAL_MIN_THRESHOLD, round * REACH_STEAL_ROUND_FACTOR);
}

export function classifyPickValue(pick: DraftPick): "steal" | "reach" | null {
  const delta = getPickDelta(pick);
  if (delta === null) {
    return null;
  }

  const threshold = getReachStealThreshold(pick.round);
  if (delta >= threshold) {
    return "steal";
  }
  if (delta <= -threshold) {
    return "reach";
  }
  return null;
}

export interface PositionRun {
  position: Position;
  startRound: number;
  endRound: number;
  playersSelected: number;
  startPick: number;
  endPick: number;
}

/**
 * Finds clusters where a position keeps coming off the board: consecutive
 * same-position picks that each land within `windowSize` overall picks of the
 * previous one, with at least `minCount` players in the cluster.
 */
export function detectPositionRuns(
  picks: DraftPick[],
  options: { windowSize?: number; minCount?: number } = {}
): PositionRun[] {
  const windowSize = options.windowSize ?? POSITION_RUN_WINDOW;
  const minCount = options.minCount ?? POSITION_RUN_MIN_COUNT;

  const picksByPosition = new Map<Position, DraftPick[]>();
  for (const pick of [...picks].sort((left, right) => left.pickNumber - right.pickNumber)) {
    const existing = picksByPosition.get(pick.player.position);
    if (existing) {
      existing.push(pick);
    } else {
      picksByPosition.set(pick.player.position, [pick]);
    }
  }

  const runs: PositionRun[] = [];

  for (const [position, positionPicks] of picksByPosition) {
    let cluster: DraftPick[] = [];

    const flushCluster = () => {
      if (cluster.length >= minCount) {
        runs.push({
          position,
          startRound: cluster[0].round,
          endRound: cluster[cluster.length - 1].round,
          playersSelected: cluster.length,
          startPick: cluster[0].pickNumber,
          endPick: cluster[cluster.length - 1].pickNumber,
        });
      }
      cluster = [];
    };

    for (const pick of positionPicks) {
      const previous = cluster[cluster.length - 1];
      if (previous && pick.pickNumber - previous.pickNumber > windowSize) {
        flushCluster();
      }
      cluster.push(pick);
    }
    flushCluster();
  }

  return runs.sort((left, right) => left.startPick - right.startPick);
}

/**
 * Net draft value per team: the sum of every judgeable pick's delta. A team
 * that keeps landing players past their baseline accumulates positive value.
 */
export function getTeamValueTotal(team: TeamRoster): number {
  return team.picks.reduce((total, pick) => total + (getPickDelta(pick) ?? 0), 0);
}

function getTeamStrengthsAndWeaknesses(team: TeamRoster): {
  strengths: Position[];
  weaknesses: Position[];
} {
  const strengths: Position[] = [];
  const weaknesses: Position[] = [];

  for (const position of Object.keys(ROSTER_STARTER_TARGETS) as RosterTargetPosition[]) {
    const count = team.positionCounts[position] ?? 0;
    const target = ROSTER_STARTER_TARGETS[position];
    if (count > target) {
      strengths.push(position);
    } else if (count < target) {
      weaknesses.push(position);
    }
  }

  return { strengths, weaknesses };
}

function gradeFromPercentile(percentile: number): string {
  for (const band of GRADE_SCALE) {
    if (percentile <= band.maxPercentile) {
      return band.grade;
    }
  }
  return "D";
}

export function computeDraftAnalytics(picks: DraftPick[], teams: TeamRoster[]): DraftAnalytics {
  const judgedPicks = picks
    .map((pick) => ({ pick, delta: getPickDelta(pick) }))
    .filter((entry): entry is { pick: DraftPick; delta: number } => entry.delta !== null);

  const steals = judgedPicks
    .filter(({ pick }) => classifyPickValue(pick) === "steal")
    .sort((left, right) => right.delta - left.delta)
    .map(({ pick }) => pick);

  const reaches = judgedPicks
    .filter(({ pick }) => classifyPickValue(pick) === "reach")
    .sort((left, right) => {
      const leftDelta = getPickDelta(left.pick) ?? 0;
      const rightDelta = getPickDelta(right.pick) ?? 0;
      return leftDelta - rightDelta;
    })
    .map(({ pick }) => pick);

  const draftedTeams = teams.filter((team) => team.picks.length > 0);
  const valueTotals = new Map(draftedTeams.map((team) => [team.teamNumber, getTeamValueTotal(team)]));
  const rankedTotals = [...valueTotals.values()].sort((left, right) => right - left);

  const teamStrengths = draftedTeams.map((team) => {
    const { strengths, weaknesses } = getTeamStrengthsAndWeaknesses(team);
    const valueTotal = valueTotals.get(team.teamNumber) ?? 0;
    // Rank by counting strictly-better teams rather than indexOf, which returns
    // the first matching index and would hand every tied team the single best
    // slot (over-grading ties — common early in a draft when many teams sit at
    // a 0 value total).
    const rank = rankedTotals.filter((total) => total > valueTotal).length;
    const percentile = rankedTotals.length > 1 ? rank / (rankedTotals.length - 1) : 0;

    return {
      teamNumber: team.teamNumber,
      strengths,
      weaknesses,
      overallGrade: gradeFromPercentile(percentile),
      valueTotal,
    };
  });

  return {
    bestValue: steals.slice(0, BEST_VALUE_LIMIT),
    reaches,
    steals,
    positionRunAnalysis: detectPositionRuns(picks),
    teamStrengths,
  };
}

/** Same-position picks inside the window needed to flag an *emerging* run. */
export const EMERGING_RUN_MIN_COUNT = 2;

export interface EmergingRun {
  position: Position;
  count: number;
  endPick: number;
}

/**
 * A softer, earlier sibling to {@link detectPositionRuns}: two same-position
 * picks already off the board inside the trailing window — a run *forming*
 * before it hardens into the confirmed three-pick run. Returns null once a
 * position reaches the full-run count (that's the hard signal's job) so the two
 * never describe the same cluster.
 */
export function getEmergingRun(
  picks: DraftPick[],
  currentPick: number,
  options: { windowSize?: number } = {}
): EmergingRun | null {
  const windowSize = options.windowSize ?? POSITION_RUN_WINDOW;
  const recent = picks.filter(
    (pick) => pick.pickNumber < currentPick && pick.pickNumber > currentPick - 1 - windowSize
  );

  const counts = new Map<Position, { count: number; endPick: number }>();
  for (const pick of recent) {
    const position = pick.player.position;
    if (position === "FLEX" || position === "OVERALL") {
      continue;
    }
    const entry = counts.get(position) ?? { count: 0, endPick: 0 };
    entry.count += 1;
    entry.endPick = Math.max(entry.endPick, pick.pickNumber);
    counts.set(position, entry);
  }

  let best: EmergingRun | null = null;
  for (const [position, { count, endPick }] of counts) {
    if (count >= EMERGING_RUN_MIN_COUNT && count < POSITION_RUN_MIN_COUNT) {
      if (!best || endPick > best.endPick) {
        best = { position, count, endPick };
      }
    }
  }

  return best;
}

/**
 * The most recent flagged pick and any run still forming at the current pick,
 * for the live sidebar during an active draft.
 */
export function getLiveDraftSignals(
  picks: DraftPick[],
  currentPick: number
): {
  latestFlaggedPick: { pick: DraftPick; delta: number; kind: "steal" | "reach" } | null;
  activeRun: PositionRun | null;
} {
  let latestFlaggedPick: { pick: DraftPick; delta: number; kind: "steal" | "reach" } | null = null;

  for (let index = picks.length - 1; index >= 0; index -= 1) {
    const kind = classifyPickValue(picks[index]);
    if (kind) {
      latestFlaggedPick = {
        pick: picks[index],
        delta: getPickDelta(picks[index]) ?? 0,
        kind,
      };
      break;
    }
  }

  const activeRun =
    detectPositionRuns(picks).find((run) => currentPick - run.endPick <= POSITION_RUN_WINDOW) ??
    null;

  return { latestFlaggedPick, activeRun };
}
