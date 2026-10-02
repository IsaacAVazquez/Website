#!/usr/bin/env tsx
/**
 * Updates src/data/mlbSnapshot.json with live data from the MLB Stats API.
 * The MLB Stats API is publicly accessible and does not require an auth token.
 *
 * Usage: npx tsx scripts/updateMlbSnapshot.ts
 */

import { resolve } from "node:path";
import { buildMlbSnapshot } from "../src/lib/mlbData";
import type { MlbSnapshot } from "../src/types/mlb";
import { buildOrKeepExisting, writeFileAtomic } from "./snapshotFallback";

async function main() {
  console.log("Fetching MLB snapshot from MLB Stats API…");
  const outPath = resolve(__dirname, "../src/data/mlbSnapshot.json");

  const snapshot = await buildOrKeepExisting(
    outPath,
    "MLB",
    () => buildMlbSnapshot(),
    (built: MlbSnapshot) => built.standings.length > 0
  );
  if (!snapshot) return;

  const output = JSON.stringify(snapshot, null, 2) + "\n";

  writeFileAtomic(outPath, output);
  console.log(
    `Done. Wrote ${snapshot.teams.length} teams, ${snapshot.standings.length} standings rows, ${snapshot.recentGames.length} recent games, ${snapshot.upcomingGames.length} upcoming games, ${Object.keys(snapshot.teamSnapshots).length} team snapshots.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
