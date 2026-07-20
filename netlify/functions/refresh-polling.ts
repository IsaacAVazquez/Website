import type { Config } from "@netlify/functions";
import { purgeCache } from "@netlify/functions";
import {
  buildPollingSnapshotData,
  POLLING_BLOB_KEY,
} from "../../src/lib/pollingData";
import { writeSnapshotBlob } from "../../src/lib/snapshotBlobStore";

// Six-hour VoteHub refresh through the blob lane (see the lane description in
// SNAPSHOT_DRIVEN_DASHBOARDS.md). buildPollingSnapshotData throws on thin or
// malformed VoteHub data and writeSnapshotBlob throws on store failures, so a
// broken refresh surfaces as a failed function run while the previous blob
// (or the committed seed) keeps serving.
export default async () => {
  const snapshot = await buildPollingSnapshotData();
  await writeSnapshotBlob(POLLING_BLOB_KEY, snapshot);

  try {
    await purgeCache({ tags: [POLLING_BLOB_KEY] });
  } catch (error) {
    // Purge is an optimization; CDN entries age out on their own.
    console.warn("polling cache tag purge failed:", error);
  }

  console.log(
    `Polling blob refreshed: ${snapshot.approvalPolls.length} approval, ` +
      `${snapshot.genericBallotPolls.length} generic ballot polls, ` +
      `source as of ${snapshot.sourceAsOf}.`
  );

  return new Response(
    JSON.stringify({ ok: true, sourceAsOf: snapshot.sourceAsOf }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const config: Config = {
  // Every six hours, staggered off the frontier-models daily run (07:30) and
  // the GitHub Actions snapshot crons.
  schedule: "45 */6 * * *",
};
