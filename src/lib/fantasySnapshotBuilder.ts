import {
  DEFAULT_FANTASY_SNAPSHOT_SOURCE,
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  FANTASY_POSITION_LABELS,
  FANTASY_SCORING_LABELS,
  FantasyAdpSourceMetadata,
  FantasyRoutePosition,
  FantasyRouteScoring,
  FantasySnapshot,
  FantasySnapshotPosition,
  FantasySnapshotSliceMetadata,
  publishFantasyPlayer,
  routeScoringToScoringFormat,
} from "@/lib/fantasy";
import { getFantasyAdpDataset } from "@/lib/fantasyAdpData";
import {
  buildFantasyAdpIndex,
  matchPlayerAdp,
  type FantasyAdpIndex,
} from "@/lib/fantasyAdpMatcher";
import { FANTASY_ADP_PROVIDER, FANTASY_ADP_PROVIDER_URL } from "@/lib/fantasyAdpSource";
import {
  getFantasyOverallData,
  getFantasyPositionData,
  getFantasyPositionDataMetadata,
} from "@/lib/fantasyPositionData";
import { Player } from "@/types";

const MS_PER_DAY = 86_400_000;
const NFL_REGULAR_SEASON_WEEKS = 18;

/**
 * The NFL season a snapshot belongs to. The season is named for the year it
 * kicks off in, but it runs into the next calendar year — a snapshot built in
 * January is the *previous* year's season (championship weeks, playoffs), not
 * a brand-new "Preseason". Roll to the new season in March, matching the
 * draft tracker's `getCurrentDraftSeason`.
 */
export function getSnapshotSeason(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  return now.getUTCMonth() >= 2 ? year : year - 1;
}

export const SNAPSHOT_SEASON = getSnapshotSeason();

/**
 * Derives the NFL regular-season week for a season from the calendar so a
 * snapshot built mid-season isn't perpetually stamped "Preseason" (week 0).
 *
 * Week 1 kicks off the Thursday after Labor Day (the first Monday of
 * September). Before that we're in the offseason/preseason and report week 0;
 * after kickoff we count regular-season weeks and hold at the final week
 * through the playoffs until the next season opens. This is calendar-derived,
 * not schedule-aware, so it can be off by a day or two around week
 * boundaries — close enough for a freshness label, and self-contained.
 */
export function getNflRegularSeasonWeek(season: number, now: Date = new Date()): number {
  // First Monday of September (Labor Day), evaluated in UTC.
  const septFirst = new Date(Date.UTC(season, 8, 1));
  const offsetToMonday = (8 - septFirst.getUTCDay()) % 7;
  const laborDay = new Date(Date.UTC(season, 8, 1 + offsetToMonday));
  // Week 1's Thursday opener is three days after the Labor Day Monday.
  const week1Kickoff = laborDay.getTime() + 3 * MS_PER_DAY;

  if (now.getTime() < week1Kickoff) {
    return 0;
  }

  const weeksElapsed = Math.floor((now.getTime() - week1Kickoff) / (7 * MS_PER_DAY));
  return Math.min(NFL_REGULAR_SEASON_WEEKS, weeksElapsed + 1);
}

export const SNAPSHOT_WEEK = getNflRegularSeasonWeek(SNAPSHOT_SEASON);
export const SNAPSHOT_SOURCE = DEFAULT_FANTASY_SNAPSHOT_SOURCE;
export const FANTASY_SNAPSHOT_POSITION_ORDER = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

const FLEX_ELIGIBLE_POSITIONS = ["RB", "WR", "TE"] as const;

const SNAPSHOT_POSITION_TO_ROUTE: Record<FantasySnapshotPosition, FantasyRoutePosition> = {
  QB: "qb",
  RB: "rb",
  WR: "wr",
  TE: "te",
  FLEX: "flex",
  K: "k",
  DST: "dst",
};

function numericRank(value: number | string | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  }

  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function numericOptionalValue(value: number | string | undefined): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numericTier(value: number | string | undefined): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : undefined;
  }

  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function dedupePlayers(players: Player[]): Player[] {
  const seen = new Set<string>();
  const deduped: Player[] = [];

  for (const player of players) {
    const key = `${player.id ?? ""}::${player.name}::${player.team}::${player.position}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(player);
  }

  return deduped;
}

function getSliceUpdatedAt(players: Player[]): string | null {
  for (const player of players) {
    if (typeof player.lastUpdated === "string" && player.lastUpdated) {
      return player.lastUpdated;
    }
  }

  return null;
}

function normalizeSourcedPlayers(
  players: Player[],
  positionOverride?: Player["position"],
  adpIndex?: FantasyAdpIndex | null
): Player[] {
  return dedupePlayers(players)
    .map((player) => {
      const position = positionOverride ?? player.position;
      const adpEntry = adpIndex
        ? matchPlayerAdp({ name: player.name, team: player.team, position }, adpIndex)
        : null;

      return publishFantasyPlayer({
        ...player,
        position,
        adp: adpEntry?.adp,
        averageRank: numericRank(player.rankEcr ?? player.averageRank),
        rankEcr: numericOptionalValue(player.rankEcr ?? player.averageRank),
        rankAverage: numericOptionalValue(player.rankAverage),
        standardDeviation: numericRank(player.standardDeviation),
        minRank:
          player.minRank === undefined ? undefined : numericRank(player.minRank),
        maxRank:
          player.maxRank === undefined ? undefined : numericRank(player.maxRank),
        positionRank:
          typeof player.positionRank === "number" && Number.isFinite(player.positionRank)
            ? player.positionRank
            : undefined,
        tier: numericTier(player.tier),
        byeWeek:
          typeof player.byeWeek === "number" && Number.isFinite(player.byeWeek)
            ? player.byeWeek
            : undefined,
        ownership:
          typeof player.ownership === "number" && Number.isFinite(player.ownership)
            ? player.ownership
            : undefined,
      });
    })
    .sort((left, right) => numericRank(left.averageRank) - numericRank(right.averageRank));
}

function buildPositionSlice(
  players: Player[],
  position: Player["position"],
  adpIndex?: FantasyAdpIndex | null
): Player[] {
  return normalizeSourcedPlayers(players, position, adpIndex);
}

function buildOverallSlice(players: Player[], adpIndex?: FantasyAdpIndex | null): Player[] {
  return normalizeSourcedPlayers(players, undefined, adpIndex);
}

function buildFlexSlice(overallPlayers: Player[]): Player[] {
  return overallPlayers
    .filter((player) =>
      FLEX_ELIGIBLE_POSITIONS.includes(player.position as (typeof FLEX_ELIGIBLE_POSITIONS)[number])
    )
    .map((player, index) =>
      publishFantasyPlayer({
        ...player,
        averageRank: index + 1,
      })
    );
}

function buildUnavailableSlice(
  reason: string,
  updatedAt?: string | null
): {
  players: Player[];
  metadata: FantasySnapshotSliceMetadata;
} {
  return {
    players: [],
    metadata: {
      available: false,
      sourceKind: "unavailable",
      rangeKind: "none",
      playerCount: 0,
      updatedAt: updatedAt ?? null,
      reason,
    },
  };
}

function buildAvailableSlice(
  players: Player[],
  sourceKind: FantasySnapshotSliceMetadata["sourceKind"],
  rangeKind: FantasySnapshotSliceMetadata["rangeKind"],
  updatedAt?: string | null
): {
  players: Player[];
  metadata: FantasySnapshotSliceMetadata;
} {
  return {
    players,
    metadata: {
      available: true,
      sourceKind,
      rangeKind,
      playerCount: players.length,
      updatedAt: updatedAt ?? null,
    },
  };
}

function buildUnavailableReason(scoring: FantasyRouteScoring, position: FantasyRoutePosition): string {
  const scoringLabel = FANTASY_SCORING_LABELS[scoring];
  const positionLabel = FANTASY_POSITION_LABELS[position];

  if (position === "flex") {
    return `Published ${scoringLabel} flex rankings are unavailable because the current snapshot does not include an overall consensus board.`;
  }

  return `Published ${scoringLabel} ${positionLabel} rankings are unavailable in the current snapshot.`;
}

export function buildFantasySnapshot(scoring: FantasyRouteScoring): FantasySnapshot {
  const generatedAt = new Date().toISOString();
  const scoringFormat = routeScoringToScoringFormat(scoring);
  const sourceMetadata = getFantasyPositionDataMetadata(scoringFormat);
  const adpDataset = getFantasyAdpDataset(scoringFormat);
  const adpIndex = adpDataset.entries.length > 0 ? buildFantasyAdpIndex(adpDataset.entries) : null;

  const sliceMetadata = {
    overall: buildUnavailableSlice(buildUnavailableReason(scoring, "overall")).metadata,
    qb: buildUnavailableSlice(buildUnavailableReason(scoring, "qb")).metadata,
    rb: buildUnavailableSlice(buildUnavailableReason(scoring, "rb")).metadata,
    wr: buildUnavailableSlice(buildUnavailableReason(scoring, "wr")).metadata,
    te: buildUnavailableSlice(buildUnavailableReason(scoring, "te")).metadata,
    flex: buildUnavailableSlice(buildUnavailableReason(scoring, "flex")).metadata,
    k: buildUnavailableSlice(buildUnavailableReason(scoring, "k")).metadata,
    dst: buildUnavailableSlice(buildUnavailableReason(scoring, "dst")).metadata,
  } satisfies FantasySnapshot["sliceMetadata"];

  const positions = {
    QB: [] as Player[],
    RB: [] as Player[],
    WR: [] as Player[],
    TE: [] as Player[],
    FLEX: [] as Player[],
    K: [] as Player[],
    DST: [] as Player[],
  } satisfies FantasySnapshot["positions"];

  const overallSourcePlayers = getFantasyOverallData(scoringFormat);
  const overallPlayers = buildOverallSlice(overallSourcePlayers, adpIndex);
  const overallUpdatedAt = getSliceUpdatedAt(overallPlayers) ?? sourceMetadata.upstreamUpdatedAt;

  sliceMetadata.overall =
    overallPlayers.length > 0
      ? buildAvailableSlice(overallPlayers, "overall_consensus", "overall", overallUpdatedAt).metadata
      : buildUnavailableSlice(buildUnavailableReason(scoring, "overall"), overallUpdatedAt).metadata;

  for (const position of FANTASY_SNAPSHOT_POSITION_ORDER) {
    const routePosition = SNAPSHOT_POSITION_TO_ROUTE[position];
    const sourcePlayers = getFantasyPositionData(position, scoringFormat);

    if (sourcePlayers.length === 0) {
      continue;
    }

    const builtPlayers = buildPositionSlice(sourcePlayers, position, adpIndex);
    const updatedAt = getSliceUpdatedAt(builtPlayers);
    positions[position] = builtPlayers;
    sliceMetadata[routePosition] = buildAvailableSlice(
      builtPlayers,
      position === "QB" || position === "K" || position === "DST"
        ? "shared_position_consensus"
        : "position_consensus",
      "position",
      updatedAt
    ).metadata;
  }

  if (overallPlayers.length > 0) {
    const flexPlayers = buildFlexSlice(overallPlayers);
    positions.FLEX = flexPlayers;
    sliceMetadata.flex = buildAvailableSlice(
      flexPlayers,
      "derived_flex",
      "overall",
      overallUpdatedAt
    ).metadata;
  }

  const matchedPlayerIds = new Set<string>();
  for (const player of [overallPlayers, ...Object.values(positions)].flat()) {
    if (typeof player.adp === "number" && Number.isFinite(player.adp)) {
      matchedPlayerIds.add(player.id);
    }
  }

  const adpSource: FantasyAdpSourceMetadata | null =
    adpIndex && matchedPlayerIds.size > 0
      ? {
          provider: FANTASY_ADP_PROVIDER,
          url: adpDataset.sourceUrl || FANTASY_ADP_PROVIDER_URL,
          asOf: adpDataset.asOf,
          sampleSize: adpDataset.sampleSize,
          matchedCount: matchedPlayerIds.size,
        }
      : null;

  return {
    schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
    season: SNAPSHOT_SEASON,
    week: SNAPSHOT_WEEK,
    generatedAt,
    upstreamUpdatedAt: overallUpdatedAt,
    scoringFormat,
    source: SNAPSHOT_SOURCE,
    adpSource,
    positions,
    overall: overallPlayers,
    sliceMetadata,
  };
}
