import { Player, Position, ScoringFormat } from "@/types";

export const FANTASY_PROS_PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export const FANTASY_PROS_PUBLIC_SOURCE =
  "FantasyPros public consensus cheatsheets. Overall boards come from the public overall consensus pages. QB, K, and DST boards are scoring-agnostic and reused across scoring formats. Flex is derived locally from the published overall board.";

export const FANTASY_PROS_OFFICIAL_API_SOURCE =
  "FantasyPros official API consensus rankings.";

export const FANTASY_PROS_SOURCE_MODES = [
  "auto",
  "public-html",
  "official-api",
] as const;

export type FantasyProsSourceMode = (typeof FANTASY_PROS_SOURCE_MODES)[number];

interface FantasyProsSourceEnvironment {
  FANTASYPROS_SOURCE?: string;
  FANTASYPROS_API_KEY?: string;
}

export type FantasyProsSourceSelection =
  | { kind: "public-html" }
  | { kind: "official-api"; apiKey: string };

export function resolveFantasyProsSourceSelection(
  environment: FantasyProsSourceEnvironment = {
    FANTASYPROS_SOURCE: process.env.FANTASYPROS_SOURCE,
    FANTASYPROS_API_KEY: process.env.FANTASYPROS_API_KEY,
  }
): FantasyProsSourceSelection {
  const configuredMode = environment.FANTASYPROS_SOURCE?.trim().toLowerCase();
  const mode = configuredMode || "auto";
  if (!FANTASY_PROS_SOURCE_MODES.includes(mode as FantasyProsSourceMode)) {
    throw new Error(
      `FANTASYPROS_SOURCE must be one of ${FANTASY_PROS_SOURCE_MODES.join(", ")}; received ${JSON.stringify(configuredMode)}.`
    );
  }

  const apiKey = environment.FANTASYPROS_API_KEY?.trim();
  if (mode === "public-html") {
    return { kind: "public-html" };
  }
  if (mode === "official-api") {
    if (!apiKey) {
      throw new Error(
        "FANTASYPROS_API_KEY is required when FANTASYPROS_SOURCE=official-api."
      );
    }
    return { kind: "official-api", apiKey };
  }

  return apiKey
    ? { kind: "official-api", apiKey }
    : { kind: "public-html" };
}

export const FANTASY_PUBLIC_POSITIONS = ["OVERALL", "QB", "RB", "WR", "TE", "K", "DST"] as const;

export type FantasyPublicPosition = (typeof FANTASY_PUBLIC_POSITIONS)[number];

export type FantasyProsOfficialApiPosition =
  | Exclude<FantasyPublicPosition, "OVERALL">
  | "ALL"
  | "OP";

/**
 * FantasyPros publishes each board under a ranking_type_name. "draft" and
 * "best" are the preseason boards; "weekly" and "ros" are the in-season ones,
 * which the draft surfaces never request but the weekly board does.
 */
type FantasyProsRankingType = "draft" | "best" | "weekly" | "ros";

/**
 * The board vocabulary the consensus fetcher can request. It is wider than
 * FANTASY_PUBLIC_POSITIONS, which is the preseason cheat-sheet URL table:
 * in-season FantasyPros publishes no single overall board, so FLEX stands in
 * for the Overall tab and has to keep its own identity through validation.
 */
export type FantasyProsBoardPosition = FantasyPublicPosition | "FLEX";

interface FantasyProsConsensusOptions {
  scoringFormat: ScoringFormat;
  requestedPosition: FantasyProsBoardPosition;
  expectedSeason?: number;
  expectedRankingType?: FantasyProsRankingType;
  minimumExperts?: number;
}

interface FantasyProsOfficialApiConsensusOptions
  extends FantasyProsConsensusOptions {
  officialApiPosition: FantasyProsOfficialApiPosition;
  sourceUrl: string;
}

type FantasyProsConsensusSourceContract =
  | { kind: "public-html" }
  | {
      kind: "official-api";
      officialApiPosition: FantasyProsOfficialApiPosition;
    };

export interface FetchFantasyProsConsensusBoardOptions
  extends FantasyProsConsensusOptions {
  expectedSeason: number;
  officialApiPosition: FantasyProsOfficialApiPosition;
  publicSourceUrl: string;
}

const FANTASY_PROS_MIN_EXPERTS = 10;
const FANTASY_PROS_MIN_REFRESH_COVERAGE = 0.8;
const FANTASY_PROS_REFRESH_TOP_BOARD_SIZE = 150;
const FANTASY_PROS_OFFICIAL_API_BASE_URL =
  "https://api.fantasypros.com/public/v2/json/nfl";
const FANTASY_PROS_OFFICIAL_API_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const FLEX_ELIGIBLE_BOARD_POSITIONS: readonly Position[] = ["RB", "WR", "TE"];

const FANTASY_PROS_MIN_BOARD_PLAYERS: Readonly<Record<FantasyProsBoardPosition, number>> =
  Object.freeze({
    OVERALL: 300,
    // The weekly FLEX board is RB/WR/TE only and runs a few hundred deep
    // (284 rows when this was written), so it cannot reuse the 300-player
    // overall floor without rejecting a healthy response.
    FLEX: 200,
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
  // Weekly boards only. Draft and best-ball boards omit it, so it stays
  // optional and never becomes a required key.
  player_opponent?: string | null;
  rank_ecr: number | string;
  rank_min?: number | string | null;
  rank_max?: number | string | null;
  rank_ave?: number | string | null;
  rank_std?: number | string | null;
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
  requestedPosition: FantasyProsBoardPosition;
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

const REQUIRED_OFFICIAL_API_PAGE_KEYS = [
  "sport",
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

const REQUIRED_OFFICIAL_API_PLAYER_KEYS = [
  "player_id",
  "player_name",
  "player_team_id",
  "player_position_id",
  "player_bye_week",
  "player_owned_avg",
  "rank_ecr",
  "pos_rank",
  "tier",
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

function asOptionalValidatedFiniteNumber(
  value: number | string | null | undefined,
  fieldName: string
): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  return asFiniteNumber(value, fieldName);
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

  const match = String(posRank ?? "")
    .trim()
    .match(/^(?:[A-Z/]+)?(\d+)$/i);
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
  // FLX is the in-season stand-in for the Overall tab. It is mapped to its own
  // name rather than onto OVERALL so a draft-season overall request can still
  // never be satisfied by a flex board.
  if (["FLX", "FLEX"].includes(normalized)) return "FLEX";
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
  options: FantasyProsConsensusOptions,
  sourceContract: FantasyProsConsensusSourceContract
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
  const minimumExperts = options.minimumExperts ?? FANTASY_PROS_MIN_EXPERTS;
  if (totalExperts < minimumExperts) {
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

  if (sourceContract.kind === "official-api") {
    const sourcePosition = payload.position_id.trim().toUpperCase();
    if (sourcePosition !== sourceContract.officialApiPosition) {
      throw new Error(
        `FantasyPros official API returned ${sourcePosition} for an exact ${sourceContract.officialApiPosition} request.`
      );
    }

    const sourceScoring = payload.scoring.trim().toUpperCase();
    const expectedScoring = getFantasyProsOfficialApiScoring(options.scoringFormat);
    if (sourceScoring !== expectedScoring) {
      throw new Error(
        `FantasyPros official API returned scoring "${payload.scoring}" instead of ${expectedScoring}.`
      );
    }

    const updatedAtSeconds = Number(payload.last_updated_ts);
    const updatedAtMs = updatedAtSeconds * 1000;
    const updatedAt = new Date(updatedAtMs);
    if (
      !Number.isInteger(updatedAtSeconds) ||
      updatedAtSeconds <= 0 ||
      updatedAtSeconds >= 10_000_000_000 ||
      Number.isNaN(updatedAt.getTime()) ||
      updatedAtMs > Date.now() + FANTASY_PROS_OFFICIAL_API_MAX_CLOCK_SKEW_MS
    ) {
      throw new Error("FantasyPros official API returned an invalid last_updated_ts timestamp.");
    }
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
  if (
    sourceContract.kind === "public-html" &&
    !["QB", "K", "DST"].includes(requestedPosition)
  ) {
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
    if (sourceContract.kind === "official-api") {
      if (
        typeof player.player_team_id !== "string" ||
        player.player_team_id.trim().length === 0
      ) {
        throw new Error(
          `FantasyPros official API player[${index}] has an invalid player_team_id.`
        );
      }
      const byeWeek = asOptionalValidatedFiniteNumber(
        player.player_bye_week,
        `player[${index}].player_bye_week`
      );
      if (
        byeWeek === undefined ||
        !Number.isInteger(byeWeek) ||
        byeWeek < 1 ||
        byeWeek > 18
      ) {
        throw new Error(
          `FantasyPros official API player[${index}] has an invalid player_bye_week.`
        );
      }
      const ownership = asOptionalValidatedFiniteNumber(
        player.player_owned_avg,
        `player[${index}].player_owned_avg`
      );
      if (
        ownership === undefined ||
        ownership < 0 ||
        ownership > 100
      ) {
        throw new Error(
          `FantasyPros official API player[${index}] has an invalid player_owned_avg.`
        );
      }
    }

    const consensusRank = asFiniteNumber(player.rank_ecr, `player[${index}].rank_ecr`);
    const averageRank =
      sourceContract.kind === "public-html"
        ? asFiniteNumber(player.rank_ave, `player[${index}].rank_ave`)
        : asOptionalValidatedFiniteNumber(
            player.rank_ave,
            `player[${index}].rank_ave`
          );
    const minimumRank =
      sourceContract.kind === "public-html"
        ? asFiniteNumber(player.rank_min, `player[${index}].rank_min`)
        : asOptionalValidatedFiniteNumber(
            player.rank_min,
            `player[${index}].rank_min`
          );
    const maximumRank =
      sourceContract.kind === "public-html"
        ? asFiniteNumber(player.rank_max, `player[${index}].rank_max`)
        : asOptionalValidatedFiniteNumber(
            player.rank_max,
            `player[${index}].rank_max`
          );
    const rankDeviation =
      sourceContract.kind === "public-html"
        ? asFiniteNumber(player.rank_std, `player[${index}].rank_std`)
        : asOptionalValidatedFiniteNumber(
            player.rank_std,
            `player[${index}].rank_std`
          );
    if (
      consensusRank <= 0 ||
      (averageRank !== undefined && averageRank <= 0) ||
      (minimumRank !== undefined && minimumRank <= 0) ||
      (maximumRank !== undefined && maximumRank <= 0) ||
      (minimumRank !== undefined &&
        maximumRank !== undefined &&
        maximumRank < minimumRank) ||
      (averageRank !== undefined &&
        minimumRank !== undefined &&
        averageRank < minimumRank) ||
      (averageRank !== undefined &&
        maximumRank !== undefined &&
        averageRank > maximumRank) ||
      (rankDeviation !== undefined && rankDeviation < 0)
    ) {
      throw new Error(
        `FantasyPros public source player[${index}] has an invalid expert rank distribution.`
      );
    }
    const positionRank = parsePositionRank(player.pos_rank);
    if (
      (sourceContract.kind === "official-api" &&
        (typeof player.pos_rank !== "string" || positionRank === undefined)) ||
      (positionRank !== undefined && positionRank <= 0)
    ) {
      throw new Error(
        `FantasyPros public source player[${index}] has an invalid position rank.`
      );
    }
    const tier = asOptionalFiniteNumber(player.tier);
    if (
      (sourceContract.kind === "official-api" &&
        (typeof player.tier !== "number" ||
          !Number.isInteger(player.tier) ||
          player.tier <= 0)) ||
      (tier !== undefined && (!Number.isInteger(tier) || tier <= 0))
    ) {
      throw new Error(`FantasyPros public source player[${index}] has an invalid tier.`);
    }

    const mappedPosition = mapFantasyProsPosition(player.player_position_id);
    // A FLEX board is the in-season stand-in for Overall, so it is not a
    // single-position board: it holds exactly the flex-eligible skill
    // positions and nothing else. Checking the set is the same guard as the
    // single-position case, not a relaxation of it.
    if (requestedPosition === "FLEX") {
      if (!FLEX_ELIGIBLE_BOARD_POSITIONS.includes(mappedPosition)) {
        throw new Error(
          `FantasyPros public source player[${index}] is ${mappedPosition} on a FLEX board.`
        );
      }
    } else if (requestedPosition !== "OVERALL" && mappedPosition !== requestedPosition) {
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
  const averageRank = asOptionalValidatedFiniteNumber(rawPlayer.rank_ave, "rank_ave");
  const standardDeviation = asOptionalValidatedFiniteNumber(
    rawPlayer.rank_std,
    "rank_std"
  );
  const minRank = asOptionalValidatedFiniteNumber(rawPlayer.rank_min, "rank_min");
  const maxRank = asOptionalValidatedFiniteNumber(rawPlayer.rank_max, "rank_max");
  const positionRank = parsePositionRank(rawPlayer.pos_rank);
  const tier = asOptionalFiniteNumber(rawPlayer.tier);

  return {
    id: `fp-${rawPlayer.player_id}`,
    name: rawPlayer.player_name.trim(),
    team: (rawPlayer.player_team_id ?? "FA").trim() || "FA",
    position: mappedPosition,
    averageRank: consensusRank,
    rankEcr: consensusRank,
    ...(averageRank !== undefined ? { rankAverage: averageRank } : {}),
    ...(standardDeviation !== undefined ? { standardDeviation } : {}),
    tier,
    positionRank,
    ...(minRank !== undefined ? { minRank } : {}),
    ...(maxRank !== undefined ? { maxRank } : {}),
    byeWeek: asOptionalFiniteNumber(rawPlayer.player_bye_week),
    ownership: asOptionalFiniteNumber(rawPlayer.player_owned_avg),
    ...(typeof rawPlayer.player_opponent === "string" && rawPlayer.player_opponent.trim()
      ? { opponent: rawPlayer.player_opponent.trim() }
      : {}),
    lastUpdated: upstreamUpdatedAt,
  } as Player;
}

function getFantasyProsPublicConsensusUrl(
  scoringFormat: ScoringFormat,
  position: FantasyPublicPosition
): string {
  return PUBLIC_POSITION_URLS[scoringFormat][position];
}

export function parseFantasyProsPublicConsensusPage(
  html: string,
  options: FantasyProsConsensusOptions & { sourceUrl: string }
): FantasyProsPublicBoard {
  const payload = extractConsensusPayload(html);
  return buildFantasyProsConsensusBoard(
    payload,
    options,
    FANTASY_PROS_PUBLIC_SOURCE,
    { kind: "public-html" }
  );
}

function normalizeFantasyProsOfficialApiPayload(
  payload: unknown
): FantasyProsPublicConsensusPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("FantasyPros official API did not return a consensus object.");
  }

  const record = payload as Record<string, unknown>;
  assertRequiredKeys(record, REQUIRED_OFFICIAL_API_PAGE_KEYS, "API response");
  if (record.filters !== null && typeof record.filters !== "string") {
    throw new Error(
      'FantasyPros official API returned an invalid "filters" value.'
    );
  }
  const normalized = {
    ...record,
    // The official schema identifies the board through ranking_type_name. Its
    // optional display `type` has historically used labels such as Preseason,
    // so normalize from the contract field before using the shared validator.
    type: String(record.ranking_type_name ?? ""),
    // The official schema permits null when no expert allowlist was supplied.
    // The shared validator represents that unfiltered request as an empty list.
    filters:
      typeof record.filters === "string" && record.filters.trim().length > 0
        ? record.filters
        : [],
  } as unknown as FantasyProsPublicConsensusPayload;

  if (!Array.isArray(normalized.players) || normalized.players.length === 0) {
    throw new Error("FantasyPros official API returned no players.");
  }
  normalized.players.forEach((player, index) => {
    assertRequiredKeys(
      player,
      REQUIRED_OFFICIAL_API_PLAYER_KEYS,
      `API player[${index}]`
    );
  });

  return normalized;
}

export function parseFantasyProsOfficialApiConsensusPayload(
  payload: unknown,
  options: FantasyProsOfficialApiConsensusOptions
): FantasyProsPublicBoard {
  return buildFantasyProsConsensusBoard(
    normalizeFantasyProsOfficialApiPayload(payload),
    options,
    FANTASY_PROS_OFFICIAL_API_SOURCE,
    {
      kind: "official-api",
      officialApiPosition: options.officialApiPosition,
    }
  );
}

function buildFantasyProsConsensusBoard(
  payload: FantasyProsPublicConsensusPayload,
  options: FantasyProsConsensusOptions & { sourceUrl: string },
  sourceLabel: string,
  sourceContract: FantasyProsConsensusSourceContract
): FantasyProsPublicBoard {
  validateConsensusPayload(payload, options, sourceContract);
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
    sourceLabel,
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
 * Error thrown when a FantasyPros consensus fetch returns a non-2xx
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

function getFantasyProsOfficialApiScoring(scoringFormat: ScoringFormat): string {
  switch (scoringFormat) {
    case "PPR":
      return "PPR";
    case "HALF_PPR":
      return "HALF";
    case "STANDARD":
      return "STD";
  }
}

function getFantasyProsOfficialApiUrl(
  season: number,
  position: FantasyProsOfficialApiPosition,
  scoringFormat: ScoringFormat,
  rankingType: FantasyProsRankingType
): string {
  const params = new URLSearchParams({
    position,
    scoring: getFantasyProsOfficialApiScoring(scoringFormat),
    type: rankingType.toUpperCase(),
    week: "0",
  });
  return `${FANTASY_PROS_OFFICIAL_API_BASE_URL}/${season}/consensus-rankings?${params}`;
}

async function fetchFantasyProsOfficialApiConsensusBoard(
  apiKey: string,
  options: FetchFantasyProsConsensusBoardOptions
): Promise<FantasyProsPublicBoard> {
  const rankingType = options.expectedRankingType ?? "draft";
  const sourceUrl = getFantasyProsOfficialApiUrl(
    options.expectedSeason,
    options.officialApiPosition,
    options.scoringFormat,
    rankingType
  );
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new FantasyProsPublicFetchError(
      `Failed to fetch FantasyPros official API ${options.requestedPosition} consensus board from ${sourceUrl}: ${response.status}`,
      response.status,
      response.headers,
      sourceUrl
    );
  }

  return parseFantasyProsOfficialApiConsensusPayload(await response.json(), {
    scoringFormat: options.scoringFormat,
    requestedPosition: options.requestedPosition,
    sourceUrl,
    officialApiPosition: options.officialApiPosition,
    expectedSeason: options.expectedSeason,
    expectedRankingType: options.expectedRankingType,
    minimumExperts: options.minimumExperts,
  });
}

/**
 * Exported so a caller can pin itself to the public HTML contract. The weekly
 * board does, because the official API's in-season position vocabulary is
 * unverified here and a silent official-API request for a board shape nobody
 * has checked is worse than declaring the source.
 */
export async function fetchFantasyProsPublicHtmlConsensusBoard(
  options: FetchFantasyProsConsensusBoardOptions
): Promise<FantasyProsPublicBoard> {
  const sourceUrl = options.publicSourceUrl;
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
      `Failed to fetch FantasyPros public ${options.requestedPosition} consensus board from ${sourceUrl}: ${response.status}`,
      response.status,
      response.headers,
      sourceUrl
    );
  }

  return parseFantasyProsPublicConsensusPage(await response.text(), {
    scoringFormat: options.scoringFormat,
    requestedPosition: options.requestedPosition,
    sourceUrl,
    expectedSeason: options.expectedSeason,
    expectedRankingType: options.expectedRankingType,
    minimumExperts: options.minimumExperts,
  });
}

export async function fetchFantasyProsConsensusBoard(
  options: FetchFantasyProsConsensusBoardOptions
): Promise<FantasyProsPublicBoard> {
  const source = resolveFantasyProsSourceSelection();
  if (source.kind === "official-api") {
    // An official selection is a source contract. Authentication, transport,
    // JSON, and validation failures must reach the caller instead of changing
    // the source to public HTML without disclosure.
    return fetchFantasyProsOfficialApiConsensusBoard(source.apiKey, options);
  }

  return fetchFantasyProsPublicHtmlConsensusBoard(options);
}

export async function fetchFantasyProsPublicConsensusBoard(
  scoringFormat: ScoringFormat,
  position: FantasyPublicPosition,
  expectedSeason: number
): Promise<FantasyProsPublicBoard> {
  return fetchFantasyProsConsensusBoard({
    scoringFormat,
    requestedPosition: position,
    expectedSeason,
    officialApiPosition: position === "OVERALL" ? "ALL" : position,
    publicSourceUrl: getFantasyProsPublicConsensusUrl(scoringFormat, position),
  });
}
