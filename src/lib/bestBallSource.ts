import {
  FANTASY_PROS_PUBLIC_USER_AGENT,
  parseFantasyProsPublicConsensusPage,
} from "@/lib/fantasyProsPublicSource";
import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import type { Player, Position, ScoringFormat } from "@/types";

export const BEST_BALL_RANKINGS_URL =
  "https://www.fantasypros.com/nfl/rankings/best-ball-overall.php";
export const BEST_BALL_SUPERFLEX_RANKINGS_URL =
  "https://www.fantasypros.com/nfl/rankings/half-point-ppr-superflex-cheatsheets.php";
export const BEST_BALL_ADP_API_URL = "https://pprrankings.com/api/rankings";
export const BEST_BALL_ADP_SOURCE_URL = "https://pprrankings.com/rankings";
export const BEST_BALL_SCHEDULE_SOURCE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export interface BestBallRankingsBoard {
  players: Player[];
  season: number;
  updatedAt: string;
  sourceUrl: string;
}

export interface BestBallAdpBoard {
  entries: FantasyAdpEntry[];
  updatedAt: string | null;
  sourceUrl: string;
}

interface RawBestBallAdpPlayer {
  rank?: unknown;
  adp?: unknown;
  updatedAt?: unknown;
  player?: {
    name?: unknown;
    position?: unknown;
  };
}

interface EspnSchedulePayload {
  season?: { year?: unknown };
  week?: { number?: unknown };
  events?: Array<{
    competitions?: Array<{
      competitors?: Array<{
        team?: { abbreviation?: unknown };
      }>;
    }>;
  }>;
}

export interface BestBallScheduleBoard {
  season: number;
  week: number;
  opponents: Record<string, string>;
  sourceUrl: string;
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePosition(value: unknown): Position | null {
  const position = typeof value === "string" ? value.trim().toUpperCase() : "";
  return position === "QB" || position === "RB" || position === "WR" || position === "TE"
    ? position
    : null;
}

function latestTimestamp(values: Array<string | null>): string | null {
  let latest: Date | null = null;
  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && (!latest || date > latest)) latest = date;
  }
  return latest?.toISOString() ?? null;
}

export function assertBestBallSourceScoring(
  actual: string,
  expected: string
): void {
  if (actual !== expected) {
    throw new Error(
      `Best ball rankings source returned ${actual || "no scoring label"} instead of ${expected}.`
    );
  }
}

export function parseBestBallAdpPayload(payload: unknown): BestBallAdpBoard {
  if (!Array.isArray(payload)) {
    throw new Error("Best ball ADP source did not return a player array.");
  }

  const entries: FantasyAdpEntry[] = [];
  const timestamps: Array<string | null> = [];

  for (const raw of payload as RawBestBallAdpPlayer[]) {
    const name = typeof raw?.player?.name === "string" ? raw.player.name.trim() : "";
    const position = normalizePosition(raw?.player?.position);
    const adp = finiteNumber(raw?.adp);
    const updatedAt =
      typeof raw?.updatedAt === "string" && !Number.isNaN(Date.parse(raw.updatedAt))
        ? new Date(raw.updatedAt).toISOString()
        : null;

    if (!name || !position || adp === null || adp <= 0) continue;
    entries.push({ name, team: "", position, adp });
    timestamps.push(updatedAt);
  }

  if (entries.length === 0) {
    throw new Error("Best ball ADP source returned no usable players.");
  }

  return {
    entries,
    updatedAt: latestTimestamp(timestamps),
    sourceUrl: BEST_BALL_ADP_SOURCE_URL,
  };
}

export function parseBestBallSchedulePayload(
  payload: unknown,
  options: { season: number; week: number; sourceUrl: string }
): BestBallScheduleBoard {
  const raw = payload && typeof payload === "object" ? (payload as EspnSchedulePayload) : {};
  const payloadSeason = finiteNumber(raw.season?.year);
  const payloadWeek = finiteNumber(raw.week?.number);
  if (payloadSeason !== options.season || payloadWeek !== options.week) {
    throw new Error("Best ball schedule source returned the wrong season or week.");
  }

  const opponents: Record<string, string> = {};
  for (const event of raw.events ?? []) {
    const teams = (event.competitions?.[0]?.competitors ?? [])
      .map((competitor) =>
        typeof competitor.team?.abbreviation === "string"
          ? competitor.team.abbreviation.trim().toUpperCase()
          : ""
      )
      .filter(Boolean);
    if (teams.length !== 2) continue;
    const [first, second] = teams;
    opponents[first] = second;
    opponents[second] = first;
  }

  if (Object.keys(opponents).length < 30) {
    throw new Error("Best ball schedule source returned an incomplete NFL week.");
  }

  return {
    season: options.season,
    week: options.week,
    opponents,
    sourceUrl: options.sourceUrl,
  };
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": FANTASY_PROS_PUBLIC_USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Best ball source request failed (${response.status}) for ${url}`);
  return response.text();
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Best ball source request failed (${response.status}) for ${url}`);
  return response.json();
}

export async function fetchBestBallRankingsBoard(): Promise<BestBallRankingsBoard> {
  return fetchEligibleRankingsBoard(BEST_BALL_RANKINGS_URL, "PPR", "PPR");
}

async function fetchEligibleRankingsBoard(
  sourceUrl: string,
  scoringFormat: ScoringFormat,
  expectedSourceScoring: string
): Promise<BestBallRankingsBoard> {
  const html = await fetchText(sourceUrl);
  const board = parseFantasyProsPublicConsensusPage(html, {
    scoringFormat,
    requestedPosition: "OVERALL",
    sourceUrl,
  });

  assertBestBallSourceScoring(board.sourceScoring, expectedSourceScoring);

  const players = board.players.filter((player) =>
    ["QB", "RB", "WR", "TE"].includes(player.position)
  );
  if (players.length < 150) {
    throw new Error(`Best ball rankings source returned only ${players.length} eligible players.`);
  }

  return {
    players,
    season: board.season,
    updatedAt: board.upstreamUpdatedAt,
    sourceUrl: board.sourceUrl,
  };
}

export async function fetchBestBallSuperflexRankingsBoard(): Promise<BestBallRankingsBoard> {
  return fetchEligibleRankingsBoard(
    BEST_BALL_SUPERFLEX_RANKINGS_URL,
    "HALF_PPR",
    "HALF"
  );
}

export async function fetchBestBallAdpBoard(season = new Date().getUTCFullYear()): Promise<BestBallAdpBoard> {
  const url = `${BEST_BALL_ADP_API_URL}?ranker=hayden&week=0&season=${season}`;
  return parseBestBallAdpPayload(await fetchJson(url));
}

export async function fetchBestBallScheduleBoard(
  season: number,
  week = 17
): Promise<BestBallScheduleBoard> {
  const sourceUrl = `${BEST_BALL_SCHEDULE_SOURCE_URL}?dates=${season}&seasontype=2&week=${week}&limit=100`;
  return parseBestBallSchedulePayload(await fetchJson(sourceUrl), { season, week, sourceUrl });
}
