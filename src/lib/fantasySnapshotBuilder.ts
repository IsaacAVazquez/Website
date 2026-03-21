import {
  DEFAULT_FANTASY_SNAPSHOT_SOURCE,
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
  FANTASY_POSITION_LABELS,
  FANTASY_SCORING_LABELS,
  FantasyRoutePosition,
  FantasyRouteScoring,
  FantasySnapshot,
  FantasySnapshotPosition,
  FantasySnapshotSliceMetadata,
  routeScoringToScoringFormat,
} from "@/lib/fantasy";
import { getFantasyPositionData } from "@/lib/fantasyPositionData";
import { calculateOverallRankings } from "@/lib/overallValueCalculator";
import { getTierGroups } from "@/lib/tierGrouping";
import { Player } from "@/types";

export const SNAPSHOT_SEASON = new Date().getUTCFullYear();
export const SNAPSHOT_WEEK = 0;
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

function normalizePlayers(players: Player[], positionOverride?: Player["position"]): Player[] {
  return dedupePlayers(players)
    .map((player) => ({
      ...player,
      position: positionOverride ?? player.position,
      averageRank: numericRank(player.averageRank),
      standardDeviation: numericRank(player.standardDeviation),
      minRank:
        player.minRank === undefined ? undefined : numericRank(player.minRank),
      maxRank:
        player.maxRank === undefined ? undefined : numericRank(player.maxRank),
      projectedPoints: Number.isFinite(player.projectedPoints) ? player.projectedPoints : 0,
      expertRanks: Array.isArray(player.expertRanks) ? player.expertRanks : [],
      tier: numericTier(player.tier),
    }))
    .sort((left, right) => numericRank(left.averageRank) - numericRank(right.averageRank));
}

function assignMissingTiers(players: Player[], position: Player["position"]): Player[] {
  if (players.length === 0) {
    return [];
  }

  if (players.every((player) => numericTier(player.tier) !== undefined)) {
    return players.map((player) => ({
      ...player,
      tier: numericTier(player.tier),
    }));
  }

  const tierAssignments = getTierGroups(players, position);
  const tierMap = new Map(tierAssignments.map((assignment) => [assignment.player.id, assignment.tier]));

  return players.map((player) => ({
    ...player,
    tier: tierMap.get(player.id) ?? numericTier(player.tier) ?? 1,
  }));
}

function buildPositionRankLookup(players: Player[]): Map<string, number> {
  const byPosition = new Map<Player["position"], Player[]>();

  for (const player of players) {
    const existing = byPosition.get(player.position) ?? [];
    existing.push(player);
    byPosition.set(player.position, existing);
  }

  const lookup = new Map<string, number>();
  for (const positionPlayers of byPosition.values()) {
    positionPlayers
      .slice()
      .sort((left, right) => numericRank(left.averageRank) - numericRank(right.averageRank))
      .forEach((player, index) => {
        lookup.set(player.id, index + 1);
      });
  }

  return lookup;
}

function buildPositionSlice(players: Player[], position: Player["position"]): Player[] {
  const normalized = normalizePlayers(players, position);
  const tiered = assignMissingTiers(normalized, position);

  return tiered.map((player, index) => ({
    ...player,
    positionRank: index + 1,
  }));
}

function overallTierValue(player: Player): number {
  if (typeof player.overallValue === "number" && Number.isFinite(player.overallValue)) {
    return player.overallValue;
  }

  return Number.isFinite(player.projectedPoints) ? player.projectedPoints : 0;
}

function assignOverallTiers(players: Player[]): Player[] {
  if (players.length === 0) {
    return [];
  }

  const sortedPlayers = [...players].sort(
    (left, right) => numericRank(left.averageRank) - numericRank(right.averageRank)
  );
  const minTierSize = 8;
  const maxTiers = 6;
  const gaps = sortedPlayers.slice(1).map((player, index) => ({
    index: index + 1,
    gap: overallTierValue(sortedPlayers[index]) - overallTierValue(player),
  }));
  const averageGap = gaps.reduce((sum, { gap }) => sum + gap, 0) / gaps.length || 0;
  const significantBreaks = gaps
    .filter(
      ({ index, gap }) =>
        gap > Math.max(averageGap * 2, 5) &&
        index >= minTierSize &&
        sortedPlayers.length - index >= minTierSize
    )
    .sort((left, right) => right.gap - left.gap);

  const selectedBreaks: number[] = [];
  for (const { index } of significantBreaks) {
    if (selectedBreaks.length >= maxTiers - 1) {
      break;
    }

    if (selectedBreaks.every((existing) => Math.abs(existing - index) >= minTierSize)) {
      selectedBreaks.push(index);
    }
  }

  const fallbackBreaks = [12, 24, 48, 84, 132];
  for (const index of fallbackBreaks) {
    if (selectedBreaks.length >= maxTiers - 1 || index >= sortedPlayers.length) {
      break;
    }

    if (
      index >= minTierSize &&
      sortedPlayers.length - index >= minTierSize &&
      selectedBreaks.every((existing) => Math.abs(existing - index) >= minTierSize)
    ) {
      selectedBreaks.push(index);
    }
  }

  const tierBreaks = selectedBreaks.sort((left, right) => left - right);
  let currentTier = 1;
  let breakIndex = 0;

  return sortedPlayers.map((player, index) => {
    if (breakIndex < tierBreaks.length && index >= tierBreaks[breakIndex]) {
      currentTier += 1;
      breakIndex += 1;
    }

    return {
      ...player,
      tier: currentTier,
    };
  });
}

function buildOverallSlice(players: Player[]): Player[] {
  const inputPositionRanks = new Map<string, number>();
  for (const player of players) {
    if (typeof player.positionRank === "number" && Number.isFinite(player.positionRank)) {
      inputPositionRanks.set(player.id, player.positionRank);
    }
  }

  const normalized = normalizePlayers(players);
  const tiered = assignOverallTiers(normalized);
  const fallbackPositionRanks = buildPositionRankLookup(players);

  return tiered.map((player) => ({
    ...player,
    positionRank: inputPositionRanks.get(player.id) ?? fallbackPositionRanks.get(player.id),
  }));
}

function buildDerivedOverallPlayers(
  positions: FantasySnapshot["positions"],
  scoring: FantasyRouteScoring
): Player[] {
  const allCurrentPositionPlayers = FANTASY_SNAPSHOT_POSITION_ORDER.flatMap(
    (position) => positions[position]
  );

  return calculateOverallRankings(
    allCurrentPositionPlayers,
    routeScoringToScoringFormat(scoring)
  )
    .sort((left, right) => left.overallRank - right.overallRank)
    .map((calculation) => ({
      ...calculation.player,
      averageRank: calculation.overallRank,
      overallValue: calculation.overallValue,
    }));
}

function buildFlexSlice(
  positionPlayers: Player[],
  scoring: FantasyRouteScoring
): Player[] {
  const scoringFormat = routeScoringToScoringFormat(scoring);
  const flexCandidates = positionPlayers.filter((player) =>
    FLEX_ELIGIBLE_POSITIONS.includes(player.position as (typeof FLEX_ELIGIBLE_POSITIONS)[number])
  );
  const rankedFlexPlayers = calculateOverallRankings(flexCandidates, scoringFormat)
    .filter((calculation) =>
      FLEX_ELIGIBLE_POSITIONS.includes(
        calculation.player.position as (typeof FLEX_ELIGIBLE_POSITIONS)[number]
      )
    )
    .sort((left, right) => left.overallRank - right.overallRank)
    .map((calculation) => ({
      ...calculation.player,
      averageRank: calculation.overallRank,
    }));
  const normalizedFlexPlayers = normalizePlayers(rankedFlexPlayers);
  const tieredFlexPlayers = assignMissingTiers(normalizedFlexPlayers, "FLEX");

  return tieredFlexPlayers.map((player, index) => ({
    ...player,
    averageRank: index + 1,
  }));
}

function buildUnavailableSlice(reason: string): {
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
      reason,
    },
  };
}

function buildAvailableSlice(
  players: Player[],
  sourceKind: FantasySnapshotSliceMetadata["sourceKind"],
  rangeKind: FantasySnapshotSliceMetadata["rangeKind"]
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
    },
  };
}

function getPositionSourcePlayers(
  scoring: FantasyRouteScoring,
  position: (typeof FANTASY_SNAPSHOT_POSITION_ORDER)[number]
): Player[] {
  return getFantasyPositionData(position, routeScoringToScoringFormat(scoring));
}

function buildUnavailableReason(scoring: FantasyRouteScoring, position: FantasyRoutePosition): string {
  const scoringLabel = FANTASY_SCORING_LABELS[scoring];
  const positionLabel = FANTASY_POSITION_LABELS[position];

  if (position === "flex") {
    return `Published ${scoringLabel} flex rankings are unavailable because RB, WR, and TE position data is incomplete in the current snapshot.`;
  }

  return `Published ${scoringLabel} ${positionLabel} rankings are unavailable in the current snapshot.`;
}

export function buildFantasySnapshot(scoring: FantasyRouteScoring): FantasySnapshot {
  const generatedAt = new Date().toISOString();

  const sliceMetadata = {
    overall: buildUnavailableSlice(
      `Published ${FANTASY_SCORING_LABELS[scoring]} overall rankings are unavailable in the current snapshot.`
    ).metadata,
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

  for (const position of FANTASY_SNAPSHOT_POSITION_ORDER) {
    const routePosition = SNAPSHOT_POSITION_TO_ROUTE[position];
    const sourcePlayers = getPositionSourcePlayers(scoring, position);

    if (sourcePlayers.length === 0) {
      continue;
    }

    const builtPlayers = buildPositionSlice(sourcePlayers, position);
    positions[position] = builtPlayers;
    sliceMetadata[routePosition] = buildAvailableSlice(
      builtPlayers,
      position === "QB" || position === "K" || position === "DST"
        ? "shared_position_consensus"
        : "position_consensus",
      "position"
    ).metadata;
  }

  const overallPlayers = buildOverallSlice(buildDerivedOverallPlayers(positions, scoring));
  sliceMetadata.overall =
    overallPlayers.length > 0
      ? buildAvailableSlice(overallPlayers, "derived_overall", "overall").metadata
      : buildUnavailableSlice(
          `Published ${FANTASY_SCORING_LABELS[scoring]} overall rankings are unavailable in the current snapshot.`
        ).metadata;

  const canBuildFlex =
    sliceMetadata.overall.available &&
    sliceMetadata.rb.available &&
    sliceMetadata.wr.available &&
    sliceMetadata.te.available;

  if (canBuildFlex) {
    const flexPlayers = buildFlexSlice(
      [...positions.RB, ...positions.WR, ...positions.TE],
      scoring
    );
    positions.FLEX = flexPlayers;
    sliceMetadata.flex = buildAvailableSlice(flexPlayers, "derived_flex", "position").metadata;
  }

  return {
    schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
    season: SNAPSHOT_SEASON,
    week: SNAPSHOT_WEEK,
    generatedAt,
    scoringFormat: routeScoringToScoringFormat(scoring),
    source: SNAPSHOT_SOURCE,
    positions,
    overall: overallPlayers,
    sliceMetadata,
  };
}
