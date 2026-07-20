import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { buildEarthquakeSnapshotData } from "@/lib/earthquakeData";
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
  // Use hasOwn (not `in`) so prototype keys like "constructor"/"toString" — which
  // pass the case-insensitive shape regex — don't resolve through the prototype
  // chain and turn a 404 into a cacheable 200 serializing a built-in.
  return (
    QUAKE_ID_PATTERN.test(quakeId) &&
    Object.hasOwn(earthquakeSnapshot.summary.quakeDetails, quakeId)
  );
}

interface EarthquakeSummaryOptions {
  preferLive?: boolean;
}

export async function getEarthquakeSummary(
  options: EarthquakeSummaryOptions = {}
): Promise<EarthquakeSummary> {
  if (options.preferLive) {
    try {
      return (await buildEarthquakeSnapshotData()).summary;
    } catch {
      // The committed snapshot is the last-known-good fallback when USGS is
      // unavailable. Its generatedAt timestamp keeps the fallback explicit in
      // response headers and the UI instead of making old data look current.
    }
  }

  return earthquakeSnapshot.summary;
}

export async function getQuakeEvent(quakeId: string): Promise<QuakeEvent> {
  const event = Object.hasOwn(earthquakeSnapshot.summary.quakeDetails, quakeId)
    ? earthquakeSnapshot.summary.quakeDetails[quakeId]
    : undefined;

  if (!event) {
    throw createEarthquakeSnapshotError("Earthquake event was not found.", 404);
  }

  return event;
}
