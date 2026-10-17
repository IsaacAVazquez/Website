import type {
  FantasyRouteScoring,
  FantasySnapshot,
} from "@/lib/fantasy";
import { routeScoringToScoringFormat } from "@/lib/fantasy";
import {
  getFantasyAdpFreshness,
  getNflRegularSeasonWeek,
  getSnapshotStaleness,
  type FantasySnapshotStaleness,
} from "@/lib/fantasyUtils";
import {
  countRedraftStartingSlots,
  getRedraftRosterTarget,
  normalizeRedraftLineup,
} from "@/lib/redraftLineup";
import {
  blendFantasyReplacementValues as blendValues,
  buildFantasyReplacementCutoffs as buildSourceCutoffs,
  calculateFantasyReplacementSourceValue as calculateSourceValue,
  getFantasyReplacementExpertRank as getExpertRank,
  getFantasyReplacementMarketReliability,
  hasReliableFantasyReplacementMarket as isReliableMarketPlayer,
  isFantasyReplacementPosition as isTradePosition,
  isFinitePositiveReplacementValue as isFinitePositive,
  type FantasyReplacementCutoffs as SourceCutoffs,
  type FantasyReplacementPosition as TradePosition,
} from "@/lib/fantasyReplacement";
import { MIN_GAME_LOG_GAMES } from "@/lib/fantasyGameLogSource";
import type { FantasyWeeklyBoardSource, FantasyWeeklyPlayer } from "@/lib/fantasyWeeklySnapshot";
import type { Player, RedraftLineupSettings } from "@/types";

export const FANTASY_TRADE_MODEL_VERSION = "preseason-redraft-v1";
export const FANTASY_TRADE_IN_SEASON_MODEL_VERSION = "in-season-redraft-v1";
export type FantasyTradeBasis = "preseason" | "in-season";

/**
 * The rest-of-season board moves when any of its five experts updates. It was
 * three days old on 2026-09-27 and same-day on 2026-10-15, so it gets a weekly
 * clock rather than the daily one the draft boards run on.
 */
const REST_OF_SEASON_AGING_DAYS = 5;
const REST_OF_SEASON_STALE_DAYS = 8;
/** A scoring log more than this many weeks behind the calendar has stopped updating. */
const PRODUCTION_MAX_WEEKS_BEHIND = 2;
/** Games at which the scoring leg counts in full beside the experts. Five games reads one half. */
const PRODUCTION_FULL_WEIGHT_GAMES = 10;
const PRODUCTION_MIN_RELIABILITY = 0.25;
export const FANTASY_TRADE_BALANCED_THRESHOLD = 0.05;
export const FANTASY_TRADE_CLEAR_EDGE_THRESHOLD = 0.15;
/**
 * From Week 1 the market leg still prices whatever mock-draft window the
 * provider keeps publishing, which is a draft price and not an in-season trade
 * value. The warning caps coverage at limited, so a running in-season estimate
 * can say balanced or leaning and never a clear edge. Withholding stays a
 * freshness fact: it happens when the feed stops, not when the calendar turns.
 */
export const FANTASY_TRADE_IN_SEASON_WARNING =
  "The season is under way, so this prices what these players would cost in a draft this week rather than what they are worth in an in-season trade.";

const SUPPORTED_TEAM_COUNTS = new Set([8, 10, 12, 14, 16]);
const SUPPORTED_ROSTER_SIZES = new Set([13, 14, 15, 16, 17, 18]);

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

export interface FantasyTradeRestOfSeasonInput {
  players: readonly FantasyWeeklyPlayer[];
  source: FantasyWeeklyBoardSource;
}

export interface FantasyTradeEvaluationInput {
  snapshot: FantasySnapshot;
  league: FantasyTradeLeagueSettings;
  sideA: FantasyTradeSideInput;
  sideB: FantasyTradeSideInput;
  /**
   * The rest-of-season board. When it is passed the calculator prices the
   * rest of the season: the expert leg is this board and the second leg is
   * this season's scoring, in place of the frozen draft board and its ADP.
   */
  restOfSeason?: FantasyTradeRestOfSeasonInput;
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
  /**
   * The market leg's rank: mock-draft ADP on the preseason basis, this season's
   * points-over-replacement rank in season. Null when the leg has no reading.
   */
  marketRank: number | null;
  expertValue: number | null;
  marketValue: number | null;
  blendedValue: number | null;
  range: FantasyTradeValueRange | null;
  coverage: FantasyTradeCoverage;
  marketReliability: number | null;
  /** In season, the scoring behind the second leg. Null before the season and for a player without one. */
  production: { pointsPerGame: number; games: number } | null;
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
    /** How many experts the in-season board averages. Null for the draft board, which the snapshot does not count. */
    expertCount: number | null;
  };
  market: {
    provider: string | null;
    asOf: string | null;
    freshness: FantasySnapshotStaleness;
    usable: boolean;
  };
}

export interface FantasyTradeEvaluation {
  modelVersion: typeof FANTASY_TRADE_MODEL_VERSION | typeof FANTASY_TRADE_IN_SEASON_MODEL_VERSION;
  basis: FantasyTradeBasis;
  scope: "preseason-one-qb-redraft" | "in-season-one-qb-redraft";
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

interface InternalPlayerEvaluation extends FantasyTradePlayerEvaluation {
  rawExpertValue: number | null;
  rawMarketValue: number | null;
  rawBlendedValue: number | null;
  rawRange: FantasyTradeValueRange | null;
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

/**
 * The second source beside the experts. Before the season it is mock-draft
 * ADP. In season it is this season's scoring, ranked by points per game above
 * each position's replacement level, so both legs speak in overall ranks and
 * the same replacement curve values either one.
 */
interface MarketLeg {
  /** The player's rank on this source, or null when it has no usable reading. */
  rank(player: Player): number | null;
  /** The uncertainty around that rank, in ranks. */
  spread(player: Player): number | null;
  reliability(player: Player): number | null;
  missingWarning(player: Player): string;
  production(player: Player): FantasyTradePlayerEvaluation["production"];
  /** What the warnings call the board and the source, "ADP board" and "ADP source" before the season. */
  boardLabel: string;
  sourceLabel: string;
}

function draftMarketLeg(marketUsable: boolean): MarketLeg {
  return {
    rank: (player) =>
      marketUsable && isReliableMarketPlayer(player) ? (player.adp as number) : null,
    spread: marketSpread,
    reliability: getFantasyReplacementMarketReliability,
    missingWarning: () =>
      marketUsable
        ? "This player has no ADP sample with at least 20 selections."
        : "Current market ADP is unavailable for this player.",
    production: () => null,
    boardLabel: "ADP board",
    sourceLabel: "ADP source",
  };
}

function hasCurrentScoring(player: Player, season: number, seasonWeek: number): boolean {
  const log = player.gameLog;
  return Boolean(
    log &&
      log.season === season &&
      log.games >= MIN_GAME_LOG_GAMES &&
      Number.isFinite(log.average) &&
      (log.throughWeek === undefined || seasonWeek - log.throughWeek <= PRODUCTION_MAX_WEEKS_BEHIND)
  );
}

/**
 * The last week any player on the board has current scoring through, or 0 when
 * none does. The page header and the engine's source summary both read it, so
 * they cannot disagree about whether the scoring leg is live.
 */
export function getScoringThroughWeek(board: readonly Player[], season: number, seasonWeek: number): number {
  return Math.max(
    0,
    ...board.map((player) =>
      hasCurrentScoring(player, season, seasonWeek) ? player.gameLog?.throughWeek ?? 0 : 0
    )
  );
}

/**
 * Ranks every player with this season's scoring by points per game above his
 * position's replacement level, which is the points per game of the last
 * dedicated starter at that position across the league. It is the draft
 * board's VORP idea read off games already played. The spread re-ranks the
 * player at his points per game plus and minus a quarter of his best-to-worst
 * game, the same quarter-of-the-range rule the expert spread falls back on.
 */
function productionMarketLeg(
  board: readonly Player[],
  league: FantasyTradeLeagueSettings,
  season: number,
  seasonWeek: number
): MarketLeg {
  const eligible = board.filter(
    (player) => isTradePosition(player.position) && hasCurrentScoring(player, season, seasonWeek)
  );
  const replacement = new Map<string, number>();
  for (const position of ["QB", "RB", "WR", "TE", "K", "DST"] as const) {
    const needed = league.teams * league.lineup[position];
    const ppg = eligible
      .filter((player) => player.position === position)
      .map((player) => player.gameLog!.average)
      .sort((left, right) => right - left);
    if (needed > 0 && ppg.length > 0) replacement.set(position, ppg[Math.min(needed, ppg.length) - 1]);
  }
  const scored = eligible
    .filter((player) => replacement.has(player.position))
    .map((player) => ({
      player,
      overReplacement: player.gameLog!.average - (replacement.get(player.position) as number),
    }))
    .sort(
      (left, right) =>
        right.overReplacement - left.overReplacement || left.player.id.localeCompare(right.player.id)
    );
  // scored is sorted descending, so the rank at a value is one past the last entry above it.
  const rankAt = (overReplacement: number) => {
    let low = 0;
    let high = scored.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (scored[mid].overReplacement > overReplacement) low = mid + 1;
      else high = mid;
    }
    return low + 1;
  };
  const byId = new Map(
    scored.map((entry, index) => {
      const log = entry.player.gameLog!;
      const swing = Math.max(0, log.high - log.low) / 4;
      return [
        entry.player.id,
        {
          rank: index + 1,
          spread: (rankAt(entry.overReplacement - swing) - rankAt(entry.overReplacement + swing)) / 2,
          games: log.games,
          pointsPerGame: log.average,
        },
      ] as const;
    })
  );

  return {
    rank: (player) => byId.get(player.id)?.rank ?? null,
    spread: (player) => byId.get(player.id)?.spread ?? null,
    reliability: (player) =>
      Math.min(
        1,
        Math.max(PRODUCTION_MIN_RELIABILITY, (byId.get(player.id)?.games ?? 0) / PRODUCTION_FULL_WEIGHT_GAMES)
      ),
    missingWarning: () =>
      `This player has no ${season} scoring log of at least four games, so the experts price him alone.`,
    production: (player) => {
      const entry = byId.get(player.id);
      return entry ? { pointsPerGame: entry.pointsPerGame, games: entry.games } : null;
    },
    boardLabel: "scoring board",
    sourceLabel: "scoring source",
  };
}

/**
 * The in-season player pool: the rest-of-season board, with each player's
 * bye week and this season's scoring carried over from the redraft snapshot
 * where the two share an id. Nothing preseason rides along, so no ADP, tier,
 * or draft rank can leak into an in-season price. A player the draft board
 * never listed, a waiver pickup most often, is on this board with no scoring
 * log until the draft snapshot's game logs pick him up.
 */
export function buildInSeasonTradeBoard(
  draftBoard: readonly Player[],
  restOfSeason: readonly FantasyWeeklyPlayer[]
): Player[] {
  const draftById = new Map(draftBoard.map((player) => [player.id, player]));
  return restOfSeason.map((row) => {
    const draft = draftById.get(row.id);
    return {
      id: row.id,
      name: row.name,
      team: row.team,
      position: row.position,
      averageRank: row.rank,
      rankEcr: row.rank,
      ...(row.rankAverage !== undefined ? { rankAverage: row.rankAverage } : {}),
      ...(row.standardDeviation !== undefined ? { standardDeviation: row.standardDeviation } : {}),
      ...(row.minRank !== undefined ? { minRank: row.minRank } : {}),
      ...(row.maxRank !== undefined ? { maxRank: row.maxRank } : {}),
      ...(row.positionRank !== undefined ? { positionRank: row.positionRank } : {}),
      ...(draft?.byeWeek !== undefined ? { byeWeek: draft.byeWeek } : {}),
      ...(draft?.gameLog ? { gameLog: draft.gameLog } : {}),
    };
  });
}

/** The rest-of-season board's own clock, a week long rather than the draft boards' two days. */
export function getRestOfSeasonFreshness(asOf: string | null | undefined, now: Date = new Date()): FantasySnapshotStaleness {
  return getSnapshotStaleness(asOf, now, {
    agingDays: REST_OF_SEASON_AGING_DAYS,
    staleDays: REST_OF_SEASON_STALE_DAYS,
  });
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
    marketRank: null,
    expertValue: null,
    marketValue: null,
    blendedValue: null,
    range: null,
    coverage: "insufficient",
    marketReliability: null,
    production: null,
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
  marketLeg,
}: {
  player: Player;
  league: FantasyTradeLeagueSettings;
  expertCutoffs: SourceCutoffs;
  marketCutoffs: SourceCutoffs;
  marketLeg: MarketLeg;
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
    // A position the league does not roster has no market in that league, so
    // this mirrors the dropped-player case: null values and insufficient
    // coverage, which the top-level gate turns into a withheld verdict. The
    // earlier zero-value/"supported" shape slipped through
    // marketCoversEverySelectedPlayer and produced a verdict for a player the
    // model documents as unpriceable.
    return {
      id: player.id,
      name: player.name,
      team: player.team,
      position,
      expertRank: getExpertRank(player),
      marketRank: marketLeg.rank(player) ?? (isFinitePositive(player.adp) ? player.adp : null),
      expertValue: null,
      marketValue: null,
      blendedValue: null,
      range: null,
      coverage: "insufficient",
      marketReliability: null,
      production: marketLeg.production(player),
      replacementCutoffs: cutoffs,
      warnings: [`${position} is not used in this league's roster settings.`],
      rawExpertValue: null,
      rawMarketValue: null,
      rawBlendedValue: null,
      rawRange: null,
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

  const marketRank = marketLeg.rank(player);
  const market = marketRank !== null
    ? calculateSourceValue(marketRank, marketCutoffs[position])
    : null;
  const marketUncertainty = marketRank !== null ? marketLeg.spread(player) : null;
  const marketReliability = market ? marketLeg.reliability(player) : null;

  if (marketRank === null) {
    warnings.push(marketLeg.missingWarning(player));
  } else if (!market) {
    warnings.push(`The ${marketLeg.boardLabel} does not cover a league-specific replacement cutoff for this position.`);
  } else {
    if (market.coverage < 1) {
      warnings.push(`The ${marketLeg.boardLabel} does not cover every replacement cutoff for this position.`);
    }
    if (marketUncertainty === null) {
      warnings.push(`The ${marketLeg.sourceLabel} does not publish a usable spread for this player.`);
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
  const marketLow = market && marketRank !== null && marketUncertainty !== null
    ? calculateSourceValue(
        marketRank + marketUncertainty,
        marketCutoffs[position]
      )?.value ?? rawMarketValue
    : rawMarketValue;
  const marketHigh = market && marketRank !== null && marketUncertainty !== null
    ? calculateSourceValue(
        Math.max(1, marketRank - marketUncertainty),
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
    marketRank: marketRank ?? (isFinitePositive(player.adp) ? player.adp : null),
    expertValue: roundValue(rawExpertValue),
    marketValue: rawMarketValue === null ? null : roundValue(rawMarketValue),
    blendedValue: roundValue(rawBlendedValue),
    range: { low: roundValue(rawRange.low), high: roundValue(rawRange.high) },
    coverage,
    marketReliability:
      marketReliability === null ? null : roundValue(marketReliability),
    production: marketLeg.production(player),
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
  context: Omit<Parameters<typeof evaluatePlayer>[0], "player">,
  boardName: string
): FantasyTradeSideEvaluation {
  const players = playerIds.map((id) => {
    const player = playersById.get(id);
    return player
      ? evaluatePlayer({ player, ...context })
      : unavailablePlayer(id, `Player ${id} is not on the ${boardName}.`);
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
  league: FantasyTradeLeagueSettings,
  board: readonly Player[]
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
  if (board.length === 0) {
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
 * Evaluates two one-QB redraft packages. Unequal packages are quick mode:
 * extra players are assumed to displace replacement-level assets worth zero,
 * so coverage is deliberately limited until roster-aware cuts exist.
 *
 * Before the season the legs are the expert draft board and mock-draft ADP.
 * When a rest-of-season board is passed they are that board and this season's
 * scoring, and a player without a scoring log is priced on the experts alone
 * at limited coverage rather than withheld, since a rookie or a waiver pickup
 * is exactly who an in-season trade is about.
 */
export function evaluateFantasyTrade(
  input: FantasyTradeEvaluationInput
): FantasyTradeEvaluation {
  const now = input.now ?? new Date();
  const inSeason = input.restOfSeason !== undefined;
  const board = input.restOfSeason
    ? buildInSeasonTradeBoard(input.snapshot.overall, input.restOfSeason.players)
    : input.snapshot.overall;
  const seasonWeek = getNflRegularSeasonWeek(input.snapshot.season, now);
  const leagueIssues = validateLeague(input.snapshot, input.league, board);
  const sideIssues = validateSides(input.sideA, input.sideB);
  const warnings = [...leagueIssues, ...sideIssues];

  const expertAsOf = input.restOfSeason?.source.asOf ?? input.snapshot.upstreamUpdatedAt;
  const expertFreshness = inSeason
    ? getRestOfSeasonFreshness(expertAsOf, now)
    : getSnapshotStaleness(expertAsOf, now);

  let marketLeg: MarketLeg;
  let market: FantasyTradeSourceSummary["market"];
  if (inSeason) {
    marketLeg = productionMarketLeg(board, input.league, input.snapshot.season, seasonWeek);
    const throughWeek = getScoringThroughWeek(board, input.snapshot.season, seasonWeek);
    const usable = board.some((player) => marketLeg.rank(player) !== null);
    market = {
      provider: throughWeek > 0
        ? `${input.snapshot.season} scoring through Week ${throughWeek}`
        : `${input.snapshot.season} scoring`,
      asOf: null,
      freshness: throughWeek > 0 ? "fresh" : "stale",
      usable,
    };
    if (!usable) {
      warnings.push(
        `No player has a current ${input.snapshot.season} scoring log yet, so the experts price every player alone.`
      );
    }
  } else {
    const marketAsOf = input.snapshot.adpSource?.asOf ?? null;
    const marketFreshness = getSnapshotStaleness(marketAsOf, now);
    const marketUsable = Boolean(
      input.snapshot.adpSource &&
        getFantasyAdpFreshness(marketAsOf, input.snapshot.season, now) === "current" &&
        marketFreshness !== "stale"
    );
    marketLeg = draftMarketLeg(marketUsable);
    market = {
      provider: input.snapshot.adpSource?.provider ?? null,
      asOf: marketAsOf,
      freshness: marketFreshness,
      usable: marketUsable,
    };
    // Only while the market is still usable. Once the feed stops, the stale
    // warning below is the actual cause of the withheld verdict, and listing the
    // season beside it would read as a second cause.
    if (marketUsable && seasonWeek >= 1) {
      warnings.push(FANTASY_TRADE_IN_SEASON_WARNING);
    }
  }

  const expertBoardName = inSeason ? "rest-of-season expert board" : "expert board";
  if (expertFreshness === "stale") {
    warnings.push(`The ${expertBoardName} is stale, so the calculator cannot issue a trade verdict.`);
  } else if (expertFreshness === "aging") {
    warnings.push(`The ${expertBoardName} is aging, so the result has limited coverage.`);
  }
  if (!inSeason) {
    if (!market.usable) {
      warnings.push(
        "Current market ADP is unavailable, so the calculator cannot issue exact values or a trade verdict."
      );
    } else if (market.freshness === "aging") {
      warnings.push("The market ADP source is aging, so the result has limited coverage.");
    }
  }
  if (input.sideA.playerIds.length !== input.sideB.playerIds.length) {
    warnings.push(
      "Unequal package sizes assume every extra player replaces a replacement-level asset worth zero."
    );
  }

  const expertCutoffs = buildSourceCutoffs(board, input.league, getExpertRank);
  const marketCutoffs = buildSourceCutoffs(board, input.league, (player) => marketLeg.rank(player));
  const playersById = new Map(board.map((player) => [player.id, player]));
  const context = {
    league: input.league,
    expertCutoffs,
    marketCutoffs,
    marketLeg,
  };
  const boardName = inSeason ? "rest-of-season board" : "scoring format's overall board";
  const sideA = evaluateSide(input.sideA.playerIds, playersById, context, boardName);
  const sideB = evaluateSide(input.sideB.playerIds, playersById, context, boardName);
  // Before the season a missing ADP reading withholds the verdict, since the
  // draft market is half of what the tool claims to price. In season the
  // scoring leg is a second opinion, and its absence only limits coverage.
  const marketCoversEverySelectedPlayer =
    inSeason ||
    (market.usable &&
      sideA.marketPlayerCount === input.sideA.playerIds.length &&
      sideB.marketPlayerCount === input.sideB.playerIds.length);

  if (!inSeason && market.usable && !marketCoversEverySelectedPlayer) {
    warnings.push(
      "Every selected player needs a reliable current-market reading before the calculator can issue exact values or a trade verdict."
    );
  }

  let coverage = worseCoverage(sideA.coverage, sideB.coverage);
  if (warnings.length > 0 || expertFreshness === "aging" || market.freshness === "aging") {
    coverage = worseCoverage(coverage, "limited");
  }
  if (
    leagueIssues.length > 0 ||
    sideIssues.length > 0 ||
    expertFreshness === "stale" ||
    !marketCoversEverySelectedPlayer
  ) {
    coverage = "insufficient";
  }

  const verdict = getVerdict(sideA, sideB, coverage);
  return {
    modelVersion: inSeason ? FANTASY_TRADE_IN_SEASON_MODEL_VERSION : FANTASY_TRADE_MODEL_VERSION,
    basis: inSeason ? "in-season" : "preseason",
    scope: inSeason ? "in-season-one-qb-redraft" : "preseason-one-qb-redraft",
    league: input.league,
    coverage,
    ...verdict,
    sideA,
    sideB,
    sources: {
      expert: {
        asOf: expertAsOf,
        freshness: expertFreshness,
        expertCount: input.restOfSeason?.source.expertCount ?? null,
      },
      market,
    },
    warnings,
  };
}
