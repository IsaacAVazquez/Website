import { Position, ScoringFormat } from "@/types";

export const FANTASY_ADP_PROVIDER = "Fantasy Football Calculator";
export const FANTASY_ADP_PROVIDER_URL = "https://fantasyfootballcalculator.com/adp";

export const FANTASY_ADP_SOURCE =
  "Average draft position comes from Fantasy Football Calculator's free mock-draft API. The pipeline requests its 12-team board for the matching scoring format. The provider returned the same player prices when tested across its 8-, 10-, 12-, and 14-team parameters on August 7, 2026, so league-size differences are not modeled.";

/**
 * A single player's ADP reading from the upstream mock-draft sample. Kept
 * deliberately small — only what the matcher and the published snapshot need.
 */
export interface FantasyAdpEntry {
  name: string;
  team: string;
  position: Position;
  adp: number;
  high?: number;
  low?: number;
  stdev?: number;
  timesDrafted?: number;
}

export interface FantasyAdpBoard {
  scoringFormat: ScoringFormat;
  entries: FantasyAdpEntry[];
  /** End date of the upstream mock-draft sample window. */
  asOf: string | null;
  /** Number of mock drafts behind the average. */
  sampleSize: number | null;
  sourceUrl: string;
}

interface RawAdpPlayer {
  name?: unknown;
  team?: unknown;
  position?: unknown;
  adp?: unknown;
  high?: unknown;
  low?: unknown;
  stdev?: unknown;
  times_drafted?: unknown;
}

interface RawAdpPayload {
  status?: unknown;
  meta?: {
    type?: unknown;
    teams?: unknown;
    rounds?: unknown;
    total_drafts?: unknown;
    start_date?: unknown;
    end_date?: unknown;
  };
  players?: unknown;
}

const ADP_FORMAT_SLUGS: Record<ScoringFormat, string> = {
  PPR: "ppr",
  HALF_PPR: "half-ppr",
  STANDARD: "standard",
};

function mapAdpPosition(position: string): Position | null {
  switch (position.trim().toUpperCase()) {
    case "QB":
      return "QB";
    case "RB":
      return "RB";
    case "WR":
      return "WR";
    case "TE":
      return "TE";
    case "PK":
    case "K":
      return "K";
    case "DEF":
    case "DST":
    case "D/ST":
      return "DST";
    default:
      return null;
  }
}

function asOptionalFiniteNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeAsOfDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function getFantasyAdpUrl(scoringFormat: ScoringFormat, season: number): string {
  const slug = ADP_FORMAT_SLUGS[scoringFormat];
  return `https://fantasyfootballcalculator.com/api/v1/adp/${slug}?teams=12&year=${season}&position=all`;
}

/**
 * Parses the upstream ADP payload into a board. Pure so tests can run it
 * against fixtures. Unknown positions are skipped rather than guessed, and an
 * entry without a finite ADP or a name is dropped — a missing reading is
 * honest, a fabricated one is not.
 */
export function parseFantasyAdpPayload(
  payload: unknown,
  options: {
    scoringFormat: ScoringFormat;
    sourceUrl: string;
    strict?: boolean;
    expectedTeams?: number;
  }
): FantasyAdpBoard {
  const raw =
    payload && typeof payload === "object" ? (payload as RawAdpPayload) : ({} as RawAdpPayload);

  if (!Array.isArray(raw.players)) {
    throw new Error('Fantasy ADP source did not return a "players" array.');
  }

  if (options.strict) {
    if (raw.status !== "Success") {
      throw new Error(`Fantasy ADP source returned status "${String(raw.status)}".`);
    }
    const expectedType = ADP_FORMAT_SLUGS[options.scoringFormat].replace("half-ppr", "half");
    const sourceType = String(raw.meta?.type ?? "").trim().toLowerCase().replace(/[_\s-]/g, "");
    if (!sourceType || !sourceType.includes(expectedType.replace(/[_\s-]/g, ""))) {
      throw new Error(
        `Fantasy ADP source returned format "${String(raw.meta?.type)}" for ${options.scoringFormat}.`
      );
    }
    const teams = asOptionalFiniteNumber(raw.meta?.teams);
    if (options.expectedTeams !== undefined && teams !== options.expectedTeams) {
      throw new Error(
        `Fantasy ADP source returned ${String(raw.meta?.teams)} teams, expected ${options.expectedTeams}.`
      );
    }
    const totalDrafts = asOptionalFiniteNumber(raw.meta?.total_drafts);
    const rounds = asOptionalFiniteNumber(raw.meta?.rounds);
    if (!totalDrafts || totalDrafts < 1 || !rounds || rounds < 1) {
      throw new Error("Fantasy ADP source returned invalid sample or round metadata.");
    }
    if (!normalizeAsOfDate(raw.meta?.start_date) || !normalizeAsOfDate(raw.meta?.end_date)) {
      throw new Error("Fantasy ADP source returned an invalid sample window.");
    }
  }

  const entries: FantasyAdpEntry[] = [];

  for (const rawPlayer of raw.players as RawAdpPlayer[]) {
    if (!rawPlayer || typeof rawPlayer !== "object") {
      continue;
    }

    const name = typeof rawPlayer.name === "string" ? rawPlayer.name.trim() : "";
    const position =
      typeof rawPlayer.position === "string" ? mapAdpPosition(rawPlayer.position) : null;
    const adp = asOptionalFiniteNumber(rawPlayer.adp);

    if (!name || !position || adp === undefined) {
      continue;
    }

    if (adp < 1) {
      if (options.strict) {
        throw new Error(`Fantasy ADP source returned an invalid ADP for "${name}".`);
      }
      continue;
    }

    entries.push({
      name,
      team: typeof rawPlayer.team === "string" ? rawPlayer.team.trim().toUpperCase() : "",
      position,
      adp,
      high: asOptionalFiniteNumber(rawPlayer.high),
      low: asOptionalFiniteNumber(rawPlayer.low),
      stdev: asOptionalFiniteNumber(rawPlayer.stdev),
      timesDrafted: asOptionalFiniteNumber(rawPlayer.times_drafted),
    });
  }

  if (entries.length === 0) {
    throw new Error("Fantasy ADP source returned no usable players.");
  }


  if (options.strict) {
    const seen = new Set<string>();
    for (const entry of entries) {
      const key = `${entry.name.trim().toLowerCase()}|${entry.position}`;
      if (seen.has(key)) {
        throw new Error(`Fantasy ADP source returned duplicate player "${entry.name}".`);
      }
      seen.add(key);
      if (
        entry.high !== undefined &&
        entry.low !== undefined &&
        (entry.high < 1 || entry.low < entry.high)
      ) {
        throw new Error(`Fantasy ADP source returned an invalid range for "${entry.name}".`);
      }
      if (entry.stdev !== undefined && entry.stdev < 0) {
        throw new Error(`Fantasy ADP source returned an invalid deviation for "${entry.name}".`);
      }
      if (entry.timesDrafted !== undefined && entry.timesDrafted < 0) {
        throw new Error(`Fantasy ADP source returned an invalid sample count for "${entry.name}".`);
      }
    }
  }

  return {
    scoringFormat: options.scoringFormat,
    entries,
    asOf: normalizeAsOfDate(raw.meta?.end_date),
    sampleSize: asOptionalFiniteNumber(raw.meta?.total_drafts) ?? null,
    sourceUrl: options.sourceUrl,
  };
}

/**
 * Error thrown when the ADP fetch returns a non-2xx response. Mirrors
 * `FantasyProsPublicFetchError` so the shared retry helper can inspect the
 * status and honor `Retry-After`.
 */
export class FantasyAdpFetchError extends Error {
  readonly status: number;
  readonly headers: Headers;
  readonly url: string;

  constructor(message: string, status: number, headers: Headers, url: string) {
    super(message);
    this.name = "FantasyAdpFetchError";
    this.status = status;
    this.headers = headers;
    this.url = url;
  }
}

export async function fetchFantasyAdpBoard(
  scoringFormat: ScoringFormat,
  season: number
): Promise<FantasyAdpBoard> {
  const sourceUrl = getFantasyAdpUrl(scoringFormat, season);
  const response = await fetch(sourceUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new FantasyAdpFetchError(
      `Failed to fetch fantasy ADP board from ${sourceUrl}: ${response.status}`,
      response.status,
      response.headers,
      sourceUrl
    );
  }

  const payload = await response.json();
  return parseFantasyAdpPayload(payload, {
    scoringFormat,
    sourceUrl,
    strict: true,
    expectedTeams: 12,
  });
}
