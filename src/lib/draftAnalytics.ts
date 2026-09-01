import {
  getAdpSignalThreshold,
  hasReliableAdpSample,
} from "@/lib/fantasyUtils";
import {
  DEFAULT_REDRAFT_LINEUP,
  getRedraftRosterTarget,
  normalizeRedraftLineup,
} from "@/lib/redraftLineup";
import type {
  DraftAnalytics,
  DraftPick,
  Player,
  Position,
  RedraftLineupSettings,
  TeamRoster,
} from "@/types";

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
const REACH_STEAL_ROUND_FACTOR = 3;
/** Picks of one position count as a run when each lands within this many picks of the last. */
const POSITION_RUN_WINDOW = 5;
/** Minimum same-position picks before a cluster is called a run. */
const POSITION_RUN_MIN_COUNT = 3;
/** How many top steals make the best-value list. */
const BEST_VALUE_LIMIT = 5;

/**
 * Starting-lineup targets shared with the draft board's roster-pressure
 * ordering, so "need" and "weakness" never disagree.
 */
const _ROSTER_STARTER_TARGETS = {
  QB: DEFAULT_REDRAFT_LINEUP.QB,
  RB: DEFAULT_REDRAFT_LINEUP.RB,
  WR: DEFAULT_REDRAFT_LINEUP.WR,
  TE: DEFAULT_REDRAFT_LINEUP.TE,
  K: DEFAULT_REDRAFT_LINEUP.K,
  DST: DEFAULT_REDRAFT_LINEUP.DST,
} as const;

type RosterTargetPosition = keyof typeof _ROSTER_STARTER_TARGETS;

export type RosterNeedLevel = "starter" | "depth";

export interface RosterNeed {
  slot: RosterTargetPosition | "FLEX";
  level: RosterNeedLevel;
  eligiblePositions: readonly RosterTargetPosition[];
}

/**
 * Rebuilds every derived team field from the exact pick objects a caller will
 * analyze or export. This keeps restored drafts consistent when the current
 * snapshot corrects a player's position or replaces a stale player record.
 */
export function reconcileTeamRosters(
  teams: readonly TeamRoster[],
  picks: readonly DraftPick[]
): TeamRoster[] {
  return teams.map((team) => {
    const teamPicks = picks.filter((pick) => pick.teamNumber === team.teamNumber);
    const positionCounts: TeamRoster["positionCounts"] = {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      K: 0,
      DST: 0,
    };
    let totalValue = 0;
    let projectedPoints = 0;
    for (const pick of teamPicks) {
      if (pick.player.position in positionCounts) {
        positionCounts[pick.player.position as keyof typeof positionCounts] += 1;
      }
      totalValue += pick.player.auctionValue ?? 0;
      projectedPoints += pick.player.projectedPoints ?? 0;
    }
    return {
      ...team,
      picks: teamPicks,
      positionCounts,
      totalValue,
      projectedPoints,
    };
  });
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

const FLEX_ELIGIBLE_POSITIONS = ["RB", "WR", "TE"] as const satisfies readonly RosterTargetPosition[];

/**
 * What the user's roster still wants, most urgent first, across two levels. FLEX
 * is an explicit starting slot filled by surplus RB, WR, or TE picks. Depth is
 * suppressed while any skill starter is open. Shared with the board's priority
 * tags and roster-pressure panel so they never disagree.
 */
export function getRosterNeeds(team: {
  positionCounts: TeamRoster["positionCounts"];
  lineup?: RedraftLineupSettings;
  rounds?: number;
}): RosterNeed[] {
  const counts = team.positionCounts;
  const lineup = normalizeRedraftLineup(team.lineup);
  const rounds = Math.max(1, Math.round(team.rounds ?? 15));
  const countOf = (position: RosterTargetPosition): number => counts[position] ?? 0;

  const needs: RosterNeed[] = [];

  // 1. Starting slots still open, biggest shortfall first.
  const starterTargets: Record<RosterTargetPosition, number> = {
    QB: lineup.QB,
    RB: lineup.RB,
    WR: lineup.WR,
    TE: lineup.TE,
    K: lineup.K,
    DST: lineup.DST,
  };
  const draftedCount = (Object.keys(starterTargets) as RosterTargetPosition[]).reduce(
    (sum, position) => sum + countOf(position),
    0
  );
  const remainingPicks = Math.max(0, rounds - draftedCount);
  const missingDeferredSlots =
    Math.max(0, starterTargets.K - countOf("K")) +
    Math.max(0, starterTargets.DST - countOf("DST"));
  const deferredStartersAreDue = remainingPicks <= missingDeferredSlots;
  const starterHoles = (Object.keys(starterTargets) as RosterTargetPosition[])
    .map((position) => ({ position, gap: starterTargets[position] - countOf(position) }))
    .filter(
      (entry) =>
        entry.gap > 0 &&
        ((entry.position !== "K" && entry.position !== "DST") || deferredStartersAreDue)
    )
    .sort(
      (left, right) =>
        right.gap - left.gap ||
        NEED_POSITION_PRIORITY[left.position] - NEED_POSITION_PRIORITY[right.position]
  );
  for (const hole of starterHoles) {
    needs.push({
      slot: hole.position,
      level: "starter",
      eligiblePositions: [hole.position],
    });
  }

  const flexFilled = Math.min(
    lineup.FLEX,
    FLEX_ELIGIBLE_POSITIONS.reduce(
      (total, position) => total + Math.max(0, countOf(position) - starterTargets[position]),
      0
    )
  );
  if (flexFilled < lineup.FLEX) {
    needs.push({
      slot: "FLEX",
      level: "starter",
      eligiblePositions: FLEX_ELIGIBLE_POSITIONS,
    });
  }

  // 2. Bench depth, once the skill starters (QB/RB/WR/TE) are set. K and DST are
  // required starters people fill last, so their open slots don't hold back depth
  // guidance the way a missing RB or WR would.
  const skillStarterHoleRemaining = flexFilled < lineup.FLEX || starterHoles.some(
    (hole) => hole.position !== "K" && hole.position !== "DST"
  );
  if (!skillStarterHoleRemaining) {
    const depthTargets = getRedraftRosterTarget(lineup, rounds);
    const depthHoles = (["QB", "RB", "WR", "TE"] as const)
      .map((position) => ({ position, gap: depthTargets[position] - countOf(position) }))
      .filter((entry) => entry.gap > 0)
      .sort(
        (left, right) =>
          right.gap - left.gap ||
          NEED_POSITION_PRIORITY[left.position] - NEED_POSITION_PRIORITY[right.position]
    );
    for (const hole of depthHoles) {
      if (needs.some((need) => need.slot === hole.position)) continue;
      needs.push({
        slot: hole.position,
        level: "depth",
        eligiblePositions: [hole.position],
      });
    }
  }

  return needs;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Deepest consensus rank that still stands in for a pick number. ADP is a pick and
 * consensus rank is a board position, and the two only agree near the top. Measured
 * against the 2026-08-06 PPR snapshot, the mean absolute gap is about 12 spots
 * through rank 150, then ADP compresses hard: across ranks 151-250 the mean
 * consensus rank is 195 while the mean ADP is 154. Past this cutoff a rank is not a
 * pick, so treating it as one turned every deep player into a large phantom reach.
 *
 * This is calibration against one snapshot, not a constant of nature. ADP compresses
 * further as more real drafts land, so the honest cutoff moves through the preseason
 * and nothing here detects that drift.
 */
export const ECR_BASELINE_MAX_RANK = 150;

/**
 * Underdog-style ADP piles up at the last pick of the draft for everyone who goes
 * undrafted, so an ADP sitting at that floor is a placeholder rather than a market
 * price. In the 2026-08-06 best ball snapshot 116 of 338 priced players sit there
 * with consensus ranks as deep as 417. This predicate only recognizes the numeric
 * pile-up and cannot identify the source. Callers must apply it only to feeds that
 * use the placeholder, since a late redraft ADP can be a valid observed price.
 */
export function isUndraftedFloorAdp(adp: number, rounds: number, teams: number): boolean {
  return adp >= rounds * teams - 2;
}

/**
 * Where the player was expected to go, as a pick number. Market ADP when we have it,
 * otherwise the expert consensus rank while it is still close enough to the pick
 * scale to mean something. Null means the pick can't be judged at all and is
 * excluded from every signal.
 */
export function getPickBaseline(player: Player): number | null {
  if (isFiniteNumber(player.adp)) {
    return hasReliableAdpSample(player) ? player.adp : null;
  }
  const consensus = isFiniteNumber(player.rankEcr)
    ? player.rankEcr
    : isFiniteNumber(player.averageRank)
      ? player.averageRank
      : null;
  if (consensus === null || consensus > ECR_BASELINE_MAX_RANK) {
    return null;
  }
  return consensus;
}

/**
 * Positive delta means the player lasted past his baseline (a steal),
 * negative means he went early (a reach).
 */
export function getPickDelta(pick: DraftPick): number | null {
  const baseline = getPickBaseline(pick.player);
  return baseline === null ? null : Math.round(pick.pickNumber - baseline);
}

export function getReachStealThreshold(round: number, player?: Player): number {
  if (
    player &&
    isFiniteNumber(player.adp) &&
    (isFiniteNumber(player.adpStandardDeviation) ||
      (isFiniteNumber(player.adpHigh) && isFiniteNumber(player.adpLow)))
  ) {
    return getAdpSignalThreshold(player);
  }
  return Math.max(REACH_STEAL_MIN_THRESHOLD, round * REACH_STEAL_ROUND_FACTOR);
}

export function classifyPickValue(pick: DraftPick): "steal" | "reach" | null {
  const delta = getPickDelta(pick);
  if (delta === null) {
    return null;
  }

  const threshold = getReachStealThreshold(pick.round, pick.player);
  if (delta >= threshold) {
    return "steal";
  }
  if (delta <= -threshold) {
    return "reach";
  }
  return null;
}

/** Whether a still-available player has fallen far enough to earn the live value badge. */
export function isPlayerValueAtPick(
  player: Player,
  pickNumber: number,
  round: number
): boolean {
  return (
    isFiniteNumber(player.adp) &&
    hasReliableAdpSample(player) &&
    Number.isFinite(pickNumber) &&
    pickNumber - player.adp >= getReachStealThreshold(round, player)
  );
}

interface PositionRun {
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

function getTeamStrengthsAndWeaknesses(
  team: TeamRoster,
  lineup: RedraftLineupSettings,
  rounds: number
): {
  strengths: Position[];
  weaknesses: Position[];
} {
  const strengths: Position[] = [];
  const needs = getRosterNeeds({ positionCounts: team.positionCounts, lineup, rounds });
  const weaknesses = Array.from(
    new Set(needs.filter((need) => need.level === "starter").map((need) => need.slot))
  );
  const rosterTarget = getRedraftRosterTarget(lineup, rounds);

  for (const position of ["QB", "RB", "WR", "TE"] as const) {
    if ((team.positionCounts[position] ?? 0) >= rosterTarget[position]) {
      strengths.push(position);
    }
  }

  return { strengths, weaknesses };
}

export function computeDraftAnalytics(
  picks: DraftPick[],
  teams: TeamRoster[],
  options: { lineup?: RedraftLineupSettings; rounds?: number } = {}
): DraftAnalytics {
  const lineup = normalizeRedraftLineup(options.lineup);
  const rounds = Math.max(1, Math.round(options.rounds ?? 15));
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
  // Use the explicit pick list because callers sanitize it against the current
  // snapshot before analysis. TeamRoster can still contain browser-persisted
  // player copies with old or slate-mismatched ADP.
  const valueTotals = new Map(
    draftedTeams.map((team) => [
      team.teamNumber,
      picks
        .filter((pick) => pick.teamNumber === team.teamNumber)
        .reduce((total, pick) => total + (getPickDelta(pick) ?? 0), 0),
    ])
  );

  const teamStrengths = draftedTeams.map((team) => {
    const { strengths, weaknesses } = getTeamStrengthsAndWeaknesses(team, lineup, rounds);
    const valueTotal = valueTotals.get(team.teamNumber) ?? 0;

    return {
      teamNumber: team.teamNumber,
      strengths,
      weaknesses,
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

interface EmergingRun {
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

  // detectPositionRuns sorts by startPick, so .find() would return the run that
  // began earliest rather than the one still on the clock. Keep the latest-ending
  // qualifying run, matching how getEmergingRun tracks its endPick.
  const activeRun = detectPositionRuns(picks)
    .filter((run) => currentPick - run.endPick <= POSITION_RUN_WINDOW)
    .reduce<PositionRun | null>(
      (best, run) => (best === null || run.endPick > best.endPick ? run : best),
      null
    );

  return { latestFlaggedPick, activeRun };
}
