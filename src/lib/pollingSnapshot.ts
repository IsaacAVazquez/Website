import { pollingSnapshot } from "@/data/pollingSnapshot";
import { POLLING_BLOB_KEY } from "@/lib/pollingData";
import { readSnapshotBlob } from "@/lib/snapshotBlobStore";
import type { PollingSnapshot } from "@/types/polling";

// Serve the blob written by the 6-hour scheduled refresh for up to 36 hours.
// Past that, the committed seed (refreshed daily by update-polling.yml) is
// the more honest source — a silently dead refresh function must not keep
// serving old averages as current.
const BLOB_MAX_AGE_MS = 36 * 60 * 60 * 1000;
// One blob read per instance per window; the CDN caches the page on top.
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { snapshot: PollingSnapshot; expiresAt: number } | null = null;
let inflight: Promise<PollingSnapshot> | null = null;

export function resetPollingCacheForTests(): void {
  cache = null;
  inflight = null;
}

export async function getPollingSnapshot(): Promise<PollingSnapshot> {
  if (cache && cache.expiresAt > Date.now()) return cache.snapshot;
  if (inflight) return inflight;

  inflight = readSnapshotBlob<PollingSnapshot>(
    POLLING_BLOB_KEY,
    BLOB_MAX_AGE_MS
  )
    .then((blob) => {
      // A malformed or empty blob must never blank the dashboard.
      const snapshot =
        blob?.value?.approvalPolls?.length &&
        blob.value.genericBallotPolls?.length
          ? blob.value
          : pollingSnapshot;
      cache = { snapshot, expiresAt: Date.now() + CACHE_TTL_MS };
      return snapshot;
    })
    .catch(() => pollingSnapshot)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
