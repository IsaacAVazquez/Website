import {
  getBrowserStorageSnapshot,
  getBrowserStorageStatusSnapshot,
  readValidatedBrowserStorage,
  subscribeBrowserStorage,
  writeBrowserStorageString,
  type PersistenceStatus,
} from "@/lib/browserStorage";
import type { FantasyRouteScoring } from "@/lib/fantasy";

export const FANTASY_TRADE_PERSISTENCE_VERSION = 1 as const;
export const FANTASY_TRADE_MAX_PLAYERS_PER_SIDE = 6;

const FANTASY_TRADE_STORAGE_PREFIX = "fantasy-trade-calculator-v1";
const FANTASY_TRADE_SCORING_VALUES = new Set<FantasyRouteScoring>([
  "ppr",
  "half_ppr",
  "standard",
]);

type UnknownRecord = Record<string, unknown>;

export interface FantasyTradeStorageScope {
  season: number;
  scoring: FantasyRouteScoring;
}

export interface FantasyTradePersistenceContext extends FantasyTradeStorageScope {
  modelVersion: string;
}

export interface FantasyTradePersistenceState extends FantasyTradePersistenceContext {
  version: typeof FANTASY_TRADE_PERSISTENCE_VERSION;
  givePlayerIds: string[];
  getPlayerIds: string[];
}

export interface FantasyTradePersistenceRead {
  state: FantasyTradePersistenceState;
  persistenceStatus: PersistenceStatus;
  source: "empty" | "valid" | "invalid";
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidSeason(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 2000 && Number(value) <= 3000;
}

function isFantasyTradeScoring(value: unknown): value is FantasyRouteScoring {
  return typeof value === "string" && FANTASY_TRADE_SCORING_VALUES.has(value as FantasyRouteScoring);
}

function normalizeModelVersion(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 128 ? normalized : null;
}

function normalizePlayerId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 256 ? normalized : null;
}

function assertStorageScope(scope: FantasyTradeStorageScope): void {
  if (!isValidSeason(scope.season) || !isFantasyTradeScoring(scope.scoring)) {
    throw new TypeError("season and scoring must identify a supported fantasy trade calculator scope.");
  }
}

/**
 * Returns the season-and-scoring storage key used by the calculator. Model
 * versions deliberately do not change the key, so a newer model can re-evaluate
 * the same selected players while retaining the version that produced the last
 * saved result.
 */
export function getFantasyTradeStorageKey(scope: FantasyTradeStorageScope): string {
  assertStorageScope(scope);
  return `${FANTASY_TRADE_STORAGE_PREFIX}-${scope.season}-${scope.scoring}`;
}

/**
 * Repairs one side of a trade while preserving first-seen order. Invalid and
 * duplicate IDs are removed, exclusions from the other side are honored, and
 * the list is capped at six players.
 */
export function repairFantasyTradePlayerIds(
  value: unknown,
  excludedIds: ReadonlySet<string> = new Set(),
): string[] {
  if (!Array.isArray(value)) return [];

  const repaired: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    const id = normalizePlayerId(candidate);
    if (!id || seen.has(id) || excludedIds.has(id)) continue;
    repaired.push(id);
    seen.add(id);
    if (repaired.length === FANTASY_TRADE_MAX_PLAYERS_PER_SIDE) break;
  }
  return repaired;
}

/**
 * Validates the payload identity and repairs its ordered player lists. The give
 * side is repaired first, so it wins when the same player appears on both sides.
 */
export function repairFantasyTradePersistenceState(
  value: unknown,
  expectedScope?: FantasyTradeStorageScope,
): FantasyTradePersistenceState | null {
  if (!isRecord(value) || value.version !== FANTASY_TRADE_PERSISTENCE_VERSION) {
    return null;
  }
  if (!isValidSeason(value.season) || !isFantasyTradeScoring(value.scoring)) {
    return null;
  }
  if (
    expectedScope &&
    (value.season !== expectedScope.season || value.scoring !== expectedScope.scoring)
  ) {
    return null;
  }

  const modelVersion = normalizeModelVersion(value.modelVersion);
  if (!modelVersion) return null;

  const givePlayerIds = repairFantasyTradePlayerIds(value.givePlayerIds);
  const getPlayerIds = repairFantasyTradePlayerIds(
    value.getPlayerIds,
    new Set(givePlayerIds),
  );

  return {
    version: FANTASY_TRADE_PERSISTENCE_VERSION,
    season: value.season,
    scoring: value.scoring,
    modelVersion,
    givePlayerIds,
    getPlayerIds,
  };
}

export function createFantasyTradePersistenceState(
  context: FantasyTradePersistenceContext,
  players: Partial<Pick<FantasyTradePersistenceState, "givePlayerIds" | "getPlayerIds">> = {},
): FantasyTradePersistenceState {
  assertStorageScope(context);
  const modelVersion = normalizeModelVersion(context.modelVersion);
  if (!modelVersion) {
    throw new TypeError("modelVersion must be a non-empty string of at most 128 characters.");
  }

  const state = repairFantasyTradePersistenceState({
    version: FANTASY_TRADE_PERSISTENCE_VERSION,
    season: context.season,
    scoring: context.scoring,
    modelVersion,
    givePlayerIds: players.givePlayerIds ?? [],
    getPlayerIds: players.getPlayerIds ?? [],
  });
  if (!state) throw new TypeError("could not create a valid fantasy trade persistence state.");
  return state;
}

export function parseFantasyTradePersistenceState(
  raw: string | null | undefined,
  expectedScope?: FantasyTradeStorageScope,
): FantasyTradePersistenceState | null {
  if (!raw) return null;
  try {
    return repairFantasyTradePersistenceState(JSON.parse(raw), expectedScope);
  } catch {
    return null;
  }
}

export function serializeFantasyTradePersistenceState(
  state: FantasyTradePersistenceState,
): string {
  const repaired = repairFantasyTradePersistenceState(state, state);
  if (!repaired) {
    throw new TypeError("state must satisfy the fantasy trade persistence schema.");
  }
  return JSON.stringify(repaired);
}

/** Read and validate the state for one season-and-scoring calculator scope. */
export function readFantasyTradePersistence(
  context: FantasyTradePersistenceContext,
): FantasyTradePersistenceRead {
  const key = getFantasyTradeStorageKey(context);
  const result = readValidatedBrowserStorage(
    key,
    (value) => repairFantasyTradePersistenceState(value, context) ?? undefined,
    () => createFantasyTradePersistenceState(context),
  );

  return {
    state: result.value,
    persistenceStatus: result.persistenceStatus,
    source: result.source,
  };
}

/** Canonically serialize and persist a calculator state, including same-tab notification. */
export function writeFantasyTradePersistence(
  state: FantasyTradePersistenceState,
): PersistenceStatus {
  const key = getFantasyTradeStorageKey(state);
  return writeBrowserStorageString(key, serializeFantasyTradePersistenceState(state));
}

/** Subscribe to same-tab helper writes and cross-tab storage events for this scope. */
export function subscribeFantasyTradePersistence(
  scope: FantasyTradeStorageScope,
  listener: () => void,
): () => void {
  return subscribeBrowserStorage(getFantasyTradeStorageKey(scope), listener);
}

/** Stable raw snapshot for useSyncExternalStore consumers. */
export function getFantasyTradePersistenceSnapshot(
  scope: FantasyTradeStorageScope,
): string {
  return getBrowserStorageSnapshot(getFantasyTradeStorageKey(scope), "");
}

export function getFantasyTradePersistenceStatus(
  scope: FantasyTradeStorageScope,
): PersistenceStatus {
  return getBrowserStorageStatusSnapshot(getFantasyTradeStorageKey(scope));
}
