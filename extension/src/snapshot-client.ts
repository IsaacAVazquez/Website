import type { FantasyCompanionRoomConfig } from "@/lib/fantasyCompanion";
import type { Player } from "@/types";
import { getExtensionAssetUrl, readLocalValue, writeLocalValue } from "./storage";

const LIVE_DATA_ORIGIN = "https://isaacvazquez.com";
const CACHE_VERSION = 1;

type SnapshotSource = "published" | "saved" | "bundled";

interface SnapshotCacheRecord {
  version: number;
  filename: string;
  season: number;
  generatedAt: string;
  sourceUpdatedAt: string;
  players: Player[];
  week17Opponents: Record<string, string>;
}

export interface CompanionSnapshot {
  season: number;
  generatedAt: string;
  sourceUpdatedAt: string;
  players: Player[];
  week17Opponents: Record<string, string>;
  source: SnapshotSource;
}

export interface SnapshotRefreshResult {
  snapshot: CompanionSnapshot;
  liveError: string | null;
}

function getSnapshotFilename(room: FantasyCompanionRoomConfig): string {
  if (room.kind === "best-ball") return "best-ball.json";

  switch (room.scoring) {
    case "STANDARD":
      return "standard.json";
    case "HALF_PPR":
      return "half_ppr.json";
    case "PPR":
    default:
      return "ppr.json";
  }
}

function getCacheKey(filename: string): string {
  return `fantasy-companion-snapshot-v${CACHE_VERSION}-${filename}`;
}

function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== "object") return false;
  const player = value as Partial<Player>;
  return (
    typeof player.id === "string" &&
    player.id.length > 0 &&
    typeof player.name === "string" &&
    player.name.length > 0 &&
    typeof player.team === "string" &&
    ["QB", "RB", "WR", "TE", "K", "DST"].includes(String(player.position)) &&
    typeof player.averageRank === "number" &&
    Number.isFinite(player.averageRank)
  );
}

function parseSnapshot(value: unknown, filename: string): SnapshotCacheRecord {
  if (!value || typeof value !== "object") {
    throw new Error("The rankings file is not valid JSON data.");
  }

  const candidate = value as {
    schemaVersion?: unknown;
    season?: unknown;
    generatedAt?: unknown;
    upstreamUpdatedAt?: unknown;
    rankingSource?: unknown;
    adpSource?: unknown;
    scoringFormat?: unknown;
    overall?: unknown;
    players?: unknown;
    week17Opponents?: unknown;
  };
  const rawPlayers = filename === "best-ball.json" ? candidate.players : candidate.overall;
  const players = Array.isArray(rawPlayers) ? rawPlayers.filter(isPlayer) : [];
  const playerIds = new Set(players.map((player) => player.id));
  const generatedAt =
    typeof candidate.generatedAt === "string" && Number.isFinite(Date.parse(candidate.generatedAt))
      ? new Date(candidate.generatedAt).toISOString()
      : null;
  const rankingAsOf =
    candidate.rankingSource &&
    typeof candidate.rankingSource === "object" &&
    "asOf" in candidate.rankingSource &&
    typeof candidate.rankingSource.asOf === "string"
      ? candidate.rankingSource.asOf
      : null;
  const adpAsOf =
    candidate.adpSource &&
    typeof candidate.adpSource === "object" &&
    "asOf" in candidate.adpSource &&
    typeof candidate.adpSource.asOf === "string"
      ? candidate.adpSource.asOf
      : null;
  const validBestBallDates = [rankingAsOf, adpAsOf]
    .filter((date): date is string => typeof date === "string" && Number.isFinite(Date.parse(date)))
    .map((date) => new Date(date).getTime());
  const rawSourceUpdatedAt = filename === "best-ball.json"
    ? validBestBallDates.length > 0
      ? new Date(Math.min(...validBestBallDates)).toISOString()
      : null
    : typeof candidate.upstreamUpdatedAt === "string"
      ? candidate.upstreamUpdatedAt
      : null;
  const sourceUpdatedAt =
    rawSourceUpdatedAt && Number.isFinite(Date.parse(rawSourceUpdatedAt))
      ? new Date(rawSourceUpdatedAt).toISOString()
      : generatedAt;

  if (
    typeof candidate.schemaVersion !== "number" ||
    !Number.isInteger(candidate.schemaVersion) ||
    candidate.schemaVersion < 1 ||
    typeof candidate.season !== "number" ||
    !Number.isInteger(candidate.season) ||
    !generatedAt ||
    !sourceUpdatedAt ||
    players.length === 0 ||
    !Array.isArray(rawPlayers) ||
    players.length !== rawPlayers.length ||
    playerIds.size !== players.length
  ) {
    throw new Error("The rankings file is incomplete.");
  }

  const expectedScoring: Record<string, string> = {
    "ppr.json": "PPR",
    "half_ppr.json": "HALF_PPR",
    "standard.json": "STANDARD",
  };
  if (filename in expectedScoring && candidate.scoringFormat !== expectedScoring[filename]) {
    throw new Error(`The ${filename} rankings use the wrong scoring format.`);
  }

  const week17Opponents: Record<string, string> = {};
  if (
    candidate.week17Opponents &&
    typeof candidate.week17Opponents === "object" &&
    !Array.isArray(candidate.week17Opponents)
  ) {
    for (const [team, opponent] of Object.entries(candidate.week17Opponents)) {
      if (typeof opponent === "string") week17Opponents[team] = opponent;
    }
  }
  if (filename === "best-ball.json" && Object.keys(week17Opponents).length < 30) {
    throw new Error("The best ball rankings do not include enough Week 17 schedule coverage.");
  }

  return {
    version: CACHE_VERSION,
    filename,
    season: candidate.season,
    generatedAt,
    sourceUpdatedAt,
    players,
    week17Opponents,
  };
}

async function requestSnapshot(url: string, filename: string): Promise<SnapshotCacheRecord> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Rankings request returned ${response.status}.`);
    return parseSnapshot(await response.json(), filename);
  } finally {
    window.clearTimeout(timeout);
  }
}

function parseSavedSnapshot(value: unknown, filename: string): SnapshotCacheRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<SnapshotCacheRecord>;
  if (
    record.version !== CACHE_VERSION ||
    record.filename !== filename ||
    !Number.isInteger(record.season) ||
    typeof record.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(record.generatedAt)) ||
    typeof record.sourceUpdatedAt !== "string" ||
    !Number.isFinite(Date.parse(record.sourceUpdatedAt)) ||
    !Array.isArray(record.players) ||
    record.players.length === 0 ||
    !record.players.every(isPlayer) ||
    new Set(record.players.map((player) => player.id)).size !== record.players.length ||
    !record.week17Opponents ||
    typeof record.week17Opponents !== "object" ||
    Array.isArray(record.week17Opponents)
  ) {
    return null;
  }
  if (filename === "best-ball.json" && Object.keys(record.week17Opponents).length === 0) {
    return null;
  }

  return record as SnapshotCacheRecord;
}

function withSource(record: SnapshotCacheRecord, source: SnapshotSource): CompanionSnapshot {
  return {
    season: record.season,
    generatedAt: record.generatedAt,
    sourceUpdatedAt: record.sourceUpdatedAt,
    players: record.players,
    week17Opponents: record.week17Opponents,
    source,
  };
}

function assertSnapshotSeason(record: SnapshotCacheRecord, expectedSeason: number): void {
  if (record.season !== expectedSeason) {
    throw new Error(
      `Rankings are for the ${record.season} season, but this room is set to ${expectedSeason}.`
    );
  }
}

export async function loadCompanionSnapshot(
  room: FantasyCompanionRoomConfig
): Promise<SnapshotRefreshResult> {
  const filename = getSnapshotFilename(room);
  const liveUrl = `${LIVE_DATA_ORIGIN}/data/fantasy/${filename}`;
  let liveError: string;

  try {
    const record = await requestSnapshot(liveUrl, filename);
    assertSnapshotSeason(record, room.season);
    // The cache write is best-effort: a quota or storage failure must not
    // discard a validated live fetch and downgrade the panel to older data.
    try {
      await writeLocalValue(getCacheKey(filename), record);
    } catch {
      // Serve the live snapshot uncached.
    }
    return { snapshot: withSource(record, "published"), liveError: null };
  } catch (error) {
    liveError = error instanceof Error ? error.message : "Published rankings could not be reached.";
  }

  // A storage read rejection (corrupt profile, transient IO) counts as "no
  // saved copy" — it must not abort the load while a bundled snapshot ships
  // with the extension.
  let savedValue: SnapshotCacheRecord | null;
  try {
    savedValue = await readLocalValue<SnapshotCacheRecord>(getCacheKey(filename));
  } catch {
    savedValue = null;
  }
  const saved = parseSavedSnapshot(savedValue, filename);
  if (saved?.season === room.season) {
    return { snapshot: withSource(saved, "saved"), liveError };
  }

  const bundledUrl = getExtensionAssetUrl(`data/fantasy/${filename}`);
  const bundled = await requestSnapshot(bundledUrl, filename);
  assertSnapshotSeason(bundled, room.season);
  try {
    await writeLocalValue(getCacheKey(filename), bundled);
  } catch {
    // Serve the bundled snapshot uncached.
  }
  return { snapshot: withSource(bundled, "bundled"), liveError };
}
