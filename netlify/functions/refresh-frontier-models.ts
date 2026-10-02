import { frontierModelsSnapshot } from "../../src/data/frontierModelsSnapshot";
import {
  applyLiveModelFacts,
  fetchLiveModelFacts,
  FRONTIER_MODELS_BLOB_KEY,
} from "../../src/lib/frontierModelsLive";
import { writeSnapshotBlob } from "../../src/lib/snapshotBlobStore";

// Daily fact check for the frontier-models catalog — the pilot for the
// blob-backed refresh lane. It fetches the keyless models.dev and OpenRouter
// catalogs, applies the checkable facts onto the committed curated seed
// (editorial notes untouched), and writes the result to the
// dashboard-snapshots blob store. No git commit, no rebuild, and no cache
// purge, since the page is served no-store and nothing carries a cache tag.
// Failures leave the previous blob (or the committed seed) serving:
// fetchLiveModelFacts throws on degraded upstream payloads, and
// writeSnapshotBlob throws rather than no-ops, so a broken refresh shows up
// as a failed function run in the Netlify logs instead of silent stasis.
export default async () => {
  const catalog = await fetchLiveModelFacts();
  const next = applyLiveModelFacts(frontierModelsSnapshot, catalog);
  await writeSnapshotBlob(FRONTIER_MODELS_BLOB_KEY, next);

  console.log(
    `frontier-models facts refreshed: ${next.liveFacts?.updated ?? 0} updated, ` +
      `${next.liveFacts?.confirmed ?? 0} confirmed, ` +
      `${next.liveFacts?.curatedOnly ?? 0} curated-only.`
  );

  return new Response(JSON.stringify({ ok: true, liveFacts: next.liveFacts }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  // Daily at 07:30 UTC, staggered off the GitHub Actions snapshot crons.
  schedule: "30 7 * * *",
} satisfies { schedule: string };
