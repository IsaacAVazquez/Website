import { pollingSnapshot } from "@/data/pollingSnapshot";
import { logger } from "@/lib/logger";
import { POLLING_BLOB_KEY } from "@/lib/pollingData";
import { readSnapshotBlob } from "@/lib/netlifyBlobs";
import { isFiniteNumber as isNumber } from "@/lib/utils";
import type { PollingSnapshot } from "@/types/polling";

// Serve the blob written by the 6-hour scheduled refresh for up to 36 hours.
// Past that, the committed seed (refreshed daily by update-polling.yml) is
// the more honest source — a silently dead refresh function must not keep
// serving old averages as current.
const BLOB_MAX_AGE_MS = 36 * 60 * 60 * 1000;
// One blob read per instance per window. The page itself is served no-store.
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { snapshot: PollingSnapshot; expiresAt: number } | null = null;
let inflight: Promise<PollingSnapshot> | null = null;

export function resetPollingCacheForTests(): void {
  cache = null;
  inflight = null;
}

const isDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function isPollRow(poll: unknown, left: string, right: string): boolean {
  const row = (poll ?? {}) as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.pollster === "string" &&
    typeof row.sampleType === "string" &&
    isDate(row.endDate) &&
    [row.sampleSize, row[left], row[right]].every(isNumber)
  );
}

// The blob is whatever some version of the refresh wrote. These are the
// fields the page reads, so a blob from the other side of a schema change
// falls back to the seed instead of breaking the render.
function isServable(value: unknown): value is PollingSnapshot {
  const blob = (value ?? {}) as Partial<PollingSnapshot>;
  const { approvalAvg: approval, genericBallotAvg: ballot } = blob;
  return (
    isDate(blob.generatedAt) &&
    typeof blob.sourceLabel === "string" &&
    [approval?.approve, approval?.disapprove, approval?.net].every(isNumber) &&
    [ballot?.dem, ballot?.rep, ballot?.margin].every(isNumber) &&
    Array.isArray(blob.approvalTrend) &&
    blob.approvalTrend.every(
      (point) =>
        isDate(point?.date) &&
        isNumber(point.approve) &&
        isNumber(point.disapprove)
    ) &&
    Array.isArray(blob.approvalPolls) &&
    blob.approvalPolls.length > 0 &&
    blob.approvalPolls.every((poll) => isPollRow(poll, "approve", "disapprove")) &&
    Array.isArray(blob.genericBallotPolls) &&
    blob.genericBallotPolls.length > 0 &&
    blob.genericBallotPolls.every((poll) => isPollRow(poll, "dem", "rep")) &&
    // ponytail: race rows go unchecked because the builder never writes any.
    // Check the Race fields the page reads here once it does.
    Array.isArray(blob.senateRaces) &&
    Array.isArray(blob.governorRaces)
  );
}

export async function getPollingSnapshot(): Promise<PollingSnapshot> {
  if (cache && cache.expiresAt > Date.now()) return cache.snapshot;
  if (inflight) return inflight;

  inflight = readSnapshotBlob<PollingSnapshot>(
    POLLING_BLOB_KEY,
    BLOB_MAX_AGE_MS
  )
    .then((blob) => {
      // A blob saved before the deployed seed was generated holds older data
      // than the seed, even while it is inside its maximum age. How old the
      // newest poll is says nothing about the lane, so it is not checked here.
      const isCurrent =
        blob !== null &&
        Date.parse(blob.savedAt) >= Date.parse(pollingSnapshot.generatedAt);
      const snapshot =
        isCurrent && isServable(blob.value) ? blob.value : pollingSnapshot;
      if (isCurrent && snapshot === pollingSnapshot) {
        logger.error("Polling blob failed its shape check, serving the seed.");
      }
      cache = { snapshot, expiresAt: Date.now() + CACHE_TTL_MS };
      return snapshot;
    })
    .catch(() => pollingSnapshot)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
