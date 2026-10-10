import path from "node:path";
import { buildPollingSnapshotData } from "../src/lib/pollingData";
import { writeFileAtomic } from "./snapshotFallback";

// Seed builder for the committed polling snapshot. The fetch/transform lives
// in src/lib/pollingData.ts, shared with the Netlify scheduled refresh
// (netlify/functions/refresh-polling.ts). This script only writes the
// committed fallback seed; day-to-day freshness comes from the blob lane.
const SNAPSHOT_PATH = path.join(process.cwd(), "src", "data", "pollingSnapshot.json");

// Compatibility re-export: tests and callers imported the builder from here
// before the logic moved to src/lib/pollingData.ts.
export { buildPollingSnapshotData as buildPollingSnapshot };

async function main() {
  const snapshot = await buildPollingSnapshotData();
  const contents = JSON.stringify(snapshot, null, 2) + "\n";
  writeFileAtomic(SNAPSHOT_PATH, contents);
  console.log(
    `Polling snapshot written with ${snapshot.approvalPolls.length} approval and ${snapshot.genericBallotPolls.length} generic ballot polls, ` +
      `${snapshot.senateRaces.length} Senate and ${snapshot.governorRaces.length} governor races.`
  );
}

if (process.argv[1]?.endsWith("buildPollingSnapshot.ts")) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
