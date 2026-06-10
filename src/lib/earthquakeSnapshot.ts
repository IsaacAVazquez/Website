import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import type { EarthquakeSummary, QuakeEvent } from "@/types/earthquake";

interface EarthquakeSnapshotError extends Error {
  status: number;
}

function createEarthquakeSnapshotError(
  message: string,
  status: number
): EarthquakeSnapshotError {
  return Object.assign(new Error(message), { status });
}

export function createEmptyEarthquakeSummary(): EarthquakeSummary {
  return {
    generatedAt: new Date().toISOString(),
    feedUpdated: null,
    heroStats: {
      total24h: 0,
      total7d: 0,
      felt24h: 0,
      strongest24hMag: null,
      strongest24hPlace: null,
      significant30d: 0,
      largest7dMag: null,
      tsunamiAlerts7d: 0,
      deepestKm: null,
    },
    recent: [],
    significant: [],
    magnitudeBuckets: [],
    regions: [],
    quakeDetails: {},
  };
}

// USGS event ids are short alphanumeric network+code strings like "us7000n7yz"
// or "ci40123456". The shape check runs before membership so route handlers can
// return 400 (bad input) vs 404 (unknown id).
const QUAKE_ID_PATTERN = /^[a-z0-9]{6,24}$/i;

export function isQuakeIdShape(quakeId: string): boolean {
  return QUAKE_ID_PATTERN.test(quakeId);
}

export function isValidQuakeId(quakeId: string): boolean {
  return (
    QUAKE_ID_PATTERN.test(quakeId) &&
    quakeId in earthquakeSnapshot.summary.quakeDetails
  );
}

export async function getEarthquakeSummary(): Promise<EarthquakeSummary> {
  return earthquakeSnapshot.summary;
}

export async function getQuakeEvent(quakeId: string): Promise<QuakeEvent> {
  const event = earthquakeSnapshot.summary.quakeDetails[quakeId];

  if (!event) {
    throw createEarthquakeSnapshotError("Earthquake event was not found.", 404);
  }

  return event;
}
