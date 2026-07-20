// ============================================================
// Score pools — browser persistence codec
//
// Pools, scoring rules, standings, submissions, rival picks, and
// manual result overrides live in localStorage (this is a personal
// tool; there is no server account). Everything read back from
// storage passes through a field-level decoder with clamps, so a
// stale or hand-edited payload degrades to defaults instead of
// crashing the page.
// ============================================================

import {
  DEFAULT_FIELD_CONFIG,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_RISK_PARAMS,
  DEFAULT_SCORING_RULES,
  DEFAULT_STANDING,
} from "./defaults";
import type {
  ContextFlags,
  DevigMethod,
  PoolAnalysisConfig,
  Posture,
  Scoreline,
  ScoringBasis,
  ScoringRules,
  StandingContext,
} from "./types";

export const SCORE_POOLS_STORAGE_KEY = "score_pools_store_v1";
export const SCORE_POOLS_STORAGE_VERSION = 1;

export interface StoredSubmission {
  score: Scoreline;
  submittedAt: string;
}

export interface StoredManualResult {
  ninetyMinutes: Scoreline;
  afterExtraTime: Scoreline | null;
  penaltyWinner: "home" | "away" | null;
}

export interface StoredRival {
  id: string;
  name: string;
  /** Points earned before pick tracking started (or manual corrections). */
  pointsAdjustment: number;
  picks: Record<string, Scoreline>;
}

/** Hand-entered odds for one fixture, decimal, overriding the snapshot. */
export interface StoredManualOdds {
  home: number;
  draw: number | null;
  away: number;
  line: number | null;
  over: number | null;
  under: number | null;
  enteredAt: string;
}

export interface StoredPool {
  id: string;
  name: string;
  leagueKey: string;
  rules: ScoringRules;
  standing: StandingContext;
  field: { modalShare: number; chalkShare: number };
  devigMethod: DevigMethod;
  lockOffsetMinutes: number;
  /** IANA timezone for display; null means the browser's. */
  timezone: string | null;
  /** Per-fixture context flags I've set. */
  flags: Record<string, ContextFlags>;
  /** My submitted picks by fixture id. */
  submissions: Record<string, StoredSubmission>;
  /** Result overrides for games no provider covers. */
  manualResults: Record<string, StoredManualResult>;
  /** Hand-entered odds overriding (or standing in for) the snapshot's. */
  manualOdds: Record<string, StoredManualOdds>;
  rivals: StoredRival[];
}

export interface ScorePoolsStore {
  version: number;
  activePoolId: string | null;
  pools: StoredPool[];
}

// ─── Decoding helpers ────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, num));
}

function boundedInt(value: unknown, min: number, max: number, fallback: number): number {
  return Math.round(boundedNumber(value, min, max, fallback));
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function decodeScoreline(value: unknown): Scoreline | undefined {
  if (!isRecord(value)) return undefined;
  const home = value.home;
  const away = value.away;
  if (typeof home !== "number" || typeof away !== "number") return undefined;
  if (!Number.isInteger(home) || !Number.isInteger(away)) return undefined;
  if (home < 0 || away < 0 || home > 15 || away > 15) return undefined;
  return { home, away };
}

function decodeRules(value: unknown): ScoringRules {
  const raw = isRecord(value) ? value : {};
  return {
    exact: boundedNumber(raw.exact, 0, 100, DEFAULT_SCORING_RULES.exact),
    correctDifference: boundedNumber(
      raw.correctDifference,
      0,
      100,
      DEFAULT_SCORING_RULES.correctDifference,
    ),
    correctOutcome: boundedNumber(raw.correctOutcome, 0, 100, DEFAULT_SCORING_RULES.correctOutcome),
    basis: enumValue<ScoringBasis>(
      raw.basis,
      ["ninetyMinutes", "finalResult"],
      DEFAULT_SCORING_RULES.basis,
    ),
    penaltiesCountAsWin: raw.penaltiesCountAsWin === true,
  };
}

function decodeStanding(value: unknown): StandingContext {
  const raw = isRecord(value) ? value : {};
  const nullableNumber = (input: unknown): number | null =>
    typeof input === "number" && Number.isFinite(input)
      ? Math.min(100000, Math.max(-100000, input))
      : null;
  return {
    myPoints: boundedNumber(raw.myPoints, -100000, 100000, DEFAULT_STANDING.myPoints),
    nearestAbovePoints: nullableNumber(raw.nearestAbovePoints),
    nearestBelowPoints: nullableNumber(raw.nearestBelowPoints),
    poolSize: boundedInt(raw.poolSize, 2, 100000, DEFAULT_STANDING.poolSize),
    gamesRemaining: boundedInt(raw.gamesRemaining, 0, 10000, DEFAULT_STANDING.gamesRemaining),
    posture: enumValue<Posture>(
      raw.posture,
      ["auto", "protect", "chase", "neutral"],
      DEFAULT_STANDING.posture,
    ),
  };
}

const FLAG_KEYS = [
  "deadRubber",
  "drawSuitsBoth",
  "mustWinHome",
  "mustWinAway",
  "rotationRiskHome",
  "rotationRiskAway",
] as const;

function decodeFlags(value: unknown): ContextFlags | undefined {
  if (!isRecord(value)) return undefined;
  const flags: ContextFlags = {};
  for (const key of FLAG_KEYS) {
    if (value[key] === true) flags[key] = true;
  }
  return Object.keys(flags).length > 0 ? flags : undefined;
}

function decodeRival(value: unknown): StoredRival | undefined {
  if (!isRecord(value)) return undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  if (!id) return undefined;
  const picks: Record<string, Scoreline> = {};
  if (isRecord(value.picks)) {
    for (const [fixtureId, pick] of Object.entries(value.picks)) {
      const decoded = decodeScoreline(pick);
      if (decoded) picks[fixtureId] = decoded;
    }
  }
  return {
    id,
    name: stringValue(value.name, "Rival"),
    pointsAdjustment: boundedNumber(value.pointsAdjustment, -100000, 100000, 0),
    picks,
  };
}

function decodePool(value: unknown): StoredPool | undefined {
  if (!isRecord(value)) return undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  const leagueKey = typeof value.leagueKey === "string" ? value.leagueKey : undefined;
  if (!id || !leagueKey) return undefined;

  const flags: Record<string, ContextFlags> = {};
  if (isRecord(value.flags)) {
    for (const [fixtureId, raw] of Object.entries(value.flags)) {
      const decoded = decodeFlags(raw);
      if (decoded) flags[fixtureId] = decoded;
    }
  }

  const submissions: Record<string, StoredSubmission> = {};
  if (isRecord(value.submissions)) {
    for (const [fixtureId, raw] of Object.entries(value.submissions)) {
      if (!isRecord(raw)) continue;
      const score = decodeScoreline(raw.score);
      if (!score) continue;
      submissions[fixtureId] = {
        score,
        submittedAt: stringValue(raw.submittedAt, ""),
      };
    }
  }

  const manualResults: Record<string, StoredManualResult> = {};
  if (isRecord(value.manualResults)) {
    for (const [fixtureId, raw] of Object.entries(value.manualResults)) {
      if (!isRecord(raw)) continue;
      const ninety = decodeScoreline(raw.ninetyMinutes);
      if (!ninety) continue;
      manualResults[fixtureId] = {
        ninetyMinutes: ninety,
        afterExtraTime: decodeScoreline(raw.afterExtraTime) ?? null,
        penaltyWinner:
          raw.penaltyWinner === "home" || raw.penaltyWinner === "away"
            ? raw.penaltyWinner
            : null,
      };
    }
  }

  const manualOdds: Record<string, StoredManualOdds> = {};
  if (isRecord(value.manualOdds)) {
    for (const [fixtureId, raw] of Object.entries(value.manualOdds)) {
      if (!isRecord(raw)) continue;
      const price = (input: unknown): number | null =>
        typeof input === "number" && Number.isFinite(input) && input > 1 && input < 1001
          ? input
          : null;
      const home = price(raw.home);
      const away = price(raw.away);
      if (home === null || away === null) continue;
      manualOdds[fixtureId] = {
        home,
        draw: price(raw.draw),
        away,
        line:
          typeof raw.line === "number" && Number.isFinite(raw.line) && raw.line > 0 && raw.line < 30
            ? raw.line
            : null,
        over: price(raw.over),
        under: price(raw.under),
        enteredAt: stringValue(raw.enteredAt, ""),
      };
    }
  }

  const rivals = Array.isArray(value.rivals)
    ? value.rivals.map(decodeRival).filter((rival): rival is StoredRival => rival !== undefined)
    : [];

  return {
    id,
    name: stringValue(value.name, "My pool"),
    leagueKey,
    rules: decodeRules(value.rules),
    standing: decodeStanding(value.standing),
    field: {
      modalShare: boundedNumber(
        isRecord(value.field) ? value.field.modalShare : undefined,
        0.05,
        0.9,
        DEFAULT_FIELD_CONFIG.modalShare,
      ),
      chalkShare: boundedNumber(
        isRecord(value.field) ? value.field.chalkShare : undefined,
        0.1,
        0.95,
        DEFAULT_FIELD_CONFIG.chalkShare,
      ),
    },
    devigMethod: enumValue<DevigMethod>(value.devigMethod, ["proportional", "power"], "proportional"),
    lockOffsetMinutes: boundedInt(value.lockOffsetMinutes, 0, 24 * 60, 60),
    timezone: typeof value.timezone === "string" && value.timezone.length > 0 ? value.timezone : null,
    flags,
    submissions,
    manualResults,
    manualOdds,
    rivals,
  };
}

/** Decode a stored payload; undefined rejects it and selects the fallback. */
export function decodeScorePoolsStore(value: unknown): ScorePoolsStore | undefined {
  if (!isRecord(value)) return undefined;
  if (value.version !== SCORE_POOLS_STORAGE_VERSION) return undefined;
  const pools = Array.isArray(value.pools)
    ? value.pools.map(decodePool).filter((pool): pool is StoredPool => pool !== undefined)
    : [];
  const activePoolId =
    typeof value.activePoolId === "string" &&
    pools.some((pool) => pool.id === value.activePoolId)
      ? value.activePoolId
      : (pools[0]?.id ?? null);
  return { version: SCORE_POOLS_STORAGE_VERSION, activePoolId, pools };
}

// ─── Factories and derived config ────────────────────────────────────────────

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createPool(leagueKey: string, name: string): StoredPool {
  return {
    id: newId("pool"),
    name,
    leagueKey,
    rules: { ...DEFAULT_SCORING_RULES },
    standing: { ...DEFAULT_STANDING },
    field: { ...DEFAULT_FIELD_CONFIG },
    devigMethod: "proportional",
    lockOffsetMinutes: 60,
    timezone: null,
    flags: {},
    submissions: {},
    manualResults: {},
    manualOdds: {},
    rivals: [],
  };
}

export function createRival(name: string): StoredRival {
  return { id: newId("rival"), name, pointsAdjustment: 0, picks: {} };
}

export function emptyScorePoolsStore(): ScorePoolsStore {
  return { version: SCORE_POOLS_STORAGE_VERSION, activePoolId: null, pools: [] };
}

/** The engine config a stored pool implies. Model/risk knobs stay at defaults. */
export function toPoolAnalysisConfig(pool: StoredPool): PoolAnalysisConfig {
  return {
    rules: pool.rules,
    standing: pool.standing,
    field: { ...DEFAULT_FIELD_CONFIG, ...pool.field },
    model: DEFAULT_MODEL_CONFIG,
    risk: DEFAULT_RISK_PARAMS,
    devigMethod: pool.devigMethod,
    lockOffsetMinutes: pool.lockOffsetMinutes,
    staleOddsMinutes: 12 * 60,
  };
}
