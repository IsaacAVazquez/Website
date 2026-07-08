import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
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

export async function getTransitSummary(): Promise<TransitSummary> {
  return bayAreaTransitSnapshot.summary;
}

export async function getTransitStationBoard(
  stationId: string
): Promise<TransitStationBoard> {
  const board = bayAreaTransitSnapshot.stationBoards[stationId];

  if (!board) {
    throw createTransitSnapshotError(
      "Transit station board was not found.",
      404
    );
  }

  return board;
}
