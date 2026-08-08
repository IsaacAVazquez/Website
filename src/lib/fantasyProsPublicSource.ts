import { Player, Position, ScoringFormat } from "@/types";

export const FANTASY_PROS_PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export const FANTASY_PROS_PUBLIC_SOURCE =
  "FantasyPros public consensus cheatsheets. Overall boards come from the public overall consensus pages. QB, K, and DST boards are scoring-agnostic and reused across scoring formats. Flex is derived locally from the published overall board.";

export const FANTASY_PUBLIC_POSITIONS = ["OVERALL", "QB", "RB", "WR", "TE", "K", "DST"] as const;

export type FantasyPublicPosition = (typeof FANTASY_PUBLIC_POSITIONS)[number];

export const FANTASY_PROS_MIN_EXPERTS = 10;
export const FANTASY_PROS_MIN_REFRESH_COVERAGE = 0.8;
export const FANTASY_PROS_REFRESH_TOP_BOARD_SIZE = 150;
export const FANTASY_PROS_MIN_BOARD_PLAYERS: Readonly<Record<FantasyPublicPosition, number>> =
  Object.freeze({
    OVERALL: 300,
    QB: 48,
    RB: 100,
    WR: 120,
    TE: 48,
    K: 32,
    DST: 32,
  });

interface FantasyProsPublicPlayerPayload {
  player_id: number | string;
  player_name: string;
  player_team_id?: string | null;
  player_position_id: string;
  player_positions?: string | null;
  player_bye_week?: number | string | null;
  player_owned_avg?: number | string | null;
  rank_ecr: number | string;
  rank_min: number | string;
  rank_max: number | string;
  rank_ave: number | string;
  rank_std: number | string;
  pos_rank?: string | number | null;
  tier?: number | string | null;
}

interface FantasyProsPublicConsensusPayload {
  sport: string;
  type: string;
  ranking_type_name: string;
  year: string | number;
  week: string | number;
  position_id: string;
  scoring: string;
  count: string | number;
  total_experts: string | number;
  filters: unknown;
  last_updated: string;
  last_updated_ts: number | string;
  accessed?: string;
  players: FantasyProsPublicPlayerPayload[];
}

export interface FantasyProsPublicBoard {
  scoringFormat: ScoringFormat;
  sourceScoring: string;
  requestedPosition: FantasyPublicPosition;
  sourcePosition: string;
  sourceUrl: string;
  sourceLabel: string;
  accessedAt: string | null;
  lastUpdatedLabel: string;
  upstreamUpdatedAt: string;
  season: number;
  week: number;
  totalExperts: number;
  players: Player[];
}

const PUBLIC_POSITION_URLS: Record<ScoringFormat, Record<FantasyPublicPosition, string>> = {
  PPR: {
    OVERALL: "https://www.fantasypros.com/nfl/rankings/ppr-cheatsheets.php",
    QB: "https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php",
    RB: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
    WR: "https://www.fantasypros.com/nfl/rankings/ppr-wr-cheatsheets.php",
    TE: "https://www.fantasypros.com/nfl/rankings/ppr-te-cheatsheets.php",
    K: "https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php",
    DST: "https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php",
  },
  HALF_PPR: {
    OVERALL: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-cheatsheets.php",
    QB: "https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php",
    RB: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-rb-cheatsheets.php",
    WR: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-wr-cheatsheets.php",
    TE: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-te-cheatsheets.php",
    K: "https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php",
    DST: "https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php",
  },
  STANDARD: {
    OVERALL: "https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php",
    QB: "https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php",
    RB: "https://www.fantasypros.com/nfl/rankings/rb-cheatsheets.php",
    WR: "https://www.fantasypros.com/nfl/rankings/wr-cheatsheets.php",
    TE: "https://www.fantasypros.com/nfl/rankings/te-cheatsheets.php",
    K: "https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php",
    DST: "https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php",
  },
};

const REQUIRED_PAGE_KEYS = [
  "sport",
  "type",
  "ranking_type_name",
  "year",
  "week",
  "position_id",
  "scoring",
  "count",
  "total_experts",
  "filters",
  "last_updated",
  "last_updated_ts",
  "players",
] as const;
const REQUIRED_PLAYER_KEYS = [
  "player_id",
  "player_name",
  "player_position_id",
  "rank_ecr",
  "rank_min",
  "rank_max",
  "rank_ave",
  "rank_std",
  "pos_rank",
] as const;

function asFiniteNumber(
  value: number | string | null | undefined,
  fieldName: string
): number {
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return value;
    }
    throw new Error(`FantasyPros public source is missing a valid "${fieldName}" number.`);
  }

  const parsed = Number.parseFloat(value ?? "");
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  throw new Error(`FantasyPros public source is missing a valid "${fieldName}" number.`);
}

function asOptionalFiniteNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapFantasyProsPosition(position: string): Position {
  const normalized = position.trim().toUpperCase();

  switch (normalized) {
    case "QB":
      return "QB";
    case "RB":
      return "RB";
    case "WR":
      return "WR";
    case "TE":
      return "TE";
    case "K":
      return "K";
    case "DST":
    case "DEF":
    case "D/ST":
      return "DST";
    default:
      throw new Error(`Unsupported FantasyPros position "${position}".`);
  }
}

function parsePositionRank(posRank: number | string | null | undefined): number | undefined {
  if (typeof posRank === "number") {
    return Number.isFinite(posRank) ? posRank : undefined;
  }

  const match = String(posRank ?? "").match(/(\d+)$/);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function assertRequiredKeys<T extends object>(
  payload: T,
  requiredKeys: readonly string[],
  scope: string
) {
  for (const key of requiredKeys) {
    if (!(key in payload)) {
      throw new Error(`FantasyPros public source is missing required ${scope} key "${key}".`);
    }
  }
}

function extractConsensusPayload(html: string): FantasyProsPublicConsensusPayload {
  const match = html.match(/var\s+ecrData\s*=\s*(\{.*?\});/s);

  if (!match) {
    throw new Error('FantasyPros public source did not expose parseable "ecrData".');
  }

  const payload = JSON.parse(match[1]) as FantasyProsPublicConsensusPayload;
  assertRequiredKeys(payload, REQUIRED_PAGE_KEYS, "page");

  if (!Array.isArray(payload.players) || payload.players.length === 0) {
    throw new Error("FantasyPros public source returned no players.");
  }

  payload.players.forEach((player, index) => {
    assertRequiredKeys(player, REQUIRED_PLAYER_KEYS, `player[${index}]`);
  });

  return payload;
}

function buildUpstreamUpdatedAt(payload: FantasyProsPublicConsensusPayload): string {
  const unixSeconds = asFiniteNumber(payload.last_updated_ts, "last_updated_ts");
  return new Date(unixSeconds * 1000).toISOString();
}

function normalizeAccessedAt(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeSourcePosition(position: string): string {
  const normalized = position.trim().toUpperCase();
  if (["DEF", "D/ST"].includes(normalized)) return "DST";
  if (["ALL", "OVERALL", "OP"].includes(normalized)) return "OVERALL";
  return normalized;
}

function expectedSourceScoring(scoringFormat: ScoringFormat): readonly string[] {
  switch (scoringFormat) {
    case "PPR":
      return ["PPR"];
    case "HALF_PPR":
      return ["HALF", "HALF_PPR", "HALF-PPR", "0.5 PPR"];
    case "STANDARD":
      return ["STD", "STANDARD"];
  }
}

function validateConsensusPayload(
  payload: FantasyProsPublicConsensusPayload,
  options: {
    scoringFormat: ScoringFormat;
    requestedPosition: FantasyPublicPosition;
    expectedSeason?: number;
    expectedRankingType?: "draft" | "best";
  }
) {
  if (payload.sport.trim().toUpperCase() !== "NFL") {
    throw new Error(`FantasyPros public source returned sport "${payload.sport}" instead of NFL.`);
  }
  const expectedRankingType = options.expectedRankingType ?? "draft";
  if (payload.ranking_type_name.trim().toLowerCase() !== expectedRankingType) {
    throw new Error(
      `FantasyPros public source returned ranking type "${payload.ranking_type_name}" instead of ${expectedRankingType}.`
    );
  }
  if (!payload.type.toLowerCase().includes(expectedRankingType)) {
    throw new Error(`FantasyPros public source returned unexpected board type "${payload.type}".`);
  }

  const season = asFiniteNumber(payload.year, "year");
  const week = asFiniteNumber(payload.week, "week");
  const count = asFiniteNumber(payload.count, "count");
  const totalExperts = asFiniteNumber(payload.total_experts, "total_experts");
  if (!Number.isInteger(season) || !Number.isInteger(week) || week < 0 || week > 18) {
    throw new Error("FantasyPros public source returned an invalid season or week.");
  }
  if (options.expectedSeason !== undefined && season !== options.expectedSeason) {
    throw new Error(
      `FantasyPros public source returned season ${season}, expected ${options.expectedSeason}.`
    );
  }
  if (count !== payload.players.length) {
    throw new Error(
      `FantasyPros public source declared ${count} players but returned ${payload.players.length}.`
    );
  }
  if (totalExperts < FANTASY_PROS_MIN_EXPERTS) {
    throw new Error(
      `FantasyPros public source returned only ${totalExperts} contributing experts.`
    );
  }
  if (
    !Array.isArray(payload.filters) &&
    !(typeof payload.filters === "string" && payload.filters.trim().length > 0)
  ) {
    throw new Error('FantasyPros public source is missing a valid "filters" value.');
  }

  const requestedPosition = normalizeSourcePosition(options.requestedPosition);
  const sourcePosition = normalizeSourcePosition(payload.position_id);
  if (sourcePosition !== requestedPosition) {
    throw new Error(
      `FantasyPros public source returned ${sourcePosition} for a ${requestedPosition} request.`
    );
  }

  // QB, K, and DST pages are shared across scoring formats. The other pages
  // must match the requested scoring format or the snapshot would silently mix
  // boards that answer different league rules.
  if (!["QB", "K", "DST"].includes(requestedPosition)) {
    const sourceScoring = payload.scoring.trim().toUpperCase();
    if (!expectedSourceScoring(options.scoringFormat).includes(sourceScoring)) {
      throw new Error(
        `FantasyPros public source returned scoring "${payload.scoring}" for ${options.scoringFormat}.`
      );
    }
  }

  for (const [index, player] of payload.players.entries()) {
    const playerId = Number(player.player_id);
    if (!Number.isInteger(playerId) || playerId <= 0) {
      throw new Error(
        `FantasyPros public source player[${index}] has invalid player_id "${player.player_id}".`
      );
    }
    if (typeof player.player_name !== "string" || player.player_name.trim().length === 0) {
      throw new Error(`FantasyPros public source player[${index}] has an empty player_name.`);
    }

    const consensusRank = asFiniteNumber(player.rank_ecr, `player[${index}].rank_ecr`);
    const averageRank = asFiniteNumber(player.rank_ave, `player[${index}].rank_ave`);
    const minimumRank = asFiniteNumber(player.rank_min, `player[${index}].rank_min`);
    const maximumRank = asFiniteNumber(player.rank_max, `player[${index}].rank_max`);
    const rankDeviation = asFiniteNumber(player.rank_std, `player[${index}].rank_std`);
    if (
      consensusRank <= 0 ||
      averageRank <= 0 ||
      minimumRank <= 0 ||
      maximumRank < minimumRank ||
      averageRank < minimumRank ||
      averageRank > maximumRank ||
      rankDeviation < 0
    ) {
      throw new Error(
        `FantasyPros public source player[${index}] has an invalid expert rank distribution.`
      );
    }
    const positionRank = parsePositionRank(player.pos_rank);
    if (positionRank !== undefined && positionRank <= 0) {
      throw new Error(
        `FantasyPros public source player[${index}] has an invalid position rank.`
      );
    }
    const tier = asOptionalFiniteNumber(player.tier);
    if (tier !== undefined && (!Number.isInteger(tier) || tier <= 0)) {
      throw new Error(`FantasyPros public source player[${index}] has an invalid tier.`);
    }

    const mappedPosition = mapFantasyProsPosition(player.player_position_id);
    if (requestedPosition !== "OVERALL" && mappedPosition !== requestedPosition) {
      throw new Error(
        `FantasyPros public source player[${index}] is ${mappedPosition} on a ${requestedPosition} board.`
      );
    }
  }

  const playerIds = payload.players.map((player) => Number(player.player_id));
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error("FantasyPros public source returned duplicate player_id values.");
  }
}

function toPublishedFantasyPlayer(
  rawPlayer: FantasyProsPublicPlayerPayload,
  upstreamUpdatedAt: string
): Player {
  const mappedPosition = mapFantasyProsPosition(rawPlayer.player_position_id);
  const consensusRank = asFiniteNumber(rawPlayer.rank_ecr, "rank_ecr");
  const averageRank = asFiniteNumber(rawPlayer.rank_ave, "rank_ave");
  const standardDeviation = asFiniteNumber(rawPlayer.rank_std, "rank_std");
  const minRank = asFiniteNumber(rawPlayer.rank_min, "rank_min");
  const maxRank = asFiniteNumber(rawPlayer.rank_max, "rank_max");
  const positionRank = parsePositionRank(rawPlayer.pos_rank);
  const tier = asOptionalFiniteNumber(rawPlayer.tier);

  return {
    id: `fp-${rawPlayer.player_id}`,
    name: rawPlayer.player_name.trim(),
    team: (rawPlayer.player_team_id ?? "FA").trim() || "FA",
    position: mappedPosition,
    averageRank: consensusRank,
    rankEcr: consensusRank,
    rankAverage: averageRank,
    standardDeviation,
    tier,
    positionRank,
    minRank,
    maxRank,
    byeWeek: asOptionalFiniteNumber(rawPlayer.player_bye_week),
    ownership: asOptionalFiniteNumber(rawPlayer.player_owned_avg),
    lastUpdated: upstreamUpdatedAt,
  } as Player;
}

export function getFantasyProsPublicConsensusUrl(
  scoringFormat: ScoringFormat,
  position: FantasyPublicPosition
): string {
  return PUBLIC_POSITION_URLS[scoringFormat][position];
}

export function parseFantasyProsPublicConsensusPage(
  html: string,
  options: {
    scoringFormat: ScoringFormat;
    requestedPosition: FantasyPublicPosition;
    sourceUrl: string;
    expectedSeason?: number;
    expectedRankingType?: "draft" | "best";
  }
): FantasyProsPublicBoard {
  const payload = extractConsensusPayload(html);
  validateConsensusPayload(payload, options);
  const upstreamUpdatedAt = buildUpstreamUpdatedAt(payload);
  const players = payload.players
    .map((player) => toPublishedFantasyPlayer(player, upstreamUpdatedAt))
    .sort((left, right) => Number(left.averageRank) - Number(right.averageRank));

  return {
    scoringFormat: options.scoringFormat,
    sourceScoring: payload.scoring.trim().toUpperCase(),
    requestedPosition: options.requestedPosition,
    sourcePosition: payload.position_id,
    sourceUrl: options.sourceUrl,
    sourceLabel: FANTASY_PROS_PUBLIC_SOURCE,
    accessedAt: normalizeAccessedAt(payload.accessed),
    lastUpdatedLabel: payload.last_updated,
    upstreamUpdatedAt,
    season: Number.parseInt(String(payload.year), 10),
    week: Number.parseInt(String(payload.week), 10),
    totalExperts: Number.parseInt(String(payload.total_experts), 10),
    players,
  };
}

/**
 * Rejects a fresh board that is materially smaller than the same-season board
 * already committed. The top-board overlap check also catches a coherent but
 * wrong or truncated response whose raw row count still looks plausible.
 */
export function assertFantasyProsRefreshCoverage(
  board: FantasyProsPublicBoard,
  previousPlayers: readonly Player[],
  previousSeason: number | null | undefined
): void {
  const absoluteFloor = FANTASY_PROS_MIN_BOARD_PLAYERS[board.requestedPosition];
  if (board.players.length < absoluteFloor) {
    throw new Error(
      `FantasyPros ${board.scoringFormat} ${board.requestedPosition} refresh has ${board.players.length} players, below the ${absoluteFloor}-player draft-room floor.`
    );
  }
  if (previousPlayers.length === 0 || previousSeason !== board.season) return;

  const requiredPlayers = Math.ceil(
    previousPlayers.length * FANTASY_PROS_MIN_REFRESH_COVERAGE
  );
  const previousTop = previousPlayers.slice(0, FANTASY_PROS_REFRESH_TOP_BOARD_SIZE);
  const freshIds = new Set(board.players.map((player) => player.id));
  const retainedTop = previousTop.filter((player) => freshIds.has(player.id)).length;
  const requiredTop = Math.ceil(previousTop.length * FANTASY_PROS_MIN_REFRESH_COVERAGE);
  if (board.players.length < requiredPlayers || retainedTop < requiredTop) {
    throw new Error(
      `FantasyPros ${board.scoringFormat} ${board.requestedPosition} refresh kept ${board.players.length} of ${previousPlayers.length} rows and ${retainedTop} of ${previousTop.length} prior top-board players.`
    );
  }
}

/**
 * Error thrown when the FantasyPros public consensus fetch returns a non-2xx
 * response. Exposes the HTTP status and the original response headers so the
 * retry logic in `scripts/buildFantasyPositionData.ts` can decide whether the
 * request is retryable and honor a `Retry-After` hint.
 */
export class FantasyProsPublicFetchError extends Error {
  readonly status: number;
  readonly headers: Headers;
  readonly url: string;

  constructor(message: string, status: number, headers: Headers, url: string) {
    super(message);
    this.name = "FantasyProsPublicFetchError";
    this.status = status;
    this.headers = headers;
    this.url = url;
  }
}

export async function fetchFantasyProsPublicConsensusBoard(
  scoringFormat: ScoringFormat,
  position: FantasyPublicPosition,
  expectedSeason: number
): Promise<FantasyProsPublicBoard> {
  const sourceUrl = getFantasyProsPublicConsensusUrl(scoringFormat, position);
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": FANTASY_PROS_PUBLIC_USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.fantasypros.com/nfl/rankings/",
    },
  });

  if (!response.ok) {
    throw new FantasyProsPublicFetchError(
      `Failed to fetch FantasyPros public ${position} consensus board from ${sourceUrl}: ${response.status}`,
      response.status,
      response.headers,
      sourceUrl
    );
  }

  const html = await response.text();
  return parseFantasyProsPublicConsensusPage(html, {
    scoringFormat,
    requestedPosition: position,
    sourceUrl,
    expectedSeason,
  });
}
