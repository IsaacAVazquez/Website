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
  deriveFlexPlayers,
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
// The season helpers are pure calendar math and the client surfaces need them
// too, so they live in fantasyUtils and are re-exported here for the build
// scripts that already import them from this module.
import { getCurrentDraftSeason, getNflRegularSeasonWeek } from "@/lib/fantasyUtils";

/**
 * The NFL season a snapshot belongs to. The season is named for the year it
 * kicks off in, but it runs into the next calendar year, so a snapshot built in
 * January is the *previous* year's season (championship weeks, playoffs), not
 * a brand-new "Preseason". It rolls to the new season in March, on the same
 * rule the draft tracker keys its saved rooms by.
 */
export { getCurrentDraftSeason as getSnapshotSeason, getNflRegularSeasonWeek };

const ADP_MATCH_GATE_MIN_ROWS = 50;
const ADP_MATCH_GATE_MIN_RATE = 0.6;
const ADP_TOP_BOARD_SIZE = 150;
const ADP_TOP_BOARD_MIN_RATE = 0.9;
const VORP_TOP_BOARD_SIZE = 150;
const VORP_TOP_BOARD_MIN_RATE = 0.9;

const SNAPSHOT_SEASON = getCurrentDraftSeason();

const SNAPSHOT_WEEK = getNflRegularSeasonWeek(SNAPSHOT_SEASON);
const FANTASY_SNAPSHOT_POSITION_ORDER = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

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
  gameLogSeason?: number | null,
  gameLogThroughWeek?: number | null
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
                ...(typeof gameLogThroughWeek === "number"
                  ? { throughWeek: gameLogThroughWeek }
                  : {}),
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

function unavailableSliceMetadata(
  reason: string,
  updatedAt?: string | null
): FantasySnapshotSliceMetadata {
  return {
    available: false,
    sourceKind: "unavailable",
    rangeKind: "none",
    playerCount: 0,
    updatedAt: updatedAt ?? null,
    reason,
  };
}

function availableSliceMetadata(
  players: Player[],
  sourceKind: FantasySnapshotSliceMetadata["sourceKind"],
  rangeKind: FantasySnapshotSliceMetadata["rangeKind"],
  updatedAt?: string | null
): FantasySnapshotSliceMetadata {
  return {
    available: true,
    sourceKind,
    rangeKind,
    playerCount: players.length,
    updatedAt: updatedAt ?? null,
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
  const gameLogThroughWeek = gameLogDataset.throughWeek;

  const sliceMetadata = {
    overall: unavailableSliceMetadata(buildUnavailableReason(scoring, "overall")),
    qb: unavailableSliceMetadata(buildUnavailableReason(scoring, "qb")),
    rb: unavailableSliceMetadata(buildUnavailableReason(scoring, "rb")),
    wr: unavailableSliceMetadata(buildUnavailableReason(scoring, "wr")),
    te: unavailableSliceMetadata(buildUnavailableReason(scoring, "te")),
    flex: unavailableSliceMetadata(buildUnavailableReason(scoring, "flex")),
    k: unavailableSliceMetadata(buildUnavailableReason(scoring, "k")),
    dst: unavailableSliceMetadata(buildUnavailableReason(scoring, "dst")),
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
  const overallPlayers = normalizeSourcedPlayers(
    overallSourcePlayers,
    undefined,
    adpIndex,
    gameLogIndex,
    gameLogSeason,
    gameLogThroughWeek
  );
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
    // VORP is a fail-soft overlay: a size with no usable report is left out
    // and the site hides the toggle for it, so the consensus board still ships.
    if (dataset.season !== SNAPSHOT_SEASON || dataset.players.length === 0) {
      console.warn(
        `Fantasy VORP ${scoringFormat} ${teamSize}-team data is missing or belongs to season ${dataset.season}; publishing without it.`
      );
      continue;
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
    // ponytail: a fresh board that parses but does not join has already
    // replaced the previous board in the generated module by now; move the
    // join into the builder script if that ever happens in practice.
    if (topMatchRate < VORP_TOP_BOARD_MIN_RATE) {
      console.warn(
        `Fantasy VORP ${scoringFormat} ${teamSize}-team join covered ${topMatches} of the top ${topOverallPlayerIds.size} players, below the ${Math.round(VORP_TOP_BOARD_MIN_RATE * 100)}% minimum; publishing without it.`
      );
      continue;
    }
    const key = fantasyVorpTeamSizeKey(teamSize);
    vorpRankings[key] = matched;
    vorpUrls[key] = dataset.sourceUrl;
    vorpMatchedCounts[key] = matched.length;
    vorpAccessedAt.push(dataset.accessedAt);
  }
  const vorpSource: FantasyVorpSourceMetadata | null =
    vorpAccessedAt.length > 0
      ? {
          provider: FANTASY_PROS_VORP_PROVIDER,
          asOf: vorpAccessedAt.sort()[0],
          urls: vorpUrls,
          matchedCounts: vorpMatchedCounts,
        }
      : null;

  sliceMetadata.overall =
    overallPlayers.length > 0
      ? availableSliceMetadata(overallPlayers, "overall_consensus", "overall", overallUpdatedAt)
      : unavailableSliceMetadata(buildUnavailableReason(scoring, "overall"), overallUpdatedAt);

  for (const position of FANTASY_SNAPSHOT_POSITION_ORDER) {
    const routePosition = SNAPSHOT_POSITION_TO_ROUTE[position];
    const sourcePlayers = getFantasyPositionData(position, scoringFormat);

    if (sourcePlayers.length === 0) {
      continue;
    }

    const builtPlayers = normalizeSourcedPlayers(
      sourcePlayers,
      position,
      adpIndex,
      gameLogIndex,
      gameLogSeason,
      gameLogThroughWeek
    );
    const updatedAt = getSliceUpdatedAt(builtPlayers);
    positions[position] = builtPlayers;
    sliceMetadata[routePosition] = availableSliceMetadata(
      builtPlayers,
      position === "QB" || position === "K" || position === "DST"
        ? "shared_position_consensus"
        : "position_consensus",
      "position",
      updatedAt
    );
  }

  if (overallPlayers.length > 0) {
    const flexPlayers = deriveFlexPlayers(overallPlayers);
    positions.FLEX = flexPlayers;
    sliceMetadata.flex = availableSliceMetadata(
      flexPlayers,
      "derived_flex",
      "overall",
      overallUpdatedAt
    );
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
