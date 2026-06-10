import type { EarthquakeSnapshot } from "@/types/earthquake";

// Seed snapshot. The dynamic sections (recent quakes, significant events, region
// counts, magnitude distribution, hero stats) ship empty and are filled by
// scripts/buildEarthquakeSnapshot.ts (`npm run update:earthquake`), which runs
// hourly through .github/workflows/update-earthquake.yml against the public USGS
// GeoJSON feeds. Shipping empty avoids checking in stale or fabricated seismic
// data; the page renders an honest "awaiting first snapshot" state until then.
export const earthquakeSnapshot: EarthquakeSnapshot = {
  summary: {
    generatedAt: "2026-06-09T00:00:00.000Z",
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
  },
};
