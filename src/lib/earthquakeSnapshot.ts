import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { buildEarthquakeSnapshotData } from "@/lib/earthquakeData";
import type { EarthquakeSummary } from "@/types/earthquake";

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

interface EarthquakeSummaryOptions {
  preferLive?: boolean;
}

// Every CDN miss used to trigger a fresh three-feed USGS fetch. A short
// in-memory TTL plus a single-flight promise (mirroring
// bayAreaTransitSnapshot) collapses concurrent misses into one upstream call
// per instance. The TTL matches the route's max-age=60 so this cache and the
// CDN expire together.
const LIVE_CACHE_TTL_MS = 60_000;
// A visitor is waiting on this read and Netlify ends a synchronous function at
// 60 seconds, so it gets one short attempt before the committed snapshot.
const LIVE_FETCH_BUDGET = { timeoutMs: 4_000, attempts: 1 };
let liveSummaryCache: { summary: EarthquakeSummary; expiresAt: number } | null =
  null;
let liveSummaryInflight: Promise<EarthquakeSummary> | null = null;

export function resetEarthquakeLiveCacheForTests(): void {
  liveSummaryCache = null;
  liveSummaryInflight = null;
}

export async function getEarthquakeSummary(
  options: EarthquakeSummaryOptions = {}
): Promise<EarthquakeSummary> {
  if (!options.preferLive) return earthquakeSnapshot.summary;

  if (liveSummaryCache && liveSummaryCache.expiresAt > Date.now()) {
    return liveSummaryCache.summary;
  }
  if (liveSummaryInflight) return liveSummaryInflight;

  liveSummaryInflight = buildEarthquakeSnapshotData(LIVE_FETCH_BUDGET)
    .then((snapshot) => {
      liveSummaryCache = {
        summary: snapshot.summary,
        expiresAt: Date.now() + LIVE_CACHE_TTL_MS,
      };
      return snapshot.summary;
    })
    // The committed snapshot is the last-known-good fallback when USGS is
    // unavailable. It is refreshed daily, so its age alone grades as fresh,
    // and feedStatus is what tells the route and the page it is a fallback.
    // Failures are not negative-cached, so the next miss retries USGS.
    .catch(
      (): EarthquakeSummary => ({
        ...earthquakeSnapshot.summary,
        feedStatus: "stale-fallback",
      })
    )
    .finally(() => {
      liveSummaryInflight = null;
    });

  return liveSummaryInflight;
}
