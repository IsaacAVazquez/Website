import { Player, Position, ScoringFormat } from "@/types";
import { logger } from "@/lib/logger";

export const FANTASY_ROUTE_POSITIONS = [
  "overall",
  "qb",
  "rb",
  "wr",
  "te",
  "flex",
  "k",
  "dst",
] as const;

const _FANTASY_ROUTE_SCORING = ["ppr", "half_ppr", "standard"] as const;
export const FANTASY_SNAPSHOT_SCHEMA_VERSION = 7;
export const DEFAULT_FANTASY_SNAPSHOT_SOURCE =
  "Published fantasy rankings snapshot generated from FantasyPros public consensus pages. Overall boards come from the public overall consensus page for each scoring format, while flex is derived locally from the published overall board.";

export type FantasyRoutePosition = (typeof FANTASY_ROUTE_POSITIONS)[number];
export type FantasyRouteScoring = (typeof _FANTASY_ROUTE_SCORING)[number];
export type FantasySnapshotPosition = Extract<Position, "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX">;
type FantasySnapshotSliceSourceKind =
  | "overall_consensus"
  | "position_consensus"
  | "shared_position_consensus"
  | "derived_flex"
  | "unavailable";
type FantasySnapshotRangeKind = "overall" | "position" | "none";

export interface FantasySnapshotSliceMetadata {
  available: boolean;
  sourceKind: FantasySnapshotSliceSourceKind;
  rangeKind: FantasySnapshotRangeKind;
  playerCount: number;
  updatedAt?: string | null;
  reason?: string;
}

export type FantasySnapshotSliceMap = Record<FantasyRoutePosition, FantasySnapshotSliceMetadata>;

/**
 * Provenance for the ADP readings layered onto the consensus board. ADP comes
 * from a different upstream than the rankings, so it carries its own source
 * attribution and as-of date; `null` means the snapshot ships without ADP and
 * the UI hides every ADP surface.
 */
export interface FantasyAdpSourceMetadata {
  provider: string;
  url: string;
  asOf: string | null;
  sampleSize: number | null;
  matchedCount: number;
}

export interface FantasySnapshot {
  schemaVersion: number;
  season: number;
  week: number;
  generatedAt: string;
  upstreamUpdatedAt: string | null;
  scoringFormat: ScoringFormat;
  source: string;
  adpSource: FantasyAdpSourceMetadata | null;
  positions: Record<FantasySnapshotPosition, Player[]>;
  overall: Player[];
  sliceMetadata: FantasySnapshotSliceMap;
}

export interface FantasySnapshotMetadata {
  season: number;
  week: number;
  generatedAt: string;
  upstreamUpdatedAt: string | null;
  scoringFormat: ScoringFormat;
  source: string;
  position: FantasyRoutePosition | "all";
  playerCount: number;
  slice: FantasySnapshotSliceMetadata | null;
  slices?: FantasySnapshotSliceMap;
  adpSource?: FantasyAdpSourceMetadata | null;
}

export interface FantasyPositionResponse {
  success: boolean;
  players: Player[];
  metadata: FantasySnapshotMetadata;
}

export interface FantasyAllPositionsResponse {
  success: boolean;
  data: FantasySnapshot;
  metadata: FantasySnapshotMetadata;
}

export const FANTASY_POSITION_LABELS: Record<FantasyRoutePosition, string> = {
  overall: "Overall",
  qb: "QB",
  rb: "RB",
  wr: "WR",
  te: "TE",
  flex: "Flex",
  k: "K",
  dst: "DST",
};

export const FANTASY_SCORING_LABELS: Record<FantasyRouteScoring, string> = {
  ppr: "PPR",
  half_ppr: "Half PPR",
  standard: "Standard",
};

const FANTASY_SNAPSHOT_POSITIONS: FantasySnapshotPosition[] = ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"];
const FANTASY_ACTUAL_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;
const FANTASY_FLEX_POSITIONS = ["RB", "WR", "TE"] as const;
type FantasyActualPosition = (typeof FANTASY_ACTUAL_POSITIONS)[number];

type FantasySliceSupport = {
  supported: boolean;
  sourceKind: FantasySnapshotSliceSourceKind;
  rangeKind: FantasySnapshotRangeKind;
};

type RawFantasySnapshotSliceMetadata = Partial<FantasySnapshotSliceMetadata> & {
  updatedAt?: unknown;
};

type RawFantasySnapshot = Partial<Omit<FantasySnapshot, "adpSource">> & {
  positions?: Partial<Record<FantasySnapshotPosition, unknown>>;
  sliceMetadata?: Partial<Record<FantasyRoutePosition, RawFantasySnapshotSliceMetadata>>;
  upstreamUpdatedAt?: unknown;
  adpSource?: unknown;
};

export function normalizeFantasyRoutePosition(rawPosition: string | null | undefined): FantasyRoutePosition {
  const normalized = rawPosition?.trim().toLowerCase();
  return FANTASY_ROUTE_POSITIONS.includes(normalized as FantasyRoutePosition)
    ? (normalized as FantasyRoutePosition)
    : "overall";
}

export function normalizeFantasyRouteScoring(rawScoring: string | null | undefined): FantasyRouteScoring {
  const normalized = rawScoring?.trim().toLowerCase().replace("-", "_");

  switch (normalized) {
    case "half":
    case "halfppr":
    case "half_ppr":
      return "half_ppr";
    case "std":
    case "standard":
      return "standard";
    case "ppr":
    default:
      return "ppr";
  }
}

export function routeScoringToScoringFormat(scoring: FantasyRouteScoring): ScoringFormat {
  switch (scoring) {
    case "standard":
      return "STANDARD";
    case "half_ppr":
      return "HALF_PPR";
    case "ppr":
    default:
      return "PPR";
  }
}

export function scoringFormatToRouteScoring(scoring: ScoringFormat): FantasyRouteScoring {
  switch (scoring) {
    case "STANDARD":
      return "standard";
    case "HALF_PPR":
      return "half_ppr";
    case "PPR":
    default:
      return "ppr";
  }
}

function routePositionToSnapshotPosition(position: FantasyRoutePosition): FantasySnapshotPosition | "OVERALL" {
  switch (position) {
    case "overall":
      return "OVERALL";
    case "qb":
      return "QB";
    case "rb":
      return "RB";
    case "wr":
      return "WR";
    case "te":
      return "TE";
    case "flex":
      return "FLEX";
    case "k":
      return "K";
    case "dst":
      return "DST";
  }
}

/**
 * Returns every uniquely identifiable player carried by a scoring snapshot.
 * Overall rankings intentionally omit some specialists, while FLEX repeats
 * players from RB/WR/TE, so the union starts with overall and de-duplicates
 * every position slice by the stable player id.
 */
export function getAllFantasySnapshotPlayers(snapshot: FantasySnapshot): Player[] {
  const playersById = new Map<string, Player>();

  for (const player of snapshot.overall) {
    playersById.set(player.id, player);
  }
  for (const position of FANTASY_SNAPSHOT_POSITIONS) {
    for (const player of snapshot.positions[position]) {
      if (!playersById.has(player.id)) playersById.set(player.id, player);
    }
  }

  return Array.from(playersById.values());
}

/**
 * Persisted player IDs can only be classified as stale when every published
 * slice loaded successfully. An unavailable position is an incomplete player
 * universe, not evidence that its previously pinned players no longer exist.
 */
export function hasCompleteFantasyPlayerUniverse(
  snapshot: FantasySnapshot | null | undefined
): snapshot is FantasySnapshot {
  return Boolean(
    snapshot &&
      FANTASY_ROUTE_POSITIONS.every(
        (position) => snapshot.sliceMetadata[position]?.available === true
      )
  );
}

function snapshotPositionToRoutePosition(position: FantasySnapshotPosition): FantasyRoutePosition {
  switch (position) {
    case "QB":
      return "qb";
    case "RB":
      return "rb";
    case "WR":
      return "wr";
    case "TE":
      return "te";
    case "FLEX":
      return "flex";
    case "K":
      return "k";
    case "DST":
      return "dst";
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertCompatibleFantasySnapshot(
  input: RawFantasySnapshot,
  scoring: FantasyRouteScoring
): void {
  const expectedScoringFormat = routeScoringToScoringFormat(scoring);
  if (
    input.scoringFormat !== undefined &&
    input.scoringFormat !== expectedScoringFormat
  ) {
    throw new Error(
      `Fantasy snapshot scoringFormat ${String(input.scoringFormat)} does not match requested ${expectedScoringFormat}.`
    );
  }

  if (
    input.schemaVersion !== undefined &&
    (!Number.isInteger(input.schemaVersion) ||
      input.schemaVersion < 1 ||
      input.schemaVersion > FANTASY_SNAPSHOT_SCHEMA_VERSION)
  ) {
    throw new Error(
      `Fantasy snapshot schemaVersion ${String(input.schemaVersion)} is not supported.`
    );
  }

  if (
    input.schemaVersion === FANTASY_SNAPSHOT_SCHEMA_VERSION &&
    (typeof input.source !== "string" || input.source.trim().length === 0)
  ) {
    throw new Error("Fantasy snapshot source is required for the current schema.");
  }
}

function normalizeOptionalTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Validates the ADP provenance block from a raw snapshot. Anything malformed
 * (including snapshots from schema 5 and earlier, which predate ADP) collapses
 * to `null` so the UI cleanly hides ADP rather than rendering unattributed data.
 */
function normalizeAdpSourceMetadata(value: unknown): FantasyAdpSourceMetadata | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<FantasyAdpSourceMetadata>;
  if (typeof raw.provider !== "string" || !raw.provider) {
    return null;
  }

  const matchedCount = isFiniteNumber(raw.matchedCount) ? Math.max(0, raw.matchedCount) : 0;
  if (matchedCount <= 0) {
    return null;
  }

  return {
    provider: raw.provider,
    url: typeof raw.url === "string" ? raw.url : "",
    asOf: normalizeOptionalTimestamp(raw.asOf),
    sampleSize: isFiniteNumber(raw.sampleSize) ? raw.sampleSize : null,
    matchedCount,
  };
}

export function publishFantasyPlayer(player: Player): Player {
  const publishedPlayer: Partial<Player> = {
    id: player.id,
    name: player.name,
    team: player.team,
    position: player.position,
    averageRank: player.averageRank,
  };

  if (isFiniteNumber(player.standardDeviation)) {
    publishedPlayer.standardDeviation = player.standardDeviation;
  }

  if (isFiniteNumber(player.rankEcr)) {
    publishedPlayer.rankEcr = player.rankEcr;
  }

  if (isFiniteNumber(player.rankAverage)) {
    publishedPlayer.rankAverage = player.rankAverage;
  }

  if (isFiniteNumber(player.tier)) {
    publishedPlayer.tier = player.tier;
  }

  if (isFiniteNumber(player.positionRank)) {
    publishedPlayer.positionRank = player.positionRank;
  }

  if (player.minRank !== undefined) {
    publishedPlayer.minRank = player.minRank;
  }

  if (player.maxRank !== undefined) {
    publishedPlayer.maxRank = player.maxRank;
  }

  if (isFiniteNumber(player.byeWeek)) {
    publishedPlayer.byeWeek = player.byeWeek;
  }

  if (isFiniteNumber(player.ownership)) {
    publishedPlayer.ownership = player.ownership;
  }

  if (isFiniteNumber(player.adp)) {
    publishedPlayer.adp = player.adp;
  }

  if (isFiniteNumber(player.adpHigh)) {
    publishedPlayer.adpHigh = player.adpHigh;
  }

  if (isFiniteNumber(player.adpLow)) {
    publishedPlayer.adpLow = player.adpLow;
  }

  if (isFiniteNumber(player.adpStandardDeviation)) {
    publishedPlayer.adpStandardDeviation = player.adpStandardDeviation;
  }

  if (isFiniteNumber(player.adpTimesDrafted)) {
    publishedPlayer.adpTimesDrafted = player.adpTimesDrafted;
  }

  const updatedAt = normalizeOptionalTimestamp(player.lastUpdated);
  if (updatedAt) {
    publishedPlayer.lastUpdated = updatedAt;
  }

  return publishedPlayer as Player;
}

/**
 * Strict mode throws on the first unusable row, which is what the builder and
 * the snapshot tests want, since bad data should never get published. Lenient
 * mode drops the row and keeps the rest, which is what the running site wants,
 * since one malformed player must not blank a whole scoring format's board.
 */
function toPlayerArray(
  raw: unknown,
  slice: FantasySnapshotPosition | "OVERALL",
  lenient: boolean,
  dropped: string[]
): Player[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seenPlayerIds = new Set<string>();
  const players: Player[] = [];

  const reject = (message: string): void => {
    if (!lenient) throw new Error(message);
    dropped.push(message);
  };

  for (const [index, rawPlayer] of raw.entries()) {
    if (!rawPlayer || typeof rawPlayer !== "object" || Array.isArray(rawPlayer)) {
      reject(`Fantasy snapshot ${slice} player ${index + 1} is not an object.`);
      continue;
    }

    const player = rawPlayer as Record<string, unknown>;
    const badField = (["id", "name", "team"] as const).find(
      (field) => typeof player[field] !== "string" || player[field].trim().length === 0
    );
    if (badField) {
      reject(`Fantasy snapshot ${slice} player ${index + 1} has an invalid ${badField}.`);
      continue;
    }

    const position = player.position;
    if (!FANTASY_ACTUAL_POSITIONS.includes(position as FantasyActualPosition)) {
      reject(`Fantasy snapshot ${slice} player ${String(player.id)} has an invalid position.`);
      continue;
    }
    if (
      (slice === "FLEX" &&
        !FANTASY_FLEX_POSITIONS.includes(position as (typeof FANTASY_FLEX_POSITIONS)[number])) ||
      (slice !== "OVERALL" && slice !== "FLEX" && position !== slice)
    ) {
      reject(
        `Fantasy snapshot ${slice} player ${String(player.id)} has position ${String(position)}.`
      );
      continue;
    }

    if (!isFiniteNumber(player.averageRank) || player.averageRank <= 0) {
      reject(`Fantasy snapshot ${slice} player ${String(player.id)} has an invalid averageRank.`);
      continue;
    }
    if (
      player.standardDeviation !== undefined &&
      (!isFiniteNumber(player.standardDeviation) || player.standardDeviation < 0)
    ) {
      reject(
        `Fantasy snapshot ${slice} player ${String(player.id)} has an invalid standardDeviation.`
      );
      continue;
    }

    const playerId = player.id as string;
    if (seenPlayerIds.has(playerId)) {
      reject(`Fantasy snapshot ${slice} contains duplicate player id ${playerId}.`);
      continue;
    }
    seenPlayerIds.add(playerId);

    players.push(publishFantasyPlayer(player as unknown as Player));
  }

  return players;
}

function getFantasySliceSupport(
  _scoring: FantasyRouteScoring,
  position: FantasyRoutePosition
): FantasySliceSupport {
  switch (position) {
    case "overall":
      return {
        supported: true,
        sourceKind: "overall_consensus",
        rangeKind: "overall",
      };
    case "flex":
      return {
        supported: true,
        sourceKind: "derived_flex",
        rangeKind: "overall",
      };
    case "qb":
    case "k":
    case "dst":
      return {
        supported: true,
        sourceKind: "shared_position_consensus",
        rangeKind: "position",
      };
    case "rb":
    case "wr":
    case "te":
      return {
        supported: true,
        sourceKind: "position_consensus",
        rangeKind: "position",
      };
  }
}

function getFantasySnapshotUnavailableReason(
  scoring: FantasyRouteScoring,
  position: FantasyRoutePosition
): string {
  const scoringLabel = FANTASY_SCORING_LABELS[scoring];
  const positionLabel = FANTASY_POSITION_LABELS[position];

  if (position === "flex") {
    return `Published ${scoringLabel} flex rankings are unavailable because the current snapshot does not include an overall consensus board.`;
  }

  return `Published ${scoringLabel} ${positionLabel} rankings are unavailable in the current snapshot.`;
}

function buildFantasySliceMetadata(
  scoring: FantasyRouteScoring,
  position: FantasyRoutePosition,
  playerCount: number,
  updatedAt?: string | null
): FantasySnapshotSliceMetadata {
  const support = getFantasySliceSupport(scoring, position);

  if (!support.supported || playerCount <= 0) {
    return {
      available: false,
      sourceKind: "unavailable",
      rangeKind: "none",
      playerCount: 0,
      updatedAt: updatedAt ?? null,
      reason: getFantasySnapshotUnavailableReason(scoring, position),
    };
  }

  return {
    available: true,
    sourceKind: support.sourceKind,
    rangeKind: support.rangeKind,
    playerCount,
    updatedAt: updatedAt ?? null,
  };
}

function buildLegacyFlexPlayers(overallPlayers: Player[]): Player[] {
  return overallPlayers
    .filter((player) => ["RB", "WR", "TE"].includes(player.position))
    .map((player, index) =>
      publishFantasyPlayer({
        ...player,
        averageRank: index + 1,
      })
    );
}

function getSliceUpdatedAt(players: Player[]): string | null {
  for (const player of players) {
    const updatedAt = normalizeOptionalTimestamp(player.lastUpdated);
    if (updatedAt) {
      return updatedAt;
    }
  }

  return null;
}

function normalizeRawSliceMetadata(
  rawSlice: RawFantasySnapshotSliceMetadata | undefined,
  fallback: FantasySnapshotSliceMetadata,
  actualPlayerCount: number,
  actualUpdatedAt: string | null
): FantasySnapshotSliceMetadata {
  if (!rawSlice || typeof rawSlice !== "object") {
    return {
      ...fallback,
      updatedAt: actualUpdatedAt ?? fallback.updatedAt ?? null,
    };
  }

  const available =
    typeof rawSlice.available === "boolean"
      ? rawSlice.available && actualPlayerCount > 0
      : fallback.available;
  const sourceKind =
    rawSlice.sourceKind &&
    ["overall_consensus", "position_consensus", "shared_position_consensus", "derived_flex", "unavailable"].includes(
      rawSlice.sourceKind
    )
      ? rawSlice.sourceKind
      : fallback.sourceKind;
  const rangeKind =
    rawSlice.rangeKind && ["overall", "position", "none"].includes(rawSlice.rangeKind)
      ? rawSlice.rangeKind
      : fallback.rangeKind;
  const updatedAt = normalizeOptionalTimestamp(rawSlice.updatedAt) ?? actualUpdatedAt ?? fallback.updatedAt ?? null;

  return {
    available,
    sourceKind: available ? sourceKind : "unavailable",
    rangeKind: available ? rangeKind : "none",
    playerCount: actualPlayerCount,
    updatedAt,
    reason:
      available || typeof rawSlice.reason !== "string" || !rawSlice.reason
        ? fallback.reason
        : rawSlice.reason,
  };
}

/**
 * `lenient` drops unusable player rows instead of throwing. Runtime readers
 * pass it so a single bad row degrades one player rather than the whole board;
 * the builder and the snapshot tests leave it off so bad data fails loudly
 * before it is ever published.
 */
export function normalizeFantasySnapshot(
  rawSnapshot: unknown,
  scoring: FantasyRouteScoring,
  options: { lenient?: boolean } = {}
): FantasySnapshot {
  const lenient = options.lenient === true;
  const dropped: string[] = [];
  const input =
    rawSnapshot && typeof rawSnapshot === "object"
      ? (rawSnapshot as RawFantasySnapshot)
      : ({} as RawFantasySnapshot);
  assertCompatibleFantasySnapshot(input, scoring);
  const rawPositions =
    input.positions && typeof input.positions === "object"
      ? (input.positions as Partial<Record<FantasySnapshotPosition, unknown>>)
      : {};
  const rawSliceMetadata =
    input.sliceMetadata && typeof input.sliceMetadata === "object"
      ? (input.sliceMetadata as Partial<Record<FantasyRoutePosition, RawFantasySnapshotSliceMetadata>>)
      : {};

  const overallPlayers = toPlayerArray(input.overall, "OVERALL", lenient, dropped);
  const positions: Record<FantasySnapshotPosition, Player[]> = {
    QB: toPlayerArray(rawPositions.QB, "QB", lenient, dropped),
    RB: toPlayerArray(rawPositions.RB, "RB", lenient, dropped),
    WR: toPlayerArray(rawPositions.WR, "WR", lenient, dropped),
    TE: toPlayerArray(rawPositions.TE, "TE", lenient, dropped),
    FLEX: toPlayerArray(rawPositions.FLEX, "FLEX", lenient, dropped),
    K: toPlayerArray(rawPositions.K, "K", lenient, dropped),
    DST: toPlayerArray(rawPositions.DST, "DST", lenient, dropped),
  };

  if (dropped.length > 0) {
    logger.warn(
      `Fantasy snapshot ${scoring} dropped ${dropped.length} unusable player row(s)`,
      dropped.slice(0, 10)
    );
  }

  const publishedPlayerCount =
    overallPlayers.length +
    FANTASY_SNAPSHOT_POSITIONS.reduce(
      (count, position) => count + positions[position].length,
      0
    );
  if (publishedPlayerCount === 0) {
    throw new Error("Fantasy snapshot is incomplete because it contains no players.");
  }

  if (positions.FLEX.length === 0 && overallPlayers.length > 0) {
    positions.FLEX = buildLegacyFlexPlayers(overallPlayers);
  }

  const fallbackSliceMetadata: FantasySnapshotSliceMap = {
    overall: buildFantasySliceMetadata(scoring, "overall", overallPlayers.length, getSliceUpdatedAt(overallPlayers)),
    qb: buildFantasySliceMetadata(scoring, "qb", positions.QB.length, getSliceUpdatedAt(positions.QB)),
    rb: buildFantasySliceMetadata(scoring, "rb", positions.RB.length, getSliceUpdatedAt(positions.RB)),
    wr: buildFantasySliceMetadata(scoring, "wr", positions.WR.length, getSliceUpdatedAt(positions.WR)),
    te: buildFantasySliceMetadata(scoring, "te", positions.TE.length, getSliceUpdatedAt(positions.TE)),
    flex: buildFantasySliceMetadata(scoring, "flex", positions.FLEX.length, getSliceUpdatedAt(positions.FLEX)),
    k: buildFantasySliceMetadata(scoring, "k", positions.K.length, getSliceUpdatedAt(positions.K)),
    dst: buildFantasySliceMetadata(scoring, "dst", positions.DST.length, getSliceUpdatedAt(positions.DST)),
  };

  const sliceMetadata: FantasySnapshotSliceMap = {
    overall: normalizeRawSliceMetadata(
      rawSliceMetadata.overall,
      fallbackSliceMetadata.overall,
      overallPlayers.length,
      getSliceUpdatedAt(overallPlayers)
    ),
    qb: normalizeRawSliceMetadata(
      rawSliceMetadata.qb,
      fallbackSliceMetadata.qb,
      positions.QB.length,
      getSliceUpdatedAt(positions.QB)
    ),
    rb: normalizeRawSliceMetadata(
      rawSliceMetadata.rb,
      fallbackSliceMetadata.rb,
      positions.RB.length,
      getSliceUpdatedAt(positions.RB)
    ),
    wr: normalizeRawSliceMetadata(
      rawSliceMetadata.wr,
      fallbackSliceMetadata.wr,
      positions.WR.length,
      getSliceUpdatedAt(positions.WR)
    ),
    te: normalizeRawSliceMetadata(
      rawSliceMetadata.te,
      fallbackSliceMetadata.te,
      positions.TE.length,
      getSliceUpdatedAt(positions.TE)
    ),
    flex: normalizeRawSliceMetadata(
      rawSliceMetadata.flex,
      fallbackSliceMetadata.flex,
      positions.FLEX.length,
      getSliceUpdatedAt(positions.FLEX)
    ),
    k: normalizeRawSliceMetadata(
      rawSliceMetadata.k,
      fallbackSliceMetadata.k,
      positions.K.length,
      getSliceUpdatedAt(positions.K)
    ),
    dst: normalizeRawSliceMetadata(
      rawSliceMetadata.dst,
      fallbackSliceMetadata.dst,
      positions.DST.length,
      getSliceUpdatedAt(positions.DST)
    ),
  };

  for (const snapshotPosition of FANTASY_SNAPSHOT_POSITIONS) {
    const routePosition = snapshotPositionToRoutePosition(snapshotPosition);
    if (!sliceMetadata[routePosition].available) {
      positions[snapshotPosition] = [];
    }
  }

  const upstreamUpdatedAt =
    normalizeOptionalTimestamp(input.upstreamUpdatedAt) ??
    sliceMetadata.overall.updatedAt ??
    getSliceUpdatedAt(overallPlayers);

  return {
    schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
    season: typeof input.season === "number" ? input.season : 0,
    week: typeof input.week === "number" ? input.week : 0,
    generatedAt:
      typeof input.generatedAt === "string" && input.generatedAt
        ? input.generatedAt
        : new Date().toISOString(),
    upstreamUpdatedAt,
    scoringFormat: routeScoringToScoringFormat(scoring),
    source:
      typeof input.source === "string" && input.source.trim()
        ? input.source.trim()
        : DEFAULT_FANTASY_SNAPSHOT_SOURCE,
    adpSource: normalizeAdpSourceMetadata(input.adpSource),
    positions,
    overall: sliceMetadata.overall.available ? overallPlayers : [],
    sliceMetadata,
  };
}

export function getFantasyPlayersForPosition(
  snapshot: FantasySnapshot,
  position: FantasyRoutePosition
): Player[] {
  const sliceMetadata = getFantasySliceMetadata(snapshot, position);
  if (!sliceMetadata.available) {
    return [];
  }

  if (position === "overall") {
    return snapshot.overall;
  }

  const snapshotPosition = routePositionToSnapshotPosition(position);
  return snapshotPosition === "OVERALL" ? snapshot.overall : snapshot.positions[snapshotPosition];
}

export function getFantasySliceMetadata(
  snapshot: FantasySnapshot,
  position: FantasyRoutePosition
): FantasySnapshotSliceMetadata {
  const scoring = scoringFormatToRouteScoring(snapshot.scoringFormat);
  const playerCount =
    position === "overall"
      ? Array.isArray(snapshot.overall)
        ? snapshot.overall.length
        : 0
      : (() => {
          const snapshotPosition = routePositionToSnapshotPosition(position);
          return snapshotPosition !== "OVERALL" && Array.isArray(snapshot.positions?.[snapshotPosition])
            ? snapshot.positions[snapshotPosition].length
            : 0;
        })();
  const updatedAt =
    position === "overall"
      ? getSliceUpdatedAt(snapshot.overall)
      : (() => {
          const snapshotPosition = routePositionToSnapshotPosition(position);
          return snapshotPosition !== "OVERALL"
            ? getSliceUpdatedAt(snapshot.positions?.[snapshotPosition] ?? [])
            : getSliceUpdatedAt(snapshot.overall);
        })();

  return (
    snapshot.sliceMetadata?.[position] ??
    buildFantasySliceMetadata(scoring, position, playerCount, updatedAt)
  );
}

export function getFantasyWeekLabel(week: number): string {
  if (week <= 0) {
    return "Preseason";
  }

  return `Week ${week}`;
}

export function getFantasyPlayerSearchText(player: Player): string {
  return [player.name, player.team, player.position]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
