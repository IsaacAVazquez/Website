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

function hasContents(
  snapshot: TransitSnapshot | null
): snapshot is TransitSnapshot {
  return Boolean(
    snapshot &&
      snapshot.summary.lines.length > 0 &&
      snapshot.summary.stations.length > 0
  );
}

async function main() {
  const outPath = resolve(
    __dirname,
    "../src/data/bayAreaTransitSnapshot.json"
  );

  // Read the committed snapshot up front, not only in the catch. A successful
  // BART call can still return an all but empty departures feed during the
  // pre-service hours, and the builder needs the previous boards to fall back
  // on so that case cannot collapse the station map.
  const committed = readGeneratedSnapshot<TransitSnapshot>(outPath);

  let snapshot: TransitSnapshot;
  try {
    console.log("🚆 Building Bay Area transit snapshot from BART…");
    snapshot = await buildBayAreaTransitSnapshotData({
      previousBoards: committed?.stationBoards,
    });
  } catch (error) {
    const existing = committed;
    if (hasContents(existing)) {
      console.warn(
        "🚆 Transit snapshot refresh failed; keeping the existing snapshot.",
        error
      );
    }
    throw error;
  }

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
