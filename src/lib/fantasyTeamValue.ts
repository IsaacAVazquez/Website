import {
  ECR_BASELINE_MAX_RANK,
  isUndraftedFloorAdp,
  getReachStealThreshold,
} from "@/lib/draftAnalytics";
import {
  analyzeBestBallRoster,
  getContestPreset,
  getStrategyProfile,
  hasSupportedBestBallAdp,
  type BestBallContestId,
  type BestBallContestPreset,
  type BestBallDraftPick,
  type BestBallPosition,
  type BestBallRosterAnalysis,
  getRosterSearchSpace,
} from "@/lib/bestBall";
import {
  ADP_SIGNAL_THRESHOLD,
  getAdpSignalThreshold,
  hasReliableAdpSample,
} from "@/lib/fantasyUtils";
import {
  getRedraftRosterTarget,
  normalizeRedraftLineup,
  redraftLineupSummary,
} from "@/lib/redraftLineup";
import { clamp } from "@/lib/utils";
import type {
  DraftPick,
  DraftSettings,
  Player,
  Position,
  RedraftLineupSettings,
} from "@/types";

/**
 * Draft Outlook v2 is an ordinal draft-process model. It compares teams inside
 * the current room from information available at draft time. It is not a
 * projected-points model, a win probability, or a roster-specific payout EV.
 */
const DRAFT_OUTLOOK_MODEL_VERSION = "draft-outlook-v2";

type DraftValueMode = "redraft" | "best-ball";
type DraftValueConfidence = "early" | "developing" | "settled";
type DraftValueBaselineSource = "adp" | "format-rank" | "consensus-rank";
type DraftValueComponentId =
  | "market"
  | "roster"
  | "lineup"
  | "correlation"
  | "byes";

interface DraftValueComponent {
  id: DraftValueComponentId;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

interface DraftSlotContext {
  slot: number;
  teams: number;
  rounds: number;
  draftType: "snake" | "linear";
  firstPick: number;
  minimumTurnGap: number;
  maximumTurnGap: number;
}

interface DraftValueMarketSummary {
  judgedPicks: number;
  adpPicks: number;
  formatRankPicks: number;
  consensusRankPicks: number;
  totalDelta: number;
  averageDelta: number | null;
}

export interface DraftValueReport {
  modelVersion: typeof DRAFT_OUTLOOK_MODEL_VERSION;
  mode: DraftValueMode;
  teamNumber: number;
  picksDrafted: number;
  rosterSize: number;
  compositeScore: number | null;
  roomRank: number | null;
  roomSize: number;
  roomPercentile: number | null;
  roomTieCount: number;
  confidence: DraftValueConfidence;
  slotContext: DraftSlotContext;
  market: DraftValueMarketSummary;
  components: readonly DraftValueComponent[];
}

interface ExpectedReturnInput {
  entryCost: number;
  payoutProbability: number;
  averagePayout: number;
}

interface ExpectedReturnResult {
  grossExpectedReturn: number;
  netExpectedValue: number;
  roi: number | null;
  breakEvenPayoutProbability: number | null;
}

export interface ContestFieldEconomicsInput {
  entryFee: number;
  fieldEntries: number;
  prizePool: number;
}

interface ContestFieldEconomics {
  entryFee: number;
  fieldEntries: number;
  prizePool: number;
  grossExpectedReturn: number;
  netExpectedValue: number;
  roi: number;
  impliedHold: number;
  breakEvenEdge: number;
}

type OutlookPick = Pick<DraftPick, "pickNumber" | "round" | "teamNumber" | "player">;
type PositionCounts = Partial<Record<Position, number>>;
type TargetCounts = Partial<Record<Position, number>>;
type PositionRange = Partial<Record<Position, { minimum: number; maximum: number }>>;
type RedraftRosterPosition = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

interface PickBaseline {
  value: number;
  source: DraftValueBaselineSource;
  confidence: number;
  uncertainty: number | null;
}

interface MutableDraftValueReport extends DraftValueReport {
  compositeScore: number | null;
}

const REDRAFT_COMPONENT_WEIGHTS = Object.freeze({
  market: 0.65,
  roster: 0.2,
  lineup: 0.1,
  byes: 0.05,
});

const BEST_BALL_COMPONENT_WEIGHTS: Readonly<
  Record<BestBallContestPreset["strategyProfileId"], Readonly<Record<"market" | "roster" | "correlation" | "byes", number>>>
> = Object.freeze({
  "standard-tournament": { market: 0.5, roster: 0.3, correlation: 0.15, byes: 0.05 },
  eliminator: { market: 0.45, roster: 0.3, correlation: 0.05, byes: 0.2 },
  "weekly-winners": { market: 0.45, roster: 0.3, correlation: 0.2, byes: 0.05 },
  cumulative: { market: 0.55, roster: 0.3, correlation: 0.1, byes: 0.05 },
  superflex: { market: 0.55, roster: 0.3, correlation: 0.1, byes: 0.05 },
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundedScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function adpQuality(player: Player): Pick<PickBaseline, "confidence" | "uncertainty"> {
  const hasPublishedUncertainty =
    isFiniteNumber(player.adpStandardDeviation) ||
    (isFiniteNumber(player.adpHigh) && isFiniteNumber(player.adpLow));
  const uncertainty = hasPublishedUncertainty ? getAdpSignalThreshold(player) : null;
  const sampleConfidence = hasReliableAdpSample(player) ? 1 : 0.25;
  const uncertaintyConfidence = uncertainty === null
    ? 1
    : clamp(ADP_SIGNAL_THRESHOLD / uncertainty, 0.25, 1);

  return {
    confidence: sampleConfidence * uncertaintyConfidence,
    uncertainty,
  };
}

function baselineForPlayer(
  player: Player,
  mode: DraftValueMode,
  useSuperflexRank: boolean,
  useAdp: boolean,
  draft: { rounds: number; teams: number }
): PickBaseline | null {
  if (useSuperflexRank) {
    // A format rank is a board position, the same way a consensus rank is, so it
    // only stands in for a pick number while the board still overlaps the draft.
    // The superflex board runs past 800 while a 12-team 18-round room ends at 216,
    // and pricing those deep ranks read ordinary late upside picks as maximally
    // bad ones. The cutoff is the draft's own size rather than the redraft ECR
    // constant, which would leave every round 13+ pick unscored.
    const deepestPick = draft.rounds * draft.teams;
    return isFiniteNumber(player.superflexRank) && player.superflexRank <= deepestPick
      ? {
          value: player.superflexRank,
          source: "format-rank",
          confidence: 0.9,
          uncertainty: null,
        }
      : null;
  }
  // Underdog best-ball ADP uses the final draft slot as a placeholder for players
  // who went undrafted. Fantasy Football Calculator redraft ADP comes from completed
  // mocks, where a late value is still a real observed price. Keep the floor rule
  // scoped to best ball so a valid late redraft ADP is never replaced by ECR.
  if (
    !useSuperflexRank &&
    useAdp &&
    isFiniteNumber(player.adp) &&
    (mode === "redraft" || !isUndraftedFloorAdp(player.adp, draft.rounds, draft.teams))
  ) {
    return { value: player.adp, source: "adp", ...adpQuality(player) };
  }
  // A consensus rank is a board position, not a pick number, and the two only agree near
  // the top of the board. Past the cutoff the gap is large enough that the tanh below
  // saturates, which read every deep pick as a maximally bad one.
  const consensus = isFiniteNumber(player.rankEcr)
    ? player.rankEcr
    : isFiniteNumber(player.averageRank)
      ? player.averageRank
      : null;
  if (consensus !== null && consensus <= ECR_BASELINE_MAX_RANK) {
    return {
      value: consensus,
      source: "consensus-rank",
      confidence: 0.75,
      uncertainty: null,
    };
  }
  return null;
}

function marketComponent(
  picks: readonly OutlookPick[],
  mode: DraftValueMode,
  useSuperflexRank: boolean,
  useAdp: boolean,
  weight: number,
  draft: { rounds: number; teams: number }
): {
  component: DraftValueComponent;
  summary: DraftValueMarketSummary;
  evidence: number;
} {
  let weightedSignal = 0;
  let totalConfidence = 0;
  let totalDelta = 0;
  let judgedPicks = 0;
  let adpPicks = 0;
  let formatRankPicks = 0;
  let consensusRankPicks = 0;

  for (const pick of picks) {
    const baseline = baselineForPlayer(pick.player, mode, useSuperflexRank, useAdp, draft);
    if (!baseline) continue;
    const delta = pick.pickNumber - baseline.value;
    const noise = Math.max(
      getReachStealThreshold(pick.round, pick.player),
      baseline.uncertainty ?? 0
    );
    weightedSignal += Math.tanh(delta / noise) * baseline.confidence;
    totalConfidence += baseline.confidence;
    totalDelta += delta;
    judgedPicks += 1;
    if (baseline.source === "adp") adpPicks += 1;
    if (baseline.source === "format-rank") formatRankPicks += 1;
    if (baseline.source === "consensus-rank") consensusRankPicks += 1;
  }

  const averageSignal = totalConfidence > 0 ? weightedSignal / totalConfidence : 0;
  const evidenceReliability = judgedPicks > 0 ? totalConfidence / judgedPicks : 0;
  const score = totalConfidence > 0
    ? roundedScore(50 + averageSignal * 50 * evidenceReliability)
    : 50;
  const averageDelta = judgedPicks > 0 ? totalDelta / judgedPicks : null;
  const sourceParts = [
    adpPicks > 0 ? `${adpPicks} ADP` : null,
    formatRankPicks > 0 ? `${formatRankPicks} format rank` : null,
    consensusRankPicks > 0 ? `${consensusRankPicks} consensus` : null,
  ].filter(Boolean);
  const detail = judgedPicks > 0
    ? `${averageDelta !== null && averageDelta >= 0 ? "+" : ""}${averageDelta?.toFixed(1)} draft slots of value per pick we could price · ${sourceParts.join(" · ")}`
    : "No picks have a usable ADP or format rank yet.";

  return {
    component: { id: "market", label: "Market price", score, weight, detail },
    evidence: totalConfidence,
    summary: {
      judgedPicks,
      adpPicks,
      formatRankPicks,
      consensusRankPicks,
      totalDelta: Math.round(totalDelta),
      averageDelta,
    },
  };
}

function countPositions(picks: readonly OutlookPick[]): PositionCounts {
  const counts: PositionCounts = {};
  for (const pick of picks) {
    const position = pick.player.position;
    if (position === "ALL" || position === "OVERALL" || position === "FLEX") continue;
    counts[position] = (counts[position] ?? 0) + 1;
  }
  return counts;
}

const REDRAFT_ROSTER_POSITIONS: readonly RedraftRosterPosition[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DST",
];

function enumerateRedraftFinalCompositions(
  counts: PositionCounts,
  lineup: RedraftLineupSettings,
  rounds: number
): TargetCounts[] {
  const rosterSize = Math.max(0, Math.floor(rounds));
  const drafted = REDRAFT_ROSTER_POSITIONS.reduce(
    (total, position) => total + (counts[position] ?? 0),
    0
  );
  const remaining = rosterSize - drafted;
  if (remaining < 0) return [];

  const composition = Object.fromEntries(
    REDRAFT_ROSTER_POSITIONS.map((position) => [position, counts[position] ?? 0])
  ) as Record<RedraftRosterPosition, number>;
  const validCompositions: TargetCounts[] = [];

  const coversConfiguredLineup = (): boolean => {
    if (
      composition.QB < lineup.QB ||
      composition.RB < lineup.RB ||
      composition.WR < lineup.WR ||
      composition.TE < lineup.TE ||
      composition.K < lineup.K ||
      composition.DST < lineup.DST
    ) {
      return false;
    }
    const flexEligibleDepth =
      composition.RB - lineup.RB +
      composition.WR - lineup.WR +
      composition.TE - lineup.TE;
    return flexEligibleDepth >= lineup.FLEX;
  };

  const assignRemaining = (positionIndex: number, spotsLeft: number) => {
    const position = REDRAFT_ROSTER_POSITIONS[positionIndex];
    const draftedAtPosition = counts[position] ?? 0;
    if (positionIndex === REDRAFT_ROSTER_POSITIONS.length - 1) {
      composition[position] = draftedAtPosition + spotsLeft;
      if (coversConfiguredLineup()) validCompositions.push({ ...composition });
      composition[position] = draftedAtPosition;
      return;
    }

    for (let additions = 0; additions <= spotsLeft; additions += 1) {
      composition[position] = draftedAtPosition + additions;
      assignRemaining(positionIndex + 1, spotsLeft - additions);
    }
    composition[position] = draftedAtPosition;
  };

  assignRemaining(0, remaining);
  return validCompositions;
}

function rosterShapeScore({
  counts,
  target,
  ranges,
  deferredPositions = [],
  picksDrafted,
  rosterSize,
}: {
  counts: PositionCounts;
  target: TargetCounts;
  ranges?: PositionRange;
  deferredPositions?: readonly Position[];
  picksDrafted: number;
  rosterSize: number;
}): number {
  if (picksDrafted === 0 || rosterSize <= 0) return 50;

  const positions = Object.keys(target) as Position[];
  const deferred = new Set(deferredPositions);
  const deferredTarget = positions.reduce(
    (sum, position) => sum + (deferred.has(position) ? target[position] ?? 0 : 0),
    0
  );
  const earlyRosterSize = Math.max(1, rosterSize - deferredTarget);
  const earlyProgress = clamp(picksDrafted / earlyRosterSize, 0, 1);
  const regularDeviation = positions.reduce((sum, position) => {
    if (deferred.has(position)) return sum;
    const expected = (target[position] ?? 0) * earlyProgress;
    return sum + Math.abs((counts[position] ?? 0) - expected);
  }, 0);
  const expectedDeferred = clamp(picksDrafted - earlyRosterSize, 0, deferredTarget);
  const draftedDeferred = positions.reduce(
    (sum, position) => sum + (deferred.has(position) ? counts[position] ?? 0 : 0),
    0
  );
  const totalDeviation = regularDeviation + Math.abs(draftedDeferred - expectedDeferred);
  const rawFit = 1 - clamp(totalDeviation / (2 * picksDrafted), 0, 1);
  const stageReliability = clamp(picksDrafted / 8, 0, 1);
  let score = 50 + (rawFit * 100 - 50) * stageReliability;

  const remaining = Math.max(0, rosterSize - picksDrafted);
  if (ranges) {
    for (const position of positions) {
      const range = ranges[position];
      if (!range) continue;
      const drafted = counts[position] ?? 0;
      if (drafted > range.maximum) score -= 15 * (drafted - range.maximum);
      if (drafted + remaining < range.minimum) score -= 15 * (range.minimum - drafted - remaining);
    }
  }

  return roundedScore(score);
}

interface WeeklyLineupRequirements {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  SUPERFLEX?: number;
}

function byeLineupCoverageComponent(
  picks: readonly OutlookPick[],
  lineup: WeeklyLineupRequirements,
  finalTargets: TargetCounts,
  weight: number,
  finalCompositions: readonly TargetCounts[] = [finalTargets]
): DraftValueComponent {
  const positions = ["QB", "RB", "WR", "TE"] as const;
  const groups = new Map<number, Partial<Record<(typeof positions)[number], number>>>();
  let knownByePicks = 0;
  for (const pick of picks) {
    const bye = pick.player.byeWeek;
    if (
      !positions.includes(pick.player.position as (typeof positions)[number]) ||
      !Number.isInteger(bye) ||
      Number(bye) < 1
    ) {
      continue;
    }
    knownByePicks += 1;
    const week = Number(bye);
    const group = groups.get(week) ?? {};
    const position = pick.player.position as (typeof positions)[number];
    group[position] = (group[position] ?? 0) + 1;
    groups.set(week, group);
  }

  const maximumWeeklyGap = groups.size === 0
    ? 0
    : Math.min(
        ...finalCompositions.map((composition) => {
          let worstGapForComposition = 0;
          for (const byeCounts of groups.values()) {
            const activeAtTarget = Object.fromEntries(
              positions.map((position) => [
                position,
                Math.max(
                  0,
                  (composition[position] ?? finalTargets[position] ?? lineup[position]) -
                    (byeCounts[position] ?? 0)
                ),
              ])
            ) as Record<(typeof positions)[number], number>;
            const baseGap = positions.reduce(
              (sum, position) =>
                sum + Math.max(0, lineup[position] - activeAtTarget[position]),
              0
            );
            const skillSurplus = (["RB", "WR", "TE"] as const).reduce(
              (sum, position) =>
                sum + Math.max(0, activeAtTarget[position] - lineup[position]),
              0
            );
            const flexFilled = Math.min(lineup.FLEX, skillSurplus);
            const flexGap = lineup.FLEX - flexFilled;
            const skillAfterFlex = Math.max(0, skillSurplus - flexFilled);
            const quarterbackSurplus = Math.max(0, activeAtTarget.QB - lineup.QB);
            const superflexGap = Math.max(
              0,
              (lineup.SUPERFLEX ?? 0) - skillAfterFlex - quarterbackSurplus
            );
            worstGapForComposition = Math.max(
              worstGapForComposition,
              baseGap + flexGap + superflexGap
            );
          }
          return worstGapForComposition;
        })
      );

  const score = roundedScore(50 - Math.min(50, maximumWeeklyGap * 25));
  const detail = knownByePicks === 0
    ? "No drafted player has published bye data yet."
    : maximumWeeklyGap > 0
      ? `${maximumWeeklyGap} starting slot${maximumWeeklyGap === 1 ? "" : "s"} could be uncovered in the best single final composition across every published bye. Bye data is known for ${knownByePicks} of ${picks.length} picks.`
      : `At least one final composition covers every published bye. Bye data is known for ${knownByePicks} of ${picks.length} picks.`;
  return { id: "byes", label: "Bye-week lineup", score, weight, detail };
}

function unattainableRedraftByeCoverageComponent(
  picksDrafted: number,
  rosterSize: number,
  weight: number
): DraftValueComponent {
  return {
    id: "byes",
    label: "Bye-week lineup",
    score: 0,
    weight,
    detail: `No attainable ${rosterSize}-player finish can cover the configured starting lineup after these ${picksDrafted} picks, so bye-week coverage cannot be made safe.`,
  };
}

function redraftLineupComponent(
  counts: PositionCounts,
  picksDrafted: number,
  rosterSize: number,
  weight: number,
  lineup: RedraftLineupSettings
): DraftValueComponent {
  const qb = Math.min(counts.QB ?? 0, lineup.QB);
  const rb = Math.min(counts.RB ?? 0, lineup.RB);
  const wr = Math.min(counts.WR ?? 0, lineup.WR);
  const te = Math.min(counts.TE ?? 0, lineup.TE);
  const flexPool =
    Math.max(0, (counts.RB ?? 0) - lineup.RB) +
    Math.max(0, (counts.WR ?? 0) - lineup.WR) +
    Math.max(0, (counts.TE ?? 0) - lineup.TE);
  const skillFilled = qb + rb + wr + te + Math.min(lineup.FLEX, flexPool);
  const deferredSlots = lineup.K + lineup.DST;
  const deferredDue = clamp(
    picksDrafted - Math.max(0, rosterSize - deferredSlots),
    0,
    deferredSlots
  );
  const deferredFilled = Math.min(
    deferredDue,
    Math.min(counts.K ?? 0, lineup.K) + Math.min(counts.DST ?? 0, lineup.DST)
  );
  const filled = skillFilled + deferredFilled;
  const starterSlots = Object.values(lineup).reduce((sum, slots) => sum + slots, 0);
  const skillStarterSlots = starterSlots - deferredSlots;
  const expected = Math.min(skillStarterSlots, picksDrafted) + deferredDue;
  const score = expected > 0 ? roundedScore((filled / expected) * 100) : 50;
  return {
    id: "lineup",
    label: "Lineup coverage",
    score,
    weight,
    detail: deferredSlots > 0
      ? `${filled} of ${expected} starting slots currently due are covered. Kicker and defense phase into the final ${deferredSlots} pick${deferredSlots === 1 ? "" : "s"}.`
      : `${filled} of ${starterSlots} configured starting slots covered.`,
  };
}

function bestBallCorrelationComponent(
  picks: readonly BestBallDraftPick[],
  analysis: BestBallRosterAnalysis,
  preset: BestBallContestPreset,
  weight: number,
): DraftValueComponent {
  const profile = getStrategyProfile(preset);
  const quarterbacks = picks.filter((pick) => pick.player.position === "QB");
  const stackedQuarterbackIds = new Set(
    analysis.stacks.flatMap((stack) => stack.quarterbacks.map((player) => player.id))
  );
  const stackedShare = quarterbacks.length > 0
    ? stackedQuarterbackIds.size / quarterbacks.length
    : null;
  const extraPassCatchers = analysis.stacks.reduce(
    (sum, stack) => sum + Math.max(0, stack.passCatchers.length - 1),
    0
  );
  const concentrationPenalty = analysis.concentrations.reduce(
    (sum, concentration) =>
      sum + Math.max(0, concentration.count - profile.concentrationFloor) * 5,
    0
  );
  const completedWeek17GameStacks = analysis.week17Pairs.filter((pair) =>
    pair.teams.some((team) => {
      const teamPlayers = pair.playersByTeam[team] ?? [];
      const opponent = pair.teams.find((candidate) => candidate !== team);
      const opponentPlayers = opponent ? pair.playersByTeam[opponent] ?? [] : [];
      return (
        teamPlayers.some((player) => player.position === "QB") &&
        teamPlayers.some((player) => player.position === "WR" || player.position === "TE") &&
        opponentPlayers.some((player) => ["RB", "WR", "TE"].includes(player.position))
      );
    })
  ).length;
  let rawScore = stackedShare === null ? 50 : 30 + stackedShare * 60;
  rawScore += Math.min(10, extraPassCatchers * 5);
  if (preset.strategyProfileId === "standard-tournament") {
    rawScore += Math.min(4, completedWeek17GameStacks * 2);
  }
  rawScore -= concentrationPenalty;
  const reliability = Math.min(1, picks.length / 10);
  const score = roundedScore(50 + (clamp(rawScore, 0, 100) - 50) * reliability);
  const usesWeek17Pairs = preset.strategyProfileId === "standard-tournament";
  const detail = quarterbacks.length === 0
    ? "Correlation stays neutral until the roster has a quarterback."
    : usesWeek17Pairs
      ? `${analysis.stacks.length} QB stack${analysis.stacks.length === 1 ? "" : "s"} · ${completedWeek17GameStacks} completed Week 17 game stack${completedWeek17GameStacks === 1 ? "" : "s"}`
      : `${analysis.stacks.length} QB stack${analysis.stacks.length === 1 ? "" : "s"} · Week 17 pairs are not scored for this contest`;
  return { id: "correlation", label: "Correlation", score, weight, detail };
}

function weightedComposite(components: readonly DraftValueComponent[]): number {
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  if (totalWeight <= 0) return 50;
  return components.reduce(
    (sum, component) => sum + component.score * component.weight,
    0
  ) / totalWeight;
}

export function getDraftSlotContext({
  slot,
  teams,
  rounds,
  draftType,
}: {
  slot: number;
  teams: number;
  rounds: number;
  draftType: "snake" | "linear";
}): DraftSlotContext {
  const normalizedTeams = Math.max(1, Math.floor(teams));
  const normalizedRounds = Math.max(1, Math.floor(rounds));
  const normalizedSlot = clamp(Math.floor(slot), 1, normalizedTeams);
  const picks = Array.from({ length: normalizedRounds }, (_, index) => {
    const round = index + 1;
    if (draftType === "linear" || round % 2 === 1) {
      return index * normalizedTeams + normalizedSlot;
    }
    return round * normalizedTeams - normalizedSlot + 1;
  });
  const gaps = picks.slice(1).map((pick, index) => pick - picks[index]);
  return {
    slot: normalizedSlot,
    teams: normalizedTeams,
    rounds: normalizedRounds,
    draftType,
    firstPick: picks[0],
    minimumTurnGap: gaps.length > 0 ? Math.min(...gaps) : 0,
    maximumTurnGap: gaps.length > 0 ? Math.max(...gaps) : 0,
  };
}

/**
 * Fewest picks a team needs before its room rank is worth showing. Below this,
 * the composite score is one or two picks of noise and the rank it produces
 * ("3 of 3" after three picks) reads as a verdict it has not earned. Four is the
 * same boundary `confidenceFor` already uses to stop calling a read "early".
 */
export const ROOM_RANK_MIN_PICKS = 4;

function confidenceFor(picksDrafted: number, rosterSize: number, judgedPicks: number): DraftValueConfidence {
  const coverage = picksDrafted > 0 ? judgedPicks / picksDrafted : 0;
  if (picksDrafted < ROOM_RANK_MIN_PICKS || coverage < 0.5) return "early";
  if (picksDrafted < rosterSize * 0.7) return "developing";
  return "settled";
}

function addRoomRanks(reports: MutableDraftValueReport[]): DraftValueReport[] {
  const ranked = reports.filter(
    (report): report is MutableDraftValueReport & { compositeScore: number } =>
      report.compositeScore !== null
  );
  for (const report of reports) {
    const score = report.compositeScore;
    if (score === null) continue;
    const sameProgress = ranked.filter(
      (entry) => entry.picksDrafted === report.picksDrafted
    );
    const epsilon = 0.000001;
    const better = sameProgress.filter(
      (entry) => entry.compositeScore - score > epsilon
    ).length;
    const tied = sameProgress.filter(
      (entry) => Math.abs(entry.compositeScore - score) <= epsilon
    ).length;
    const midRank = better + (tied - 1) / 2;
    report.roomRank = midRank + 1;
    report.roomSize = sameProgress.length;
    report.roomTieCount = tied;
    report.roomPercentile = sameProgress.length > 1
      ? Math.round((1 - midRank / (sameProgress.length - 1)) * 100)
      : 50;
  }
  return reports;
}

export function calculateRedraftDraftValues(
  picks: readonly DraftPick[],
  settings: Pick<
    DraftSettings,
    "totalTeams" | "userTeam" | "rounds" | "draftType" | "lineup"
  >
): DraftValueReport[] {
  const lineup = normalizeRedraftLineup(settings.lineup);
  const target = getRedraftRosterTarget(lineup, settings.rounds);
  const reports: MutableDraftValueReport[] = Array.from(
    { length: settings.totalTeams },
    (_, index) => {
      const teamNumber = index + 1;
      const teamPicks = picks.filter((pick) => pick.teamNumber === teamNumber);
      const counts = countPositions(teamPicks);
      const market = marketComponent(
        teamPicks,
        "redraft",
        false,
        true,
        REDRAFT_COMPONENT_WEIGHTS.market,
        {
          rounds: settings.rounds,
          teams: settings.totalTeams,
        }
      );
      const rosterScore = rosterShapeScore({
        counts,
        target,
        deferredPositions: ["K", "DST"],
        picksDrafted: teamPicks.length,
        rosterSize: settings.rounds,
      });
      const finalCompositions = enumerateRedraftFinalCompositions(
        counts,
        lineup,
        settings.rounds
      );
      const components: DraftValueComponent[] = [
        market.component,
        {
          id: "roster",
          label: "Roster shape",
          score: rosterScore,
          weight: REDRAFT_COMPONENT_WEIGHTS.roster,
          detail: `Targets ${target.QB} QB, ${target.RB} RB, ${target.WR} WR, ${target.TE} TE, ${target.K} K, and ${target.DST} DST from a ${redraftLineupSummary(lineup)} starting lineup across ${settings.rounds} rounds.`,
        },
        redraftLineupComponent(
          counts,
          teamPicks.length,
          settings.rounds,
          REDRAFT_COMPONENT_WEIGHTS.lineup,
          lineup
        ),
        finalCompositions.length > 0
          ? byeLineupCoverageComponent(
              teamPicks,
              lineup,
              target,
              REDRAFT_COMPONENT_WEIGHTS.byes,
              finalCompositions
            )
          : unattainableRedraftByeCoverageComponent(
              teamPicks.length,
              settings.rounds,
              REDRAFT_COMPONENT_WEIGHTS.byes
            ),
      ];
      return {
        modelVersion: DRAFT_OUTLOOK_MODEL_VERSION,
        mode: "redraft",
        teamNumber,
        picksDrafted: teamPicks.length,
        rosterSize: settings.rounds,
        compositeScore: teamPicks.length > 0 ? weightedComposite(components) : null,
        roomRank: null,
        roomSize: 0,
        roomPercentile: null,
        roomTieCount: 0,
        confidence: confidenceFor(teamPicks.length, settings.rounds, market.evidence),
        slotContext: getDraftSlotContext({
          slot: teamNumber,
          teams: settings.totalTeams,
          rounds: settings.rounds,
          draftType: settings.draftType,
        }),
        market: market.summary,
        components,
      };
    }
  );
  return addRoomRanks(reports);
}

export function calculateBestBallDraftValues({
  picks,
  contestId,
  week17Opponents = {},
}: {
  picks: readonly BestBallDraftPick[];
  contestId: BestBallContestId;
  week17Opponents?: Readonly<Record<string, string>>;
}): DraftValueReport[] {
  const preset = getContestPreset(contestId);
  const weights = BEST_BALL_COMPONENT_WEIGHTS[preset.strategyProfileId];
  const useSuperflexRank = preset.lineupVariant === "superflex";
  const reports: MutableDraftValueReport[] = Array.from({ length: preset.teams }, (_, index) => {
    const teamNumber = index + 1;
    const teamPicks = picks.filter((pick) => pick.teamNumber === teamNumber);
    const analysis = analyzeBestBallRoster(teamPicks, week17Opponents, contestId);
    const counts = analysis.targets.counts;
    // The adaptive targets widen their own bounds to whatever is already drafted,
    // so using them here meant the out-of-range penalty could never fire; a six-QB
    // build still scored 67. The contest's fixed search space is the real bound.
    const searchSpace = getRosterSearchSpace(contestId);
    const ranges = Object.fromEntries(
      (Object.keys(analysis.targets.targets) as BestBallPosition[]).map((position) => [
        position,
        {
          minimum: searchSpace[position].minimum,
          maximum: searchSpace[position].maximum,
        },
      ])
    ) as PositionRange;
    const market = marketComponent(
      teamPicks,
      "best-ball",
      useSuperflexRank,
      hasSupportedBestBallAdp(preset),
      weights.market,
      {
        rounds: preset.rounds,
        teams: preset.teams,
      }
    );
    const rosterScore = rosterShapeScore({
      counts,
      target: analysis.targets.recommended,
      ranges,
      picksDrafted: teamPicks.length,
      rosterSize: preset.rosterSize,
    });
    const components: DraftValueComponent[] = [
      market.component,
      {
        id: "roster",
        label: "Roster shape",
        score: rosterScore,
        weight: weights.roster,
        detail: `Current target ${analysis.targets.recommended.QB} QB · ${analysis.targets.recommended.RB} RB · ${analysis.targets.recommended.WR} WR · ${analysis.targets.recommended.TE} TE`,
      },
      bestBallCorrelationComponent(teamPicks, analysis, preset, weights.correlation),
      byeLineupCoverageComponent(
        teamPicks,
        preset.lineup,
        analysis.targets.recommended,
        weights.byes,
        analysis.targets.validCompositions.length > 0
          ? analysis.targets.validCompositions
          : [analysis.targets.recommended]
      ),
    ];
    return {
      modelVersion: DRAFT_OUTLOOK_MODEL_VERSION,
      mode: "best-ball",
      teamNumber,
      picksDrafted: teamPicks.length,
      rosterSize: preset.rosterSize,
      compositeScore: teamPicks.length > 0 ? weightedComposite(components) : null,
      roomRank: null,
      roomSize: 0,
      roomPercentile: null,
      roomTieCount: 0,
      confidence: confidenceFor(teamPicks.length, preset.rosterSize, market.evidence),
      slotContext: getDraftSlotContext({
        slot: teamNumber,
        teams: preset.teams,
        rounds: preset.rounds,
        draftType: "snake",
      }),
      market: market.summary,
      components,
    };
  });
  return addRoomRanks(reports);
}

export function calculateExpectedReturn(input: ExpectedReturnInput): ExpectedReturnResult | null {
  const { entryCost, payoutProbability, averagePayout } = input;
  if (
    !isFiniteNumber(entryCost) ||
    !isFiniteNumber(payoutProbability) ||
    !isFiniteNumber(averagePayout) ||
    entryCost < 0 ||
    payoutProbability < 0 ||
    payoutProbability > 1 ||
    averagePayout < 0
  ) {
    return null;
  }
  const grossExpectedReturn = payoutProbability * averagePayout;
  const netExpectedValue = grossExpectedReturn - entryCost;
  return {
    grossExpectedReturn,
    netExpectedValue,
    roi: entryCost > 0 ? netExpectedValue / entryCost : null,
    breakEvenPayoutProbability: averagePayout > 0 ? entryCost / averagePayout : null,
  };
}

export function calculateContestFieldEconomics(
  input: ContestFieldEconomicsInput
): ContestFieldEconomics | null {
  const { entryFee, fieldEntries, prizePool } = input;
  if (
    !isFiniteNumber(entryFee) ||
    !isFiniteNumber(fieldEntries) ||
    !isFiniteNumber(prizePool) ||
    entryFee <= 0 ||
    fieldEntries <= 0 ||
    prizePool < 0
  ) {
    return null;
  }
  const grossExpectedReturn = prizePool / fieldEntries;
  const netExpectedValue = grossExpectedReturn - entryFee;
  const roi = netExpectedValue / entryFee;
  return {
    entryFee,
    fieldEntries,
    prizePool,
    grossExpectedReturn,
    netExpectedValue,
    roi,
    impliedHold: -roi,
    breakEvenEdge: grossExpectedReturn > 0 ? entryFee / grossExpectedReturn - 1 : Number.POSITIVE_INFINITY,
  };
}
