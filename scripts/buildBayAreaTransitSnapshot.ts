#!/usr/bin/env tsx
/**
 * Refreshes src/data/bayAreaTransitSnapshot.json from BART's public API.
 *
 *   npm run update:bay-area-transit
 *
 * BART's legacy API needs no token (the published demo key is baked into the
 * builder). If the fetch or parse fails, the existing snapshot stays on disk
 * and the command exits nonzero so automation reports the failed attempt.
 */

import { resolve } from "node:path";

import { buildBayAreaTransitSnapshotData } from "../src/lib/bayAreaTransitData";
import type { TransitSnapshot } from "../src/types/bayAreaTransit";
import { readGeneratedSnapshot, writeFileAtomic } from "./snapshotFallback";

async function main() {
  const outPath = resolve(
    __dirname,
    "../src/data/bayAreaTransitSnapshot.json"
  );

  // A successful BART call can still return an all but empty departures feed
  // during the pre-service hours, and the builder needs the previous boards to
  // fall back on so that case cannot collapse the station map.
  const committed = readGeneratedSnapshot<TransitSnapshot>(outPath);

  // A failed fetch or parse throws before the write below, so the committed
  // snapshot stays on disk and main's catch exits nonzero.
  console.log("🚆 Building Bay Area transit snapshot from BART…");
  const snapshot = await buildBayAreaTransitSnapshotData({
    previousBoards: committed?.stationBoards,
  });

  const output = JSON.stringify(snapshot, null, 2) + "\n";
  writeFileAtomic(outPath, output);

  const { heroStats } = snapshot.summary;
  console.log(
    `🚆 Done. ${heroStats.lineCount} lines, ${heroStats.stationCount} stations, ` +
      `${heroStats.trainsTracked} trains tracked, ` +
      `${heroStats.activeAdvisories} advisories, ` +
      `${heroStats.elevatorOutages} elevator outages.`
  );
}

main().catch((err) => {
  console.error("Bay Area transit snapshot update failed:", err);
  process.exit(1);
});
