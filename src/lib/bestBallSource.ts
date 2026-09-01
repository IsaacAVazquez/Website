import {
  fetchFantasyProsConsensusBoard,
  type FantasyProsOfficialApiPosition,
} from "@/lib/fantasyProsPublicSource";
import { BEST_BALL_MIN_RANKING_PLAYERS } from "@/lib/bestBallSnapshot";
import { normalizeAdpTeam } from "@/lib/fantasyAdpMatcher";
import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import type { Player, Position, ScoringFormat } from "@/types";

const BEST_BALL_RANKINGS_URL =
  "https://www.fantasypros.com/nfl/rankings/best-ball-overall.php";
const BEST_BALL_SUPERFLEX_RANKINGS_URL =
  "https://www.fantasypros.com/nfl/rankings/half-point-ppr-superflex-cheatsheets.php";
const BEST_BALL_ADP_API_URL = "https://pprrankings.com/api/rankings";
const BEST_BALL_ADP_SOURCE_URL = "https://pprrankings.com/rankings";
const BEST_BALL_ADP_RANKER = "hayden";
const BEST_BALL_ADP_FORMAT = "PPR";
const BEST_BALL_ADP_WEEK = 0;
// FantasyPros' best-ball board thinned from 5 contributing experts to 4 in
// late August 2026, which left every refresh failing this floor and the
// committed snapshot aging past its 4-day gate. A fresh 4-expert consensus
// beats a week-old 5-expert one, so the floor follows the page down. The CI
// gate in update-fantasy.yml enforces the same number.
const BEST_BALL_MIN_CONSENSUS_EXPERTS = 4;
const BEST_BALL_SCHEDULE_SOURCE_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export function getExpectedBestBallSeason(now: Date = new Date()): number {
  return now.getUTCMonth() < 2 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
}

interface BestBallRankingsBoard {
  players: Player[];
  season: number;
  updatedAt: string;
  sourceUrl: string;
  sourceLabel: string;
  expertCount: number;
}

interface BestBallAdpBoard {
  entries: FantasyAdpEntry[];
  updatedAt: string | null;
  sourceUrl: string;
  season: number;
  format: string;
  ranker: string;
}

interface RawBestBallAdpPlayer {
  rank?: unknown;
  adp?: unknown;
  updatedAt?: unknown;
  season?: unknown;
  week?: unknown;
  format?: unknown;
  rankerSlug?: unknown;
  player?: {
    name?: unknown;
    position?: unknown;
    nflTeamAbbr?: unknown;
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

interface BestBallScheduleBoard {
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

export function parseBestBallAdpPayload(
  payload: unknown,
  expected: { season: number; format: string; ranker: string; week: number }
): BestBallAdpBoard {
  if (!Array.isArray(payload)) {
    throw new Error("Best ball ADP source did not return a player array.");
  }

  const entries: FantasyAdpEntry[] = [];
  const timestamps: Array<string | null> = [];

  // The request pins ranker, week, and season but not format, so the expected
  // format is an assumption about the provider's default. Skip an off-contract
  // row the same way an unusable one is skipped rather than aborting the whole
  // refresh over it; if nothing matches, the contract really did change and the
  // empty-result check below fails loudly.
  let offContractRows = 0;

  for (const raw of payload as RawBestBallAdpPlayer[]) {
    if (
      finiteNumber(raw?.season) !== expected.season ||
      finiteNumber(raw?.week) !== expected.week ||
      raw?.format !== expected.format ||
      raw?.rankerSlug !== expected.ranker
    ) {
      offContractRows += 1;
      continue;
    }

    const name = typeof raw?.player?.name === "string" ? raw.player.name.trim() : "";
    const position = normalizePosition(raw?.player?.position);
    const team = normalizeAdpTeam(
      typeof raw?.player?.nflTeamAbbr === "string"
        ? raw.player.nflTeamAbbr
        : ""
    );
    const adp = finiteNumber(raw?.adp);
    const updatedAt =
      typeof raw?.updatedAt === "string" && !Number.isNaN(Date.parse(raw.updatedAt))
        ? new Date(raw.updatedAt).toISOString()
        : null;

    if (!name || !position || adp === null || adp <= 0) continue;
    entries.push({ name, team, position, adp });
    timestamps.push(updatedAt);
  }

  if (entries.length === 0) {
    throw new Error(
      offContractRows > 0
        ? `Best ball ADP source returned ${offContractRows} row(s), all outside the requested season, week, format, or ranker.`
        : "Best ball ADP source returned no usable players."
    );
  }

  return {
    entries,
    updatedAt: latestTimestamp(timestamps),
    sourceUrl: BEST_BALL_ADP_SOURCE_URL,
    season: expected.season,
    format: expected.format,
    ranker: expected.ranker,
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

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Best ball source request failed (${response.status}) for ${url}`);
  return response.json();
}

export async function fetchBestBallRankingsBoard(): Promise<BestBallRankingsBoard> {
  return fetchEligibleRankingsBoard({
    publicSourceUrl: BEST_BALL_RANKINGS_URL,
    officialApiPosition: "ALL",
    scoringFormat: "PPR",
    expectedSourceScoring: "PPR",
    expectedRankingType: "best",
    minimumExperts: BEST_BALL_MIN_CONSENSUS_EXPERTS,
  });
}

async function fetchEligibleRankingsBoard(options: {
  publicSourceUrl: string;
  officialApiPosition: FantasyProsOfficialApiPosition;
  scoringFormat: ScoringFormat;
  expectedSourceScoring: string;
  expectedRankingType?: "draft" | "best";
  minimumExperts?: number;
}): Promise<BestBallRankingsBoard> {
  const board = await fetchFantasyProsConsensusBoard({
    scoringFormat: options.scoringFormat,
    requestedPosition: "OVERALL",
    publicSourceUrl: options.publicSourceUrl,
    officialApiPosition: options.officialApiPosition,
    expectedRankingType: options.expectedRankingType,
    expectedSeason: getExpectedBestBallSeason(),
    minimumExperts: options.minimumExperts,
  });

  assertBestBallSourceScoring(board.sourceScoring, options.expectedSourceScoring);

  const players = board.players.filter((player) =>
    ["QB", "RB", "WR", "TE"].includes(player.position)
  );
  if (players.length < BEST_BALL_MIN_RANKING_PLAYERS) {
    throw new Error(`Best ball rankings source returned only ${players.length} eligible players.`);
  }

  return {
    players,
    season: board.season,
    updatedAt: board.upstreamUpdatedAt,
    sourceUrl: board.sourceUrl,
    sourceLabel: board.sourceLabel,
    expertCount: board.totalExperts,
  };
}

export async function fetchBestBallSuperflexRankingsBoard(): Promise<BestBallRankingsBoard> {
  return fetchEligibleRankingsBoard({
    publicSourceUrl: BEST_BALL_SUPERFLEX_RANKINGS_URL,
    officialApiPosition: "OP",
    scoringFormat: "HALF_PPR",
    expectedSourceScoring: "HALF",
    expectedRankingType: "draft",
  });
}

export async function fetchBestBallAdpBoard(season = new Date().getUTCFullYear()): Promise<BestBallAdpBoard> {
  const url = `${BEST_BALL_ADP_API_URL}?ranker=${BEST_BALL_ADP_RANKER}&week=${BEST_BALL_ADP_WEEK}&season=${season}`;
  return parseBestBallAdpPayload(await fetchJson(url), {
    season,
    format: BEST_BALL_ADP_FORMAT,
    ranker: BEST_BALL_ADP_RANKER,
    week: BEST_BALL_ADP_WEEK,
  });
}

export async function fetchBestBallScheduleBoard(
  season: number,
  week = 17
): Promise<BestBallScheduleBoard> {
  const sourceUrl = `${BEST_BALL_SCHEDULE_SOURCE_URL}?dates=${season}&seasontype=2&week=${week}&limit=100`;
  return parseBestBallSchedulePayload(await fetchJson(sourceUrl), { season, week, sourceUrl });
}
