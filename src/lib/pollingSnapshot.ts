import { pollingSnapshot } from "@/data/pollingSnapshot";
import { logger } from "@/lib/logger";
import { POLLING_BLOB_KEY } from "@/lib/pollingData";
import { readSnapshotBlob } from "@/lib/netlifyBlobs";
import { isFiniteNumber as isNumber } from "@/lib/utils";
import type { PollingSnapshot, Race, RaceCandidate } from "@/types/polling";

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

function isBasePollRow(row: Record<string, unknown>): boolean {
  return (
    typeof row.id === "string" &&
    typeof row.pollster === "string" &&
    typeof row.sampleType === "string" &&
    isDate(row.endDate) &&
    isNumber(row.sampleSize)
  );
}

function isPollRow(poll: unknown, left: string, right: string): boolean {
  const row = (poll ?? {}) as Record<string, unknown>;
  return isBasePollRow(row) && [row[left], row[right]].every(isNumber);
}

function isCandidate(candidate: unknown): boolean {
  const row = (candidate ?? {}) as Partial<RaceCandidate>;
  return typeof row.name === "string" && isNumber(row.support);
}

function isRacePollRow(poll: unknown): boolean {
  const row = (poll ?? {}) as Record<string, unknown>;
  return (
    isBasePollRow(row) &&
    Array.isArray(row.candidates) &&
    row.candidates.length >= 2 &&
    row.candidates.every(isCandidate)
  );
}

// The fields RaceRow, RaceSidebar, and the overview read.
function isRaceRow(race: unknown): boolean {
  const row = (race ?? {}) as Partial<Race>;
  return (
    typeof row.id === "string" &&
    typeof row.state === "string" &&
    typeof row.stateAbbr === "string" &&
    (row.office === "Senate" || row.office === "Governor") &&
    Array.isArray(row.candidates) &&
    row.candidates.length === 2 &&
    row.candidates.every(isCandidate) &&
    [row.margin, row.pollCount].every(isNumber) &&
    isDate(row.lastPolled) &&
    Array.isArray(row.polls) &&
    row.polls.length > 0 &&
    row.polls.every(isRacePollRow)
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
    // Either race list may be empty, since VoteHub can have no race poll in
    // the window, but every row present has to carry what the page reads.
    Array.isArray(blob.senateRaces) &&
    blob.senateRaces.every(isRaceRow) &&
    Array.isArray(blob.governorRaces) &&
    blob.governorRaces.every(isRaceRow)
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
