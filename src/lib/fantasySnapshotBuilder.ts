import {
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
import { getFantasyGameLogDataset } from "@/lib/fantasyGameLogData";
import type { FantasyGameLogEntry } from "@/lib/fantasyGameLogSource";
import {
  buildFantasyAdpIndex,
  matchPlayerAdp,
  type FantasyAdpIndex,
} from "@/lib/fantasyAdpMatcher";
import { FANTASY_ADP_PROVIDER, FANTASY_ADP_PROVIDER_URL } from "@/lib/fantasyAdpSource";
import {
  FANTASY_PROS_VORP_PROVIDER,
  FANTASY_VORP_TEAM_SIZES,
} from "@/lib/fantasyProsVorpSource";
import { getFantasyVorpDataset } from "@/lib/fantasyVorpData";
import {
  fantasyVorpTeamSizeKey,
  type FantasyVorpRankings,
  type FantasyVorpSourceMetadata,
} from "@/lib/fantasyVorp";
import {
  getFantasyOverallData,
  getFantasyPositionData,
  getFantasyPositionDataMetadata,
} from "@/lib/fantasyPositionData";
import { Player } from "@/types";
// The season-week helper is pure calendar math and the client surfaces need
// it too, so it lives in fantasyUtils and is re-exported here for the build
// scripts that already import it from this module.
import { getNflRegularSeasonWeek } from "@/lib/fantasyUtils";

export { getNflRegularSeasonWeek };

const ADP_MATCH_GATE_MIN_ROWS = 50;
const ADP_MATCH_GATE_MIN_RATE = 0.6;
const ADP_TOP_BOARD_SIZE = 150;
const ADP_TOP_BOARD_MIN_RATE = 0.9;
const VORP_TOP_BOARD_SIZE = 150;
const VORP_TOP_BOARD_MIN_RATE = 0.9;

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

const SNAPSHOT_SEASON = getSnapshotSeason();

const SNAPSHOT_WEEK = getNflRegularSeasonWeek(SNAPSHOT_SEASON);
const FANTASY_SNAPSHOT_POSITION_ORDER = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

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
  adpIndex?: FantasyAdpIndex | null,
  gameLogIndex?: FantasyAdpIndex<FantasyGameLogEntry> | null,
  gameLogSeason?: number | null
): Player[] {
  return dedupePlayers(players)
    .map((player) => {
      const position = positionOverride ?? player.position;
      const adpEntry = adpIndex
        ? matchPlayerAdp({ name: player.name, team: player.team, position }, adpIndex)
        : null;
      const gameLogEntry = gameLogIndex
        ? matchPlayerAdp({ name: player.name, team: player.team, position }, gameLogIndex)
        : null;

      return publishFantasyPlayer({
        ...player,
        position,
        gameLog:
          gameLogEntry && typeof gameLogSeason === "number"
            ? {
                season: gameLogSeason,
                games: gameLogEntry.games,
                low: gameLogEntry.low,
                median: gameLogEntry.median,
                average: gameLogEntry.average,
                high: gameLogEntry.high,
              }
            : undefined,
        adp: adpEntry?.adp,
        adpHigh: adpEntry?.high,
        adpLow: adpEntry?.low,
        adpStandardDeviation: adpEntry?.stdev,
        adpTimesDrafted: adpEntry?.timesDrafted,
        averageRank: numericRank(player.rankEcr ?? player.averageRank),
        rankEcr: numericOptionalValue(player.rankEcr ?? player.averageRank),
        rankAverage: numericOptionalValue(player.rankAverage),
        standardDeviation: numericOptionalValue(player.standardDeviation),
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
  adpIndex?: FantasyAdpIndex | null,
  gameLogIndex?: FantasyAdpIndex<FantasyGameLogEntry> | null,
  gameLogSeason?: number | null
): Player[] {
  return normalizeSourcedPlayers(players, position, adpIndex, gameLogIndex, gameLogSeason);
}

function buildOverallSlice(
  players: Player[],
  adpIndex?: FantasyAdpIndex | null,
  gameLogIndex?: FantasyAdpIndex<FantasyGameLogEntry> | null,
  gameLogSeason?: number | null
): Player[] {
  return normalizeSourcedPlayers(players, undefined, adpIndex, gameLogIndex, gameLogSeason);
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
  const gameLogDataset = getFantasyGameLogDataset(scoringFormat);
  const gameLogIndex =
    gameLogDataset.entries.length > 0 ? buildFantasyAdpIndex(gameLogDataset.entries) : null;
  const gameLogSeason = gameLogDataset.season;

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
  const overallPlayers = buildOverallSlice(overallSourcePlayers, adpIndex, gameLogIndex, gameLogSeason);
  const overallUpdatedAt = getSliceUpdatedAt(overallPlayers) ?? sourceMetadata.upstreamUpdatedAt;

  const snapshotPlayerIds = new Set(overallPlayers.map((player) => player.id));
  for (const position of FANTASY_SNAPSHOT_POSITION_ORDER) {
    for (const player of getFantasyPositionData(position, scoringFormat)) {
      snapshotPlayerIds.add(player.id);
    }
  }
  const topOverallPlayerIds = new Set(
    overallPlayers.slice(0, VORP_TOP_BOARD_SIZE).map((player) => player.id)
  );
  const vorpRankings: FantasyVorpRankings = {};
  const vorpUrls: FantasyVorpSourceMetadata["urls"] = {};
  const vorpMatchedCounts: FantasyVorpSourceMetadata["matchedCounts"] = {};
  const vorpAccessedAt: string[] = [];
  for (const teamSize of FANTASY_VORP_TEAM_SIZES) {
    const dataset = getFantasyVorpDataset(scoringFormat, teamSize);
    if (dataset.season !== SNAPSHOT_SEASON || dataset.players.length === 0) {
      throw new Error(
        `Fantasy VORP ${scoringFormat} ${teamSize}-team data is missing or belongs to season ${dataset.season}.`
      );
    }
    const matched = dataset.players
      .filter((entry) => snapshotPlayerIds.has(entry.playerId))
      .map((entry) => ({
        playerId: entry.playerId,
        rank: entry.rank,
        value: entry.value,
      }));
    const topMatches = matched.filter((entry) =>
      topOverallPlayerIds.has(entry.playerId)
    ).length;
    const topMatchRate =
      topOverallPlayerIds.size > 0 ? topMatches / topOverallPlayerIds.size : 0;
    if (topMatchRate < VORP_TOP_BOARD_MIN_RATE) {
      throw new Error(
        `Fantasy VORP ${scoringFormat} ${teamSize}-team join covered ${topMatches} of the top ${topOverallPlayerIds.size} players, below the ${Math.round(VORP_TOP_BOARD_MIN_RATE * 100)}% minimum.`
      );
    }
    const key = fantasyVorpTeamSizeKey(teamSize);
    vorpRankings[key] = matched;
    vorpUrls[key] = dataset.sourceUrl;
    vorpMatchedCounts[key] = matched.length;
    vorpAccessedAt.push(dataset.accessedAt);
  }
  const vorpSource: FantasyVorpSourceMetadata = {
    provider: FANTASY_PROS_VORP_PROVIDER,
    asOf: vorpAccessedAt.sort()[0],
    urls: vorpUrls,
    matchedCounts: vorpMatchedCounts,
  };

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

    const builtPlayers = buildPositionSlice(sourcePlayers, position, adpIndex, gameLogIndex, gameLogSeason);
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

  if (adpDataset.entries.length >= ADP_MATCH_GATE_MIN_ROWS) {
    const matchRate = matchedPlayerIds.size / adpDataset.entries.length;
    if (matchRate < ADP_MATCH_GATE_MIN_RATE) {
      throw new Error(
        `Fantasy ADP join matched ${matchedPlayerIds.size} of ${adpDataset.entries.length} source players, below the ${Math.round(ADP_MATCH_GATE_MIN_RATE * 100)}% minimum.`
      );
    }

    const topBoard = overallPlayers.slice(0, ADP_TOP_BOARD_SIZE);
    const topBoardMatches = topBoard.filter(
      (player) => typeof player.adp === "number" && Number.isFinite(player.adp)
    ).length;
    const topBoardMatchRate = topBoard.length > 0 ? topBoardMatches / topBoard.length : 0;

    if (topBoardMatchRate < ADP_TOP_BOARD_MIN_RATE) {
      throw new Error(
        `Fantasy ADP join covered ${topBoardMatches} of the top ${topBoard.length} overall players, below the ${Math.round(ADP_TOP_BOARD_MIN_RATE * 100)}% minimum.`
      );
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
    source: sourceMetadata.source,
    adpSource,
    vorpSource,
    vorpRankings,
    positions,
    overall: overallPlayers,
    sliceMetadata,
  };
}
