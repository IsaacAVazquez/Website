import {
  buildPollingSnapshotData,
  POLLING_BLOB_KEY,
} from "../../src/lib/pollingData";
import { writeSnapshotBlob } from "../../src/lib/netlifyBlobs";

// Six-hour VoteHub refresh through the blob lane (see the lane description in
// SNAPSHOT_DRIVEN_DASHBOARDS.md). buildPollingSnapshotData throws on thin or
// malformed VoteHub data and writeSnapshotBlob throws on store failures, so a
// broken refresh surfaces as a failed function run while the previous blob
// (or the committed seed) keeps serving. How old VoteHub's newest poll is does
// not fail the run, since a source with nothing new to publish is not a fault
// in this lane. The page states the newest poll date for each series instead.
export default async () => {
  const snapshot = await buildPollingSnapshotData();
  await writeSnapshotBlob(POLLING_BLOB_KEY, snapshot);

  console.log(
    `Polling blob refreshed at ${snapshot.generatedAt}: ` +
      `${snapshot.approvalPolls.length} approval, ` +
      `${snapshot.genericBallotPolls.length} generic ballot polls, ` +
      `source as of ${snapshot.sourceAsOf}.`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      generatedAt: snapshot.generatedAt,
      sourceAsOf: snapshot.sourceAsOf,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const config = {
  // Every six hours, staggered off the frontier-models daily run (07:30) and
  // the GitHub Actions snapshot crons.
  schedule: "45 */6 * * *",
} satisfies { schedule: string };
