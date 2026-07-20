import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
import { buildBayAreaTransitLiveSnapshotData } from "@/lib/bayAreaTransitData";
import type {
  TransitStationBoard,
  TransitSummary,
} from "@/types/bayAreaTransit";

interface TransitSnapshotError extends Error {
  status: number;
}

function createTransitSnapshotError(
  message: string,
  status: number
): TransitSnapshotError {
  return Object.assign(new Error(message), { status });
}

export function createEmptyTransitSummary(): TransitSummary {
  return {
    system: null,
    heroStats: {
      lineCount: 0,
      stationCount: 0,
      activeAdvisories: 0,
      elevatorOutages: 0,
      trainsTracked: 0,
    },
    lines: [],
    stations: [],
    advisories: [],
    elevator: [],
    sectionStatus: {
      advisories: "unavailable",
      elevator: "unavailable",
      departures: "unavailable",
    },
    defaultStation: null,
  };
}

export function createEmptyTransitStationBoard(): TransitStationBoard {
  return {
    id: "",
    abbr: "",
    name: "",
    departures: [],
    generatedAt: new Date().toISOString(),
  };
}

// Station ids are short BART abbreviations lowercased ("embr", "12th"). The
// shape check runs before membership so route handlers can return 400 (bad
// input) vs 404 (unknown id).
const TRANSIT_STATION_ID_PATTERN = /^[a-z0-9]{2,8}$/;

export function isTransitStationIdShape(stationId: string): boolean {
  return TRANSIT_STATION_ID_PATTERN.test(stationId);
}

export function isValidTransitStationId(stationId: string): boolean {
  // Use hasOwn (not `in`) so prototype keys like "constructor"/"toString" can't
  // resolve through the prototype chain and turn a 404 into a cacheable 200
  // serializing a built-in, matching the world-cup validator's guard.
  return (
    TRANSIT_STATION_ID_PATTERN.test(stationId) &&
    Object.hasOwn(bayAreaTransitSnapshot.stationBoards, stationId)
  );
}

interface TransitSnapshotOptions {
  preferLive?: boolean;
}

const LIVE_CACHE_TTL_MS = 45_000;
let liveSnapshotCache:
  | { snapshot: typeof bayAreaTransitSnapshot; expiresAt: number }
  | null = null;
let liveSnapshotInflight: Promise<typeof bayAreaTransitSnapshot> | null = null;

async function getTransitSnapshot(
  options: TransitSnapshotOptions = {}
): Promise<typeof bayAreaTransitSnapshot> {
  if (!options.preferLive) return bayAreaTransitSnapshot;
  if (liveSnapshotCache && liveSnapshotCache.expiresAt > Date.now()) {
    return liveSnapshotCache.snapshot;
  }
  if (liveSnapshotInflight) return liveSnapshotInflight;

  liveSnapshotInflight = buildBayAreaTransitLiveSnapshotData(bayAreaTransitSnapshot)
    .then((snapshot) => {
      const typedSnapshot = snapshot as typeof bayAreaTransitSnapshot;
      liveSnapshotCache = {
        snapshot: typedSnapshot,
        expiresAt: Date.now() + LIVE_CACHE_TTL_MS,
      };
      return typedSnapshot;
    })
    .catch(() => bayAreaTransitSnapshot)
    .finally(() => {
      liveSnapshotInflight = null;
    });

  return liveSnapshotInflight;
}

export async function getTransitSummary(
  options: TransitSnapshotOptions = {}
): Promise<TransitSummary> {
  return (await getTransitSnapshot(options)).summary;
}

export async function getTransitStationBoard(
  stationId: string,
  options: TransitSnapshotOptions = {}
): Promise<TransitStationBoard> {
  const snapshot = await getTransitSnapshot(options);
  const board = snapshot.stationBoards[stationId];

  if (!board) {
    throw createTransitSnapshotError(
      "Transit station board was not found.",
      404
    );
  }

  return board;
}
