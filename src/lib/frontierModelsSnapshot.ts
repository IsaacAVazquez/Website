import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import { FRONTIER_MODELS_BLOB_KEY } from "@/lib/frontierModelsLive";
import { readSnapshotBlob } from "@/lib/snapshotBlobStore";
import type { FrontierModelsSnapshot } from "@/types/frontierModels";

// Serve the blob written by the daily scheduled refresh for up to three
// days. Past that, the committed curated seed is the more honest source —
// a silently dead refresh function must not keep stamping old facts as
// freshly checked.
const BLOB_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
// One blob read per instance per window; the CDN caches the route on top.
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { snapshot: FrontierModelsSnapshot; expiresAt: number } | null =
  null;
let inflight: Promise<FrontierModelsSnapshot> | null = null;

export function resetFrontierModelsCacheForTests(): void {
  cache = null;
  inflight = null;
}

export async function getFrontierModelsSnapshot(): Promise<FrontierModelsSnapshot> {
  if (cache && cache.expiresAt > Date.now()) return cache.snapshot;
  if (inflight) return inflight;

  inflight = readSnapshotBlob<FrontierModelsSnapshot>(
    FRONTIER_MODELS_BLOB_KEY,
    BLOB_MAX_AGE_MS
  )
    .then((blob) => {
      // A malformed or empty blob must never blank the catalog.
      const snapshot = blob?.value?.models?.length
        ? blob.value
        : frontierModelsSnapshot;
      cache = { snapshot, expiresAt: Date.now() + CACHE_TTL_MS };
      return snapshot;
    })
    .catch(() => frontierModelsSnapshot)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
