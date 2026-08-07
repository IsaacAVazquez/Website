import {
  ECR_BASELINE_MAX_RANK,
  ROSTER_STARTER_TARGETS,
  isUndraftedFloorAdp,
  getReachStealThreshold,
} from "@/lib/draftAnalytics";
import {
  analyzeBestBallRoster,
  getContestPreset,
  type BestBallContestId,
  type BestBallContestPreset,
  type BestBallDraftPick,
  type BestBallPosition,
  type BestBallRosterAnalysis,
} from "@/lib/bestBall";
import type { DraftPick, DraftSettings, Player, Position } from "@/types";

/**
 * Draft Outlook v1 is an ordinal draft-process model. It compares teams inside
 * the current room from information available at draft time. It is not a
 * projected-points model, a win probability, or a roster-specific payout EV.
 */
export const DRAFT_OUTLOOK_MODEL_VERSION = "draft-outlook-v1";

export type DraftValueMode = "redraft" | "best-ball";
export type DraftValueConfidence = "early" | "developing" | "settled";
export type DraftValueBaselineSource = "adp" | "format-rank" | "consensus-rank";
export type DraftValueComponentId =
  | "market"
  | "roster"
  | "lineup"
  | "correlation"
  | "byes";

export interface DraftValueComponent {
  id: DraftValueComponentId;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface DraftSlotContext {
  slot: number;
  teams: number;
  rounds: number;
  draftType: "snake" | "linear";
  firstPick: number;
  minimumTurnGap: number;
  maximumTurnGap: number;
}

export interface DraftValueMarketSummary {
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

export interface ExpectedReturnInput {
  entryCost: number;
  payoutProbability: number;
  averagePayout: number;
}

export interface ExpectedReturnResult {
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

export interface ContestFieldEconomics {
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

interface PickBaseline {
  value: number;
  source: DraftValueBaselineSource;
  confidence: number;
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundedScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function baselineForPlayer(
  player: Player,
  useSuperflexRank: boolean,
  draft: { rounds: number; teams: number }
): PickBaseline | null {
  if (useSuperflexRank && isFiniteNumber(player.superflexRank)) {
    return { value: player.superflexRank, source: "format-rank", confidence: 0.9 };
  }
  // An ADP at the undrafted floor is a placeholder, not a price. The board already
  // ignores it, so grading a pick against it would leave the two disagreeing about
  // the same player.
  if (
    !useSuperflexRank &&
    isFiniteNumber(player.adp) &&
    !isUndraftedFloorAdp(player.adp, draft.rounds, draft.teams)
  ) {
    return { value: player.adp, source: "adp", confidence: 1 };
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
    return { value: consensus, source: "consensus-rank", confidence: 0.75 };
  }
  return null;
}

function marketComponent(
  picks: readonly OutlookPick[],
  useSuperflexRank: boolean,
  weight: number,
  draft: { rounds: number; teams: number }
): { component: DraftValueComponent; summary: DraftValueMarketSummary } {
  let weightedSignal = 0;
  let totalConfidence = 0;
  let totalDelta = 0;
  let judgedPicks = 0;
  let adpPicks = 0;
  let formatRankPicks = 0;
  let consensusRankPicks = 0;

  for (const pick of picks) {
    const baseline = baselineForPlayer(pick.player, useSuperflexRank, draft);
    if (!baseline) continue;
    const delta = pick.pickNumber - baseline.value;
    const noise = getReachStealThreshold(pick.round);
    weightedSignal += Math.tanh(delta / noise) * baseline.confidence;
    totalConfidence += baseline.confidence;
    totalDelta += delta;
    judgedPicks += 1;
    if (baseline.source === "adp") adpPicks += 1;
    if (baseline.source === "format-rank") formatRankPicks += 1;
    if (baseline.source === "consensus-rank") consensusRankPicks += 1;
  }

  const averageSignal = totalConfidence > 0 ? weightedSignal / totalConfidence : 0;
  const score = totalConfidence > 0 ? roundedScore(50 + averageSignal * 50) : 50;
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

function rosterShapeScore({
  counts,
  target,
  ranges,
  picksDrafted,
  rosterSize,
}: {
  counts: PositionCounts;
  target: TargetCounts;
  ranges?: PositionRange;
  picksDrafted: number;
  rosterSize: number;
}): number {
  if (picksDrafted === 0 || rosterSize <= 0) return 50;

  const positions = Object.keys(target) as Position[];
  const progress = clamp(picksDrafted / rosterSize, 0, 1);
  const totalDeviation = positions.reduce((sum, position) => {
    const expected = (target[position] ?? 0) * progress;
    return sum + Math.abs((counts[position] ?? 0) - expected);
  }, 0);
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

function samePositionByeComponent(
  picks: readonly OutlookPick[],
  weight: number,
  rosterSize: number
): DraftValueComponent {
  const groups = new Map<string, number>();
  let knownByePicks = 0;
  for (const pick of picks) {
    const bye = pick.player.byeWeek;
    if (!Number.isInteger(bye) || Number(bye) < 1) continue;
    knownByePicks += 1;
    const key = `${pick.player.position}-${bye}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  const conflicts = [...groups.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const coverage = picks.length > 0 ? knownByePicks / picks.length : 0;
  const stageReliability = picks.length > 1
    ? clamp((picks.length - 1) / Math.max(1, rosterSize - 1), 0, 1)
    : 0;
  const score = roundedScore(
    50 + 50 * coverage * stageReliability - Math.min(50, conflicts * 15)
  );
  const detail = knownByePicks === 0
    ? "No drafted player has published bye data yet."
    : `${conflicts} same-position overlap${conflicts === 1 ? "" : "s"} · bye data on ${knownByePicks} of ${picks.length} picks`;
  return { id: "byes", label: "Bye coverage", score, weight, detail };
}

function redraftRosterTarget(rounds: number): TargetCounts {
  const target: Record<"QB" | "RB" | "WR" | "TE" | "K" | "DST", number> = {
    QB: ROSTER_STARTER_TARGETS.QB,
    RB: ROSTER_STARTER_TARGETS.RB,
    WR: ROSTER_STARTER_TARGETS.WR,
    TE: ROSTER_STARTER_TARGETS.TE,
    K: ROSTER_STARTER_TARGETS.K,
    DST: ROSTER_STARTER_TARGETS.DST,
  };
  const depthOrder: readonly (keyof typeof target)[] = ["RB", "WR", "RB", "WR", "QB", "TE", "WR", "RB", "WR", "RB"];
  let remaining = Math.max(0, rounds - Object.values(target).reduce((sum, count) => sum + count, 0));
  let index = 0;
  while (remaining > 0) {
    const position = depthOrder[index % depthOrder.length];
    target[position] += 1;
    remaining -= 1;
    index += 1;
  }
  return target;
}

function redraftLineupComponent(
  counts: PositionCounts,
  picksDrafted: number,
  weight: number
): DraftValueComponent {
  const qb = Math.min(counts.QB ?? 0, 1);
  const rb = Math.min(counts.RB ?? 0, 2);
  const wr = Math.min(counts.WR ?? 0, 2);
  const te = Math.min(counts.TE ?? 0, 1);
  const flexPool =
    Math.max(0, (counts.RB ?? 0) - 2) +
    Math.max(0, (counts.WR ?? 0) - 2) +
    Math.max(0, (counts.TE ?? 0) - 1);
  const filled = qb + rb + wr + te + Math.min(1, flexPool);
  const expected = Math.min(7, picksDrafted);
  const score = expected > 0 ? roundedScore((filled / expected) * 100) : 50;
  return {
    id: "lineup",
    label: "Starting base",
    score,
    weight,
    detail: `${filled} of 7 QB, RB, WR, TE, and flex slots covered. Kicker and defense stay in roster shape.`,
  };
}

function bestBallCorrelationComponent(
  picks: readonly BestBallDraftPick[],
  analysis: BestBallRosterAnalysis,
  preset: BestBallContestPreset,
  weight: number,
): DraftValueComponent {
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
    (sum, concentration) => sum + Math.max(0, concentration.count - 3) * 5,
    0
  );
  let rawScore = stackedShare === null ? 50 : 30 + stackedShare * 60;
  rawScore += Math.min(10, extraPassCatchers * 5);
  if (preset.strategyProfileId === "standard-tournament") {
    rawScore += Math.min(4, analysis.week17Pairs.length * 2);
  }
  rawScore -= concentrationPenalty;
  const reliability = Math.min(1, picks.length / 10);
  const score = roundedScore(50 + (clamp(rawScore, 0, 100) - 50) * reliability);
  const usesWeek17Pairs = preset.strategyProfileId === "standard-tournament";
  const detail = quarterbacks.length === 0
    ? "Correlation stays neutral until the roster has a quarterback."
    : usesWeek17Pairs
      ? `${analysis.stacks.length} QB stack${analysis.stacks.length === 1 ? "" : "s"} · ${analysis.week17Pairs.length} Week 17 opponent pair${analysis.week17Pairs.length === 1 ? "" : "s"}`
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
    report.roomRank = better + 1;
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
  settings: Pick<DraftSettings, "totalTeams" | "userTeam" | "rounds" | "draftType">
): DraftValueReport[] {
  const target = redraftRosterTarget(settings.rounds);
  const reports: MutableDraftValueReport[] = Array.from(
    { length: settings.totalTeams },
    (_, index) => {
      const teamNumber = index + 1;
      const teamPicks = picks.filter((pick) => pick.teamNumber === teamNumber);
      const counts = countPositions(teamPicks);
      const market = marketComponent(teamPicks, false, REDRAFT_COMPONENT_WEIGHTS.market, {
        rounds: settings.rounds,
        teams: settings.totalTeams,
      });
      const rosterScore = rosterShapeScore({
        counts,
        target,
        picksDrafted: teamPicks.length,
        rosterSize: settings.rounds,
      });
      const components: DraftValueComponent[] = [
        market.component,
        {
          id: "roster",
          label: "Roster shape",
          score: rosterScore,
          weight: REDRAFT_COMPONENT_WEIGHTS.roster,
          detail: `Assumes ${target.QB} QB, ${target.RB} RB, ${target.WR} WR, ${target.TE} TE, ${target.K} K, and ${target.DST} DST across ${settings.rounds} rounds.`,
        },
        redraftLineupComponent(counts, teamPicks.length, REDRAFT_COMPONENT_WEIGHTS.lineup),
        samePositionByeComponent(
          teamPicks,
          REDRAFT_COMPONENT_WEIGHTS.byes,
          settings.rounds
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
        confidence: confidenceFor(teamPicks.length, settings.rounds, market.summary.judgedPicks),
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
  const useSuperflexRank = preset.format === "superflex";
  const reports: MutableDraftValueReport[] = Array.from({ length: preset.teams }, (_, index) => {
    const teamNumber = index + 1;
    const teamPicks = picks.filter((pick) => pick.teamNumber === teamNumber);
    const analysis = analyzeBestBallRoster(teamPicks, week17Opponents, contestId);
    const counts = analysis.targets.counts;
    const ranges = Object.fromEntries(
      (Object.keys(analysis.targets.targets) as BestBallPosition[]).map((position) => [
        position,
        {
          minimum: analysis.targets.targets[position].minimum,
          maximum: analysis.targets.targets[position].maximum,
        },
      ])
    ) as PositionRange;
    const market = marketComponent(teamPicks, useSuperflexRank, weights.market, {
      rounds: preset.rounds,
      teams: preset.teams,
    });
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
      samePositionByeComponent(teamPicks, weights.byes, preset.rosterSize),
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
      confidence: confidenceFor(teamPicks.length, preset.rosterSize, market.summary.judgedPicks),
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
