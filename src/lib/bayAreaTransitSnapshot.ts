import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
import { buildBayAreaTransitLiveSnapshotData } from "@/lib/bayAreaTransitData";
import type {
  TransitStationBoard,
  TransitSummary,
} from "@/types/bayAreaTransit";
import { HttpStatusError } from "@/lib/utils";

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
  // The station list and not the board map, because BART's departures feed
  // leaves out any station with no train in its lookahead window. Matching on
  // the list also keeps prototype keys like "constructor" from resolving.
  return (
    TRANSIT_STATION_ID_PATTERN.test(stationId) &&
    bayAreaTransitSnapshot.summary.stations.some(
      (station) => station.id === stationId
    )
  );
}

interface TransitSnapshotOptions {
  preferLive?: boolean;
}

const LIVE_CACHE_TTL_MS = 45_000;
// Long enough that the station request behind a failed summary request does
// not wait on BART again, short enough that a recovery shows within a minute.
const LIVE_FAILURE_TTL_MS = 30_000;
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
    .catch(() => {
      const snapshot: typeof bayAreaTransitSnapshot = {
        ...bayAreaTransitSnapshot,
        summary: {
          ...bayAreaTransitSnapshot.summary,
          sectionStatus: {
            advisories: "stale-fallback",
            elevator: "stale-fallback",
            departures: "stale-fallback",
          },
        },
      };
      liveSnapshotCache = {
        snapshot,
        expiresAt: Date.now() + LIVE_FAILURE_TTL_MS,
      };
      return snapshot;
    })
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
  const station = snapshot.summary.stations.find(
    (entry) => entry.id === stationId
  );

  if (!station) {
    throw new HttpStatusError(
      "Transit station board was not found.",
      404
    );
  }

  // A real station with no board has no train in BART's lookahead window.
  const board = snapshot.stationBoards[stationId] ?? {
    id: station.id,
    abbr: station.abbr,
    name: station.name,
    departures: [],
    generatedAt:
      snapshot.summary.system?.generatedAt ?? new Date().toISOString(),
  };

  return {
    ...board,
    status: snapshot.summary.sectionStatus?.departures ?? "fresh",
  };
}
