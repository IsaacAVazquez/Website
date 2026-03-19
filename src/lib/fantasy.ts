import { Player, Position, ScoringFormat } from "@/types";

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

export const FANTASY_ROUTE_SCORING = ["ppr", "half_ppr", "standard"] as const;
export const FANTASY_SNAPSHOT_SCHEMA_VERSION = 3;
export const DEFAULT_FANTASY_SNAPSHOT_SOURCE =
  "Published fantasy rankings snapshot generated from FantasyPros public consensus pages and repository overall boards.";

export type FantasyRoutePosition = (typeof FANTASY_ROUTE_POSITIONS)[number];
export type FantasyRouteScoring = (typeof FANTASY_ROUTE_SCORING)[number];
export type FantasySnapshotPosition = Extract<Position, "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX">;
export type FantasySnapshotSliceSourceKind =
  | "overall_consensus"
  | "position_consensus"
  | "shared_position_consensus"
  | "derived_flex"
  | "unavailable";
export type FantasySnapshotRangeKind = "overall" | "position" | "none";

export interface FantasySnapshotSliceMetadata {
  available: boolean;
  sourceKind: FantasySnapshotSliceSourceKind;
  rangeKind: FantasySnapshotRangeKind;
  playerCount: number;
  reason?: string;
}

export type FantasySnapshotSliceMap = Record<FantasyRoutePosition, FantasySnapshotSliceMetadata>;

export interface FantasySnapshot {
  schemaVersion: number;
  season: number;
  week: number;
  generatedAt: string;
  scoringFormat: ScoringFormat;
  source: string;
  positions: Record<FantasySnapshotPosition, Player[]>;
  overall: Player[];
  sliceMetadata: FantasySnapshotSliceMap;
}

export interface FantasySnapshotMetadata {
  season: number;
  week: number;
  generatedAt: string;
  scoringFormat: ScoringFormat;
  source: string;
  position: FantasyRoutePosition | "all";
  playerCount: number;
  slice: FantasySnapshotSliceMetadata | null;
  slices?: FantasySnapshotSliceMap;
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

type FantasySliceSupport = {
  supported: boolean;
  sourceKind: FantasySnapshotSliceSourceKind;
  rangeKind: FantasySnapshotRangeKind;
};

type RawFantasySnapshot = Partial<FantasySnapshot> & {
  positions?: Partial<Record<FantasySnapshotPosition, unknown>>;
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
      return "ppr";
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

export function routePositionToSnapshotPosition(position: FantasyRoutePosition): FantasySnapshotPosition | "OVERALL" {
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

function toPlayerArray(raw: unknown): Player[] {
  return Array.isArray(raw) ? (raw as Player[]) : [];
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
        rangeKind: "position",
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

export function getFantasySnapshotUnavailableReason(
  scoring: FantasyRouteScoring,
  position: FantasyRoutePosition
): string {
  const scoringLabel = FANTASY_SCORING_LABELS[scoring];
  const positionLabel = FANTASY_POSITION_LABELS[position];

  if (position === "flex") {
    return `Published ${scoringLabel} flex rankings are unavailable because RB, WR, and TE position data is incomplete in the current snapshot.`;
  }

  return `Published ${scoringLabel} ${positionLabel} rankings are unavailable in the current snapshot.`;
}

function buildFantasySliceMetadata(
  scoring: FantasyRouteScoring,
  position: FantasyRoutePosition,
  playerCount: number
): FantasySnapshotSliceMetadata {
  const support = getFantasySliceSupport(scoring, position);

  if (!support.supported || playerCount <= 0) {
    return {
      available: false,
      sourceKind: "unavailable",
      rangeKind: "none",
      playerCount: 0,
      reason: getFantasySnapshotUnavailableReason(scoring, position),
    };
  }

  return {
    available: true,
    sourceKind: support.sourceKind,
    rangeKind: support.rangeKind,
    playerCount,
  };
}

function buildLegacyFlexPlayers(overallPlayers: Player[]): Player[] {
  return overallPlayers.filter((player) => ["RB", "WR", "TE"].includes(player.position));
}

export function normalizeFantasySnapshot(
  rawSnapshot: unknown,
  scoring: FantasyRouteScoring
): FantasySnapshot {
  const input =
    rawSnapshot && typeof rawSnapshot === "object"
      ? (rawSnapshot as RawFantasySnapshot)
      : ({} as RawFantasySnapshot);
  const rawPositions =
    input.positions && typeof input.positions === "object"
      ? (input.positions as Partial<Record<FantasySnapshotPosition, unknown>>)
      : {};

  const overallPlayers = toPlayerArray(input.overall);
  const positions: Record<FantasySnapshotPosition, Player[]> = {
    QB: toPlayerArray(rawPositions.QB),
    RB: toPlayerArray(rawPositions.RB),
    WR: toPlayerArray(rawPositions.WR),
    TE: toPlayerArray(rawPositions.TE),
    FLEX: toPlayerArray(rawPositions.FLEX),
    K: toPlayerArray(rawPositions.K),
    DST: toPlayerArray(rawPositions.DST),
  };

  if (positions.FLEX.length === 0 && overallPlayers.length > 0) {
    positions.FLEX = buildLegacyFlexPlayers(overallPlayers);
  }

  const sliceMetadata: FantasySnapshotSliceMap = {
    overall: buildFantasySliceMetadata(scoring, "overall", overallPlayers.length),
    qb: buildFantasySliceMetadata(scoring, "qb", positions.QB.length),
    rb: buildFantasySliceMetadata(scoring, "rb", positions.RB.length),
    wr: buildFantasySliceMetadata(scoring, "wr", positions.WR.length),
    te: buildFantasySliceMetadata(scoring, "te", positions.TE.length),
    flex: buildFantasySliceMetadata(scoring, "flex", positions.FLEX.length),
    k: buildFantasySliceMetadata(scoring, "k", positions.K.length),
    dst: buildFantasySliceMetadata(scoring, "dst", positions.DST.length),
  };

  for (const snapshotPosition of FANTASY_SNAPSHOT_POSITIONS) {
    const routePosition = snapshotPositionToRoutePosition(snapshotPosition);
    if (!sliceMetadata[routePosition].available) {
      positions[snapshotPosition] = [];
    }
  }

  return {
    schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
    season: typeof input.season === "number" ? input.season : 0,
    week: typeof input.week === "number" ? input.week : 0,
    generatedAt:
      typeof input.generatedAt === "string" && input.generatedAt
        ? input.generatedAt
        : new Date().toISOString(),
    scoringFormat: routeScoringToScoringFormat(scoring),
    source:
      typeof input.source === "string" && input.source
        ? input.source
        : DEFAULT_FANTASY_SNAPSHOT_SOURCE,
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

  return snapshot.sliceMetadata?.[position] ?? buildFantasySliceMetadata(scoring, position, playerCount);
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
