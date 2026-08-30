import type { FantasyCompanionRoomConfig } from "@/lib/fantasyCompanion";
import {
  normalizeFantasySnapshot,
  type FantasyRouteScoring,
  type FantasySnapshot,
} from "@/lib/fantasy";
import {
  normalizeBestBallSnapshot,
  type BestBallSnapshot,
} from "@/lib/bestBallSnapshot";
import { getExtensionAssetUrl, readLocalValue, writeLocalValue } from "./storage";

const LIVE_DATA_ORIGIN = "https://isaacvazquez.com";
const CACHE_VERSION = 2;

type SnapshotSource = "published" | "saved" | "bundled";

interface SnapshotCacheBase {
  version: typeof CACHE_VERSION;
  filename: string;
}

type SnapshotCacheRecord =
  | (SnapshotCacheBase & { kind: "redraft"; data: FantasySnapshot })
  | (SnapshotCacheBase & { kind: "best-ball"; data: BestBallSnapshot });

export type CompanionSnapshot =
  | {
      kind: "redraft";
      filename: string;
      data: FantasySnapshot;
      source: SnapshotSource;
    }
  | {
      kind: "best-ball";
      filename: string;
      data: BestBallSnapshot;
      source: SnapshotSource;
    };

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

function scoringForFilename(filename: string): FantasyRouteScoring {
  switch (filename) {
    case "standard.json":
      return "standard";
    case "half_ppr.json":
      return "half_ppr";
    case "ppr.json":
      return "ppr";
    default:
      throw new Error(`The rankings filename ${filename} is not supported.`);
  }
}

function parseSnapshot(value: unknown, filename: string): SnapshotCacheRecord {
  if (filename === "best-ball.json") {
    return {
      version: CACHE_VERSION,
      filename,
      kind: "best-ball",
      data: normalizeBestBallSnapshot(value),
    };
  }

  return {
    version: CACHE_VERSION,
    filename,
    kind: "redraft",
    data: normalizeFantasySnapshot(value, scoringForFilename(filename), {
      lenient: true,
    }),
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
  const record = value as {
    version?: unknown;
    filename?: unknown;
    kind?: unknown;
    data?: unknown;
  };
  if (
    record.version !== CACHE_VERSION ||
    record.filename !== filename ||
    (record.kind !== "redraft" && record.kind !== "best-ball")
  ) {
    return null;
  }
  if (
    (filename === "best-ball.json" && record.kind !== "best-ball") ||
    (filename !== "best-ball.json" && record.kind !== "redraft")
  ) {
    return null;
  }

  try {
    return parseSnapshot(record.data, filename);
  } catch {
    return null;
  }
}

function withSource(record: SnapshotCacheRecord, source: SnapshotSource): CompanionSnapshot {
  return record.kind === "redraft"
    ? { kind: "redraft", filename: record.filename, data: record.data, source }
    : { kind: "best-ball", filename: record.filename, data: record.data, source };
}

function assertSnapshotSeason(record: SnapshotCacheRecord, expectedSeason: number): void {
  if (record.data.season !== expectedSeason) {
    throw new Error(
      `Rankings are for the ${record.data.season} season, but this room is set to ${expectedSeason}.`
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
  if (saved?.data.season === room.season) {
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
