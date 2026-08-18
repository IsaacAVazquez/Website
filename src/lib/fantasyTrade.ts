import type {
  FantasyRouteScoring,
  FantasySnapshot,
} from "@/lib/fantasy";
import { routeScoringToScoringFormat } from "@/lib/fantasy";
import {
  getAdpSignalThreshold,
  getFantasyAdpFreshness,
  getSnapshotStaleness,
  hasReliableAdpSample,
  type FantasySnapshotStaleness,
} from "@/lib/fantasyUtils";
import {
  countRedraftStartingSlots,
  getRedraftRosterTarget,
  normalizeRedraftLineup,
} from "@/lib/redraftLineup";
import { clamp } from "@/lib/utils";
import type { Player, Position, RedraftLineupSettings } from "@/types";

export const FANTASY_TRADE_MODEL_VERSION = "preseason-redraft-v1";
export const FANTASY_TRADE_BALANCED_THRESHOLD = 0.05;
export const FANTASY_TRADE_CLEAR_EDGE_THRESHOLD = 0.15;

const STARTER_VALUE_WEIGHT = 0.75;
const DEPTH_VALUE_WEIGHT = 0.25;
const MINIMUM_ADP_SELECTIONS = 20;
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;
const FLEX_POSITIONS = ["RB", "WR", "TE"] as const;
const SUPPORTED_TEAM_COUNTS = new Set([8, 10, 12, 14, 16]);
const SUPPORTED_ROSTER_SIZES = new Set([13, 14, 15, 16, 17, 18]);

type TradePosition = Extract<
  Position,
  "QB" | "RB" | "WR" | "TE" | "K" | "DST"
>;

export type FantasyTradeCoverage = "supported" | "limited" | "insufficient";
export type FantasyTradeVerdict =
  | "balanced"
  | "leans-side-a"
  | "leans-side-b"
  | "clear-edge-side-a"
  | "clear-edge-side-b"
  | "insufficient";

export interface FantasyTradeLeagueSettings {
  scoring: FantasyRouteScoring;
  teams: 8 | 10 | 12 | 14 | 16;
  rosterSize: 13 | 14 | 15 | 16 | 17 | 18;
  lineup: RedraftLineupSettings;
}

export interface FantasyTradeSideInput {
  playerIds: readonly string[];
}

export interface FantasyTradeEvaluationInput {
  snapshot: FantasySnapshot;
  league: FantasyTradeLeagueSettings;
  sideA: FantasyTradeSideInput;
  sideB: FantasyTradeSideInput;
  now?: Date;
}

export interface FantasyTradeValueRange {
  low: number;
  high: number;
}

export interface FantasyTradeReplacementCutoffs {
  expertStarter: number | null;
  expertRoster: number | null;
  marketStarter: number | null;
  marketRoster: number | null;
}

export interface FantasyTradePlayerEvaluation {
  id: string;
  name: string;
  team: string;
  position: TradePosition | null;
  expertRank: number | null;
  marketAdp: number | null;
  expertValue: number | null;
  marketValue: number | null;
  blendedValue: number | null;
  range: FantasyTradeValueRange | null;
  coverage: FantasyTradeCoverage;
  marketReliability: number | null;
  replacementCutoffs: FantasyTradeReplacementCutoffs;
  warnings: readonly string[];
}

export interface FantasyTradeSideEvaluation {
  players: readonly FantasyTradePlayerEvaluation[];
  value: number;
  range: FantasyTradeValueRange;
  coverage: FantasyTradeCoverage;
  marketPlayerCount: number;
  valuedPlayerCount: number;
}

export interface FantasyTradeSourceSummary {
  expert: {
    asOf: string | null;
    freshness: FantasySnapshotStaleness;
  };
  market: {
    provider: string | null;
    asOf: string | null;
    freshness: FantasySnapshotStaleness;
    usable: boolean;
  };
}

export interface FantasyTradeEvaluation {
  modelVersion: typeof FANTASY_TRADE_MODEL_VERSION;
  scope: "preseason-one-qb-redraft";
  league: FantasyTradeLeagueSettings;
  coverage: FantasyTradeCoverage;
  verdict: FantasyTradeVerdict;
  winner: "side-a" | "side-b" | null;
  relativeGap: number | null;
  rangesOverlap: boolean | null;
  sideA: FantasyTradeSideEvaluation;
  sideB: FantasyTradeSideEvaluation;
  sources: FantasyTradeSourceSummary;
  warnings: readonly string[];
}

interface PositionCutoff {
  starter: number | null;
  roster: number | null;
}

type SourceCutoffs = Record<TradePosition, PositionCutoff>;

interface SourceValue {
  value: number;
  coverage: number;
}

interface InternalPlayerEvaluation extends FantasyTradePlayerEvaluation {
  rawExpertValue: number | null;
  rawMarketValue: number | null;
  rawBlendedValue: number | null;
  rawRange: FantasyTradeValueRange | null;
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isTradePosition(position: Position): position is TradePosition {
  return POSITIONS.includes(position as TradePosition);
}

function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}

function worseCoverage(
  left: FantasyTradeCoverage,
  right: FantasyTradeCoverage
): FantasyTradeCoverage {
  const severity: Record<FantasyTradeCoverage, number> = {
    supported: 0,
    limited: 1,
    insufficient: 2,
  };
  return severity[left] >= severity[right] ? left : right;
}

/**
 * Converts an ordinal rank into transparent value above a league-specific
 * replacement cutoff. The logarithmic shape creates an elite-player premium
 * without treating adjacent rank gaps as equal units of football production.
 */
export function calculateReplacementRelativeTradeValue(
  rank: number,
  cutoff: number
): number {
  if (!isFinitePositive(rank) || !isFinitePositive(cutoff)) return 0;
  if (rank >= cutoff) return 0;
  if (cutoff <= 1) return rank <= 1 ? 100 : 0;

  return clamp((100 * Math.log(cutoff / rank)) / Math.log(cutoff), 0, 100);
}

function getExpertRank(player: Player): number | null {
  if (isFinitePositive(player.rankEcr)) return player.rankEcr;
  return isFinitePositive(player.averageRank) ? player.averageRank : null;
}

function emptyCutoffs(): SourceCutoffs {
  return Object.fromEntries(
    POSITIONS.map((position) => [position, { starter: null, roster: null }])
  ) as SourceCutoffs;
}

function buildSourceCutoffs(
  players: readonly Player[],
  league: FantasyTradeLeagueSettings,
  rankFor: (player: Player) => number | null
): SourceCutoffs {
  const cutoffs = emptyCutoffs();
  const rankedPlayers = players
    .map((player) => ({ player, rank: rankFor(player) }))
    .filter(
      (entry): entry is { player: Player; rank: number } =>
        entry.rank !== null && isTradePosition(entry.player.position)
    )
    .sort((left, right) => left.rank - right.rank || left.player.id.localeCompare(right.player.id));

  const selectedStarterIds = new Set<string>();
  const starterRanks: Record<TradePosition, number[]> = {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    K: [],
    DST: [],
  };
  const mandatoryComplete: Record<TradePosition, boolean> = {
    QB: true,
    RB: true,
    WR: true,
    TE: true,
    K: true,
    DST: true,
  };

  for (const position of POSITIONS) {
    const required = league.teams * league.lineup[position];
    if (required === 0) continue;
    const candidates = rankedPlayers.filter((entry) => entry.player.position === position);
    if (candidates.length < required) mandatoryComplete[position] = false;
    for (const entry of candidates.slice(0, required)) {
      selectedStarterIds.add(entry.player.id);
      starterRanks[position].push(entry.rank);
    }
  }

  const flexRequired = league.teams * league.lineup.FLEX;
  const flexCandidates = rankedPlayers.filter(
    (entry) =>
      FLEX_POSITIONS.includes(entry.player.position as (typeof FLEX_POSITIONS)[number]) &&
      !selectedStarterIds.has(entry.player.id)
  );
  const flexComplete = flexCandidates.length >= flexRequired;
  for (const entry of flexCandidates.slice(0, flexRequired)) {
    const position = entry.player.position as (typeof FLEX_POSITIONS)[number];
    selectedStarterIds.add(entry.player.id);
    starterRanks[position].push(entry.rank);
  }

  const target = getRedraftRosterTarget(league.lineup, league.rosterSize);
  for (const position of POSITIONS) {
    const starterAffectedByIncompleteFlex =
      flexRequired > 0 &&
      FLEX_POSITIONS.includes(position as (typeof FLEX_POSITIONS)[number]) &&
      !flexComplete;
    if (
      mandatoryComplete[position] &&
      !starterAffectedByIncompleteFlex &&
      starterRanks[position].length > 0
    ) {
      cutoffs[position].starter = Math.max(...starterRanks[position]);
    }

    const rostered = league.teams * target[position];
    if (rostered === 0) continue;
    const candidates = rankedPlayers.filter((entry) => entry.player.position === position);
    if (candidates.length >= rostered) {
      cutoffs[position].roster = candidates[rostered - 1].rank;
    }
  }

  return cutoffs;
}

function calculateSourceValue(rank: number, cutoff: PositionCutoff): SourceValue | null {
  const components: Array<{ weight: number; value: number }> = [];
  if (isFinitePositive(cutoff.starter)) {
    components.push({
      weight: STARTER_VALUE_WEIGHT,
      value: calculateReplacementRelativeTradeValue(rank, cutoff.starter),
    });
  }
  if (isFinitePositive(cutoff.roster)) {
    components.push({
      weight: DEPTH_VALUE_WEIGHT,
      value: calculateReplacementRelativeTradeValue(rank, cutoff.roster),
    });
  }
  if (components.length === 0) return null;

  const coverage = components.reduce((sum, component) => sum + component.weight, 0);
  return {
    value:
      components.reduce(
        (sum, component) => sum + component.value * component.weight,
        0
      ) / coverage,
    coverage,
  };
}

function blendValues(
  expertValue: number,
  marketValue: number | null,
  marketReliability: number | null
): number {
  if (marketValue === null || marketReliability === null) return expertValue;
  return (expertValue + marketValue * marketReliability) / (1 + marketReliability);
}

function expertSpread(player: Player, rank: number): number | null {
  if (typeof player.standardDeviation === "number" && player.standardDeviation >= 0) {
    return player.standardDeviation;
  }
  if (isFinitePositive(player.minRank) && isFinitePositive(player.maxRank)) {
    return Math.max(0, player.maxRank - player.minRank) / 4;
  }
  if (isFinitePositive(player.rankAverage)) {
    return Math.abs(player.rankAverage - rank);
  }
  return null;
}

function marketSpread(player: Player): number | null {
  if (
    typeof player.adpStandardDeviation === "number" &&
    player.adpStandardDeviation >= 0
  ) {
    return player.adpStandardDeviation;
  }
  if (isFinitePositive(player.adpHigh) && isFinitePositive(player.adpLow)) {
    return Math.max(0, player.adpLow - player.adpHigh) / 4;
  }
  return null;
}

function isReliableMarketPlayer(player: Player): boolean {
  return (
    isFinitePositive(player.adp) &&
    typeof player.adpTimesDrafted === "number" &&
    Number.isFinite(player.adpTimesDrafted) &&
    player.adpTimesDrafted >= MINIMUM_ADP_SELECTIONS &&
    hasReliableAdpSample(player)
  );
}

function replacementCutoffSummary(
  position: TradePosition,
  expertCutoffs: SourceCutoffs,
  marketCutoffs: SourceCutoffs
): FantasyTradeReplacementCutoffs {
  return {
    expertStarter: expertCutoffs[position].starter,
    expertRoster: expertCutoffs[position].roster,
    marketStarter: marketCutoffs[position].starter,
    marketRoster: marketCutoffs[position].roster,
  };
}

function unavailablePlayer(id: string, warning: string): InternalPlayerEvaluation {
  return {
    id,
    name: id,
    team: "",
    position: null,
    expertRank: null,
    marketAdp: null,
    expertValue: null,
    marketValue: null,
    blendedValue: null,
    range: null,
    coverage: "insufficient",
    marketReliability: null,
    replacementCutoffs: {
      expertStarter: null,
      expertRoster: null,
      marketStarter: null,
      marketRoster: null,
    },
    warnings: [warning],
    rawExpertValue: null,
    rawMarketValue: null,
    rawBlendedValue: null,
    rawRange: null,
  };
}

function evaluatePlayer({
  player,
  league,
  expertCutoffs,
  marketCutoffs,
  marketUsable,
}: {
  player: Player;
  league: FantasyTradeLeagueSettings;
  expertCutoffs: SourceCutoffs;
  marketCutoffs: SourceCutoffs;
  marketUsable: boolean;
}): InternalPlayerEvaluation {
  if (!isTradePosition(player.position)) {
    return unavailablePlayer(
      player.id,
      `${player.name} does not have a supported redraft roster position.`
    );
  }

  const position = player.position;
  const cutoffs = replacementCutoffSummary(position, expertCutoffs, marketCutoffs);
  const rosterTarget = getRedraftRosterTarget(league.lineup, league.rosterSize);
  if (rosterTarget[position] === 0) {
    return {
      id: player.id,
      name: player.name,
      team: player.team,
      position,
      expertRank: getExpertRank(player),
      marketAdp: isFinitePositive(player.adp) ? player.adp : null,
      expertValue: 0,
      marketValue: 0,
      blendedValue: 0,
      range: { low: 0, high: 0 },
      coverage: "supported",
      marketReliability: null,
      replacementCutoffs: cutoffs,
      warnings: [`${position} is not used in this league's roster settings.`],
      rawExpertValue: 0,
      rawMarketValue: 0,
      rawBlendedValue: 0,
      rawRange: { low: 0, high: 0 },
    };
  }

  const warnings: string[] = [];
  const rank = getExpertRank(player);
  if (rank === null) {
    return unavailablePlayer(
      player.id,
      `${player.name} is not on the scoring format's overall expert board.`
    );
  }

  const expert = calculateSourceValue(rank, expertCutoffs[position]);
  if (!expert) {
    return unavailablePlayer(
      player.id,
      `${player.name} has no complete league-specific expert replacement cutoff.`
    );
  }

  const expertUncertainty = expertSpread(player, rank);
  if (expert.coverage < 1) {
    warnings.push("The expert board does not cover every replacement cutoff for this position.");
  }
  if (expertUncertainty === null) {
    warnings.push("The expert source does not publish a usable spread for this player.");
  }

  const marketEligible = marketUsable && isReliableMarketPlayer(player);
  const market = marketEligible
    ? calculateSourceValue(player.adp as number, marketCutoffs[position])
    : null;
  const marketUncertainty = marketEligible ? marketSpread(player) : null;
  const marketReliability = market
    ? clamp(10 / getAdpSignalThreshold(player), 0.25, 1)
    : null;

  if (!marketUsable) {
    warnings.push("Current market ADP is unavailable for this player.");
  } else if (!isReliableMarketPlayer(player)) {
    warnings.push("This player has no ADP sample with at least 20 selections.");
  } else if (!market) {
    warnings.push("The ADP board does not cover a league-specific replacement cutoff for this position.");
  } else {
    if (market.coverage < 1) {
      warnings.push("The ADP board does not cover every replacement cutoff for this position.");
    }
    if (marketUncertainty === null) {
      warnings.push("The ADP source does not publish a usable spread for this player.");
    }
  }

  const rawExpertValue = expert.value;
  const rawMarketValue = market?.value ?? null;
  const rawBlendedValue = blendValues(
    rawExpertValue,
    rawMarketValue,
    marketReliability
  );

  const expertLow = calculateSourceValue(
    rank + (expertUncertainty ?? 0),
    expertCutoffs[position]
  )?.value ?? rawExpertValue;
  const expertHigh = calculateSourceValue(
    Math.max(1, rank - (expertUncertainty ?? 0)),
    expertCutoffs[position]
  )?.value ?? rawExpertValue;
  const marketLow = market && marketUncertainty !== null
    ? calculateSourceValue(
        (player.adp as number) + marketUncertainty,
        marketCutoffs[position]
      )?.value ?? rawMarketValue
    : rawMarketValue;
  const marketHigh = market && marketUncertainty !== null
    ? calculateSourceValue(
        Math.max(1, (player.adp as number) - marketUncertainty),
        marketCutoffs[position]
      )?.value ?? rawMarketValue
    : rawMarketValue;
  const rawRange = {
    low: blendValues(expertLow, marketLow, marketReliability),
    high: blendValues(expertHigh, marketHigh, marketReliability),
  };

  const coverage: FantasyTradeCoverage =
    expert.coverage === 1 &&
    expertUncertainty !== null &&
    market !== null &&
    market.coverage === 1 &&
    marketUncertainty !== null
      ? "supported"
      : "limited";

  return {
    id: player.id,
    name: player.name,
    team: player.team,
    position,
    expertRank: rank,
    marketAdp: isFinitePositive(player.adp) ? player.adp : null,
    expertValue: roundValue(rawExpertValue),
    marketValue: rawMarketValue === null ? null : roundValue(rawMarketValue),
    blendedValue: roundValue(rawBlendedValue),
    range: { low: roundValue(rawRange.low), high: roundValue(rawRange.high) },
    coverage,
    marketReliability:
      marketReliability === null ? null : roundValue(marketReliability),
    replacementCutoffs: cutoffs,
    warnings,
    rawExpertValue,
    rawMarketValue,
    rawBlendedValue,
    rawRange,
  };
}

function evaluateSide(
  playerIds: readonly string[],
  playersById: ReadonlyMap<string, Player>,
  context: Omit<Parameters<typeof evaluatePlayer>[0], "player">
): FantasyTradeSideEvaluation {
  const players = playerIds.map((id) => {
    const player = playersById.get(id);
    return player
      ? evaluatePlayer({ player, ...context })
      : unavailablePlayer(id, `Player ${id} is not on the scoring format's overall board.`);
  });
  const rawValue = players.reduce(
    (sum, player) => sum + (player.rawBlendedValue ?? 0),
    0
  );
  const rawLow = players.reduce(
    (sum, player) => sum + (player.rawRange?.low ?? 0),
    0
  );
  const rawHigh = players.reduce(
    (sum, player) => sum + (player.rawRange?.high ?? 0),
    0
  );
  const coverage = players.reduce<FantasyTradeCoverage>(
    (current, player) => worseCoverage(current, player.coverage),
    "supported"
  );

  return {
    players: players.map(({ rawExpertValue: _expert, rawMarketValue: _market, rawBlendedValue: _blended, rawRange: _range, ...player }) => player),
    value: roundValue(rawValue),
    range: { low: roundValue(rawLow), high: roundValue(rawHigh) },
    coverage,
    marketPlayerCount: players.filter((player) => player.rawMarketValue !== null).length,
    valuedPlayerCount: players.filter((player) => player.rawBlendedValue !== null).length,
  };
}

function validateLeague(
  snapshot: FantasySnapshot,
  league: FantasyTradeLeagueSettings
): string[] {
  const errors: string[] = [];
  if (!SUPPORTED_TEAM_COUNTS.has(league.teams)) {
    errors.push("The trade model supports 8, 10, 12, 14, or 16 teams.");
  }
  if (!SUPPORTED_ROSTER_SIZES.has(league.rosterSize)) {
    errors.push("The trade model supports roster sizes from 13 through 18.");
  }
  if (snapshot.scoringFormat !== routeScoringToScoringFormat(league.scoring)) {
    errors.push("The selected scoring format does not match the loaded snapshot.");
  }

  const normalized = normalizeRedraftLineup(league.lineup);
  for (const position of ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"] as const) {
    if (normalized[position] !== league.lineup[position]) {
      errors.push("The lineup is outside the supported one-QB redraft bounds.");
      break;
    }
  }
  if (countRedraftStartingSlots(normalized) > league.rosterSize) {
    errors.push("The starting lineup cannot be larger than the roster.");
  }
  if (snapshot.overall.length === 0) {
    errors.push("The scoring snapshot has no overall expert board.");
  }
  return errors;
}

function validateSides(sideA: FantasyTradeSideInput, sideB: FantasyTradeSideInput): string[] {
  const errors: string[] = [];
  if (sideA.playerIds.length === 0 || sideB.playerIds.length === 0) {
    errors.push("Each side of the trade needs at least one player.");
  }
  const allIds = [...sideA.playerIds, ...sideB.playerIds];
  if (new Set(allIds).size !== allIds.length) {
    errors.push("A player can appear only once in a trade.");
  }
  return errors;
}

function rangesOverlap(
  left: FantasyTradeValueRange,
  right: FantasyTradeValueRange
): boolean {
  return left.low <= right.high && right.low <= left.high;
}

function getVerdict(
  sideA: FantasyTradeSideEvaluation,
  sideB: FantasyTradeSideEvaluation,
  coverage: FantasyTradeCoverage
): Pick<FantasyTradeEvaluation, "verdict" | "winner" | "relativeGap" | "rangesOverlap"> {
  if (coverage === "insufficient") {
    return {
      verdict: "insufficient",
      winner: null,
      relativeGap: null,
      rangesOverlap: null,
    };
  }

  const denominator = Math.max(sideA.value, sideB.value);
  const relativeGap = denominator > 0
    ? Math.abs(sideA.value - sideB.value) / denominator
    : 0;
  const overlap = rangesOverlap(sideA.range, sideB.range);
  if (relativeGap <= FANTASY_TRADE_BALANCED_THRESHOLD) {
    return {
      verdict: "balanced",
      winner: null,
      relativeGap: roundValue(relativeGap),
      rangesOverlap: overlap,
    };
  }

  const winner = sideA.value > sideB.value ? "side-a" : "side-b";
  const clear =
    coverage === "supported" &&
    relativeGap >= FANTASY_TRADE_CLEAR_EDGE_THRESHOLD &&
    !overlap;
  return {
    verdict: clear
      ? winner === "side-a"
        ? "clear-edge-side-a"
        : "clear-edge-side-b"
      : winner === "side-a"
        ? "leans-side-a"
        : "leans-side-b",
    winner,
    relativeGap: roundValue(relativeGap),
    rangesOverlap: overlap,
  };
}

/**
 * Evaluates two preseason one-QB redraft packages. Unequal packages are quick
 * mode: extra players are assumed to displace replacement-level assets worth
 * zero, so coverage is deliberately limited until roster-aware cuts exist.
 */
export function evaluateFantasyTrade(
  input: FantasyTradeEvaluationInput
): FantasyTradeEvaluation {
  const now = input.now ?? new Date();
  const expertFreshness = getSnapshotStaleness(
    input.snapshot.upstreamUpdatedAt,
    now
  );
  const marketAsOf = input.snapshot.adpSource?.asOf ?? null;
  const marketFreshness = getSnapshotStaleness(marketAsOf, now);
  const marketUsable = Boolean(
    input.snapshot.adpSource &&
      getFantasyAdpFreshness(marketAsOf, input.snapshot.season, now) === "current" &&
      marketFreshness !== "stale"
  );
  const warnings = [
    ...validateLeague(input.snapshot, input.league),
    ...validateSides(input.sideA, input.sideB),
  ];

  if (expertFreshness === "stale") {
    warnings.push("The expert board is stale, so the calculator cannot issue a trade verdict.");
  } else if (expertFreshness === "aging") {
    warnings.push("The expert board is aging, so the result has limited coverage.");
  }
  if (!marketUsable) {
    warnings.push(
      "Current market ADP is unavailable, so the calculator cannot issue exact values or a trade verdict."
    );
  } else if (marketFreshness === "aging") {
    warnings.push("The market ADP source is aging, so the result has limited coverage.");
  }
  if (input.sideA.playerIds.length !== input.sideB.playerIds.length) {
    warnings.push(
      "Unequal package sizes assume every extra player replaces a replacement-level asset worth zero."
    );
  }

  const reliableMarketPlayers = marketUsable
    ? input.snapshot.overall.filter(isReliableMarketPlayer)
    : [];
  const expertCutoffs = buildSourceCutoffs(
    input.snapshot.overall,
    input.league,
    getExpertRank
  );
  const marketCutoffs = buildSourceCutoffs(
    reliableMarketPlayers,
    input.league,
    (player) => (isFinitePositive(player.adp) ? player.adp : null)
  );
  const playersById = new Map(
    input.snapshot.overall.map((player) => [player.id, player])
  );
  const context = {
    league: input.league,
    expertCutoffs,
    marketCutoffs,
    marketUsable,
  };
  const sideA = evaluateSide(input.sideA.playerIds, playersById, context);
  const sideB = evaluateSide(input.sideB.playerIds, playersById, context);
  const marketCoversEverySelectedPlayer =
    marketUsable &&
    sideA.marketPlayerCount === input.sideA.playerIds.length &&
    sideB.marketPlayerCount === input.sideB.playerIds.length;

  if (marketUsable && !marketCoversEverySelectedPlayer) {
    warnings.push(
      "Every selected player needs a reliable current-market reading before the calculator can issue exact values or a trade verdict."
    );
  }

  let coverage = worseCoverage(sideA.coverage, sideB.coverage);
  if (warnings.length > 0 || expertFreshness === "aging" || marketFreshness === "aging") {
    coverage = worseCoverage(coverage, "limited");
  }
  if (
    validateLeague(input.snapshot, input.league).length > 0 ||
    validateSides(input.sideA, input.sideB).length > 0 ||
    expertFreshness === "stale" ||
    !marketCoversEverySelectedPlayer
  ) {
    coverage = "insufficient";
  }

  const verdict = getVerdict(sideA, sideB, coverage);
  return {
    modelVersion: FANTASY_TRADE_MODEL_VERSION,
    scope: "preseason-one-qb-redraft",
    league: input.league,
    coverage,
    ...verdict,
    sideA,
    sideB,
    sources: {
      expert: {
        asOf: input.snapshot.upstreamUpdatedAt,
        freshness: expertFreshness,
      },
      market: {
        provider: input.snapshot.adpSource?.provider ?? null,
        asOf: marketAsOf,
        freshness: marketFreshness,
        usable: marketUsable,
      },
    },
    warnings,
  };
}
