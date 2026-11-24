#!/usr/bin/env tsx
/**
 * Refreshes src/data/earthquakeSnapshot.json from the USGS Earthquake Hazards
 * Program public GeoJSON feeds.
 *
 *   npm run update:earthquake
 *
 * The USGS feeds need no token. If the fetch or parse fails, the existing
 * snapshot stays on disk and the command exits nonzero, so automation reports
 * the failed attempt without replacing good data.
 */

import { resolve } from "node:path";

import { buildEarthquakeSnapshotData } from "../src/lib/earthquakeData";
import { writeFileAtomic } from "./snapshotFallback";

async function main() {
  const outPath = resolve(__dirname, "../src/data/earthquakeSnapshot.json");

  // A failed fetch or parse throws before the write below, so the committed
  // snapshot stays on disk and main's catch exits nonzero.
  console.log("🌎 Building earthquake snapshot from USGS feeds…");
  const snapshot = await buildEarthquakeSnapshotData();

  const output = JSON.stringify(snapshot, null, 2) + "\n";
  writeFileAtomic(outPath, output);

  const stats = snapshot.summary.heroStats;
  console.log(
    `🌎 Done. ${stats.total24h} M2.5+ quakes in 24h, ${stats.total7d} over 7 days, ` +
      `${snapshot.summary.significant.length} significant. Strongest 24h: ` +
      `M${stats.strongest24hMag ?? "?"} (${stats.strongest24hPlace ?? "?"}).`
  );
}

main().catch((err) => {
  console.error("Earthquake snapshot update failed:", err);
  process.exit(1);
});
