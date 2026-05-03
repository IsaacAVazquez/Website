import { Player, Position, ScoringFormat } from "@/types";

export const FANTASY_PROS_PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export const FANTASY_PROS_PUBLIC_SOURCE =
  "FantasyPros public consensus cheatsheets. Overall boards come from the public overall consensus pages. QB, K, and DST boards are scoring-agnostic and reused across scoring formats. Flex is derived locally from the published overall board.";

export const FANTASY_PUBLIC_POSITIONS = ["OVERALL", "QB", "RB", "WR", "TE", "K", "DST"] as const;

export type FantasyPublicPosition = (typeof FANTASY_PUBLIC_POSITIONS)[number];

interface FantasyProsPublicPlayerPayload {
  player_id: number;
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
  year: string | number;
  week: string | number;
  position_id: string;
  scoring: string;
  last_updated: string;
  last_updated_ts: number | string;
  accessed?: string;
  players: FantasyProsPublicPlayerPayload[];
}

export interface FantasyProsPublicBoard {
  scoringFormat: ScoringFormat;
  requestedPosition: FantasyPublicPosition;
  sourcePosition: string;
  sourceUrl: string;
  sourceLabel: string;
  accessedAt: string | null;
  lastUpdatedLabel: string;
  upstreamUpdatedAt: string;
  season: number;
  week: number;
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

const REQUIRED_PAGE_KEYS = ["year", "week", "position_id", "scoring", "last_updated", "last_updated_ts", "players"] as const;
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
  }
): FantasyProsPublicBoard {
  const payload = extractConsensusPayload(html);
  const upstreamUpdatedAt = buildUpstreamUpdatedAt(payload);
  const players = payload.players
    .map((player) => toPublishedFantasyPlayer(player, upstreamUpdatedAt))
    .sort((left, right) => Number(left.averageRank) - Number(right.averageRank));

  return {
    scoringFormat: options.scoringFormat,
    requestedPosition: options.requestedPosition,
    sourcePosition: payload.position_id,
    sourceUrl: options.sourceUrl,
    sourceLabel: FANTASY_PROS_PUBLIC_SOURCE,
    accessedAt: normalizeAccessedAt(payload.accessed),
    lastUpdatedLabel: payload.last_updated,
    upstreamUpdatedAt,
    season: Number.parseInt(String(payload.year), 10),
    week: Number.parseInt(String(payload.week), 10),
    players,
  };
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
  position: FantasyPublicPosition
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
  });
}
