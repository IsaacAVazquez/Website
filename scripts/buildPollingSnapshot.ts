import { promises as fs } from "node:fs";
import path from "node:path";
import { buildPollingSnapshotData } from "../src/lib/pollingData";

// Seed builder for the committed polling snapshot. The fetch/transform lives
// in src/lib/pollingData.ts, shared with the Netlify scheduled refresh
// (netlify/functions/refresh-polling.ts). This script only writes the
// committed fallback seed; day-to-day freshness comes from the blob lane.
const SNAPSHOT_PATH = path.join(process.cwd(), "src", "data", "pollingSnapshot.ts");

// Compatibility re-export: tests and callers imported the builder from here
// before the logic moved to src/lib/pollingData.ts.
export { buildPollingSnapshotData as buildPollingSnapshot };

async function main() {
  const snapshot = await buildPollingSnapshotData();
  const contents = `import type { PollingSnapshot } from "@/types/polling";\n\nexport const pollingSnapshot: PollingSnapshot = ${JSON.stringify(snapshot, null, 2)};\n`;
  const temporaryPath = `${SNAPSHOT_PATH}.tmp-${process.pid}`;
  await fs.writeFile(temporaryPath, contents, "utf8");
  await fs.rename(temporaryPath, SNAPSHOT_PATH);
  console.log(
    `Polling snapshot written with ${snapshot.approvalPolls.length} approval and ${snapshot.genericBallotPolls.length} generic ballot polls.`
  );
}

if (process.argv[1]?.endsWith("buildPollingSnapshot.ts")) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
