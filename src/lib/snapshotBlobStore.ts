import { getStore } from "@netlify/blobs";

/**
 * Blob-backed snapshot store — the git-free refresh lane.
 *
 * Where `durableJsonCache` persists request-time last-good state, this store
 * holds full dashboard snapshots written by scheduled refresh functions
 * (see netlify/functions/refresh-frontier-models.mts). Serving code reads the
 * blob first and falls back to the committed seed snapshot, so a surface can
 * refresh daily without a git commit or a site rebuild.
 *
 * Contract:
 * - Reads are fail-soft: off-Netlify (local dev, jest, CI builds), on any
 *   store error, and on a timeout they return null, and the caller serves
 *   the committed seed.
 * - Writes THROW on failure or timeout. They only run inside scheduled refresh
 *   functions, which must fail loudly so a broken refresh is visible in the
 *   function logs instead of silently freezing the surface.
 * - Strong consistency, so a read right after the scheduled write sees it.
 */
const STORE_NAME = "dashboard-snapshots";
// The library retries five times, five seconds apart, which outlasts both a
// page request and a scheduled run when the store is not answering.
const BLOB_TIMEOUT_MS = 3_000;

interface SnapshotEnvelope<T> {
  savedAt: string;
  value: T;
}

// NETLIFY is set during builds only. The library reads its credentials from
// this context, which the functions runtime and `netlify dev` both set.
function hasNetlifyRuntime(): boolean {
  return Boolean(
    globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT
  );
}

// ponytail: the library takes no abort signal, so a call that loses the race
// keeps retrying in the background. Pass a fetch with a deadline to getStore
// if those retries ever show up in function duration.
function withTimeout<T>(call: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    call,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(`Netlify Blobs did not answer within ${BLOB_TIMEOUT_MS} ms.`)
          ),
        BLOB_TIMEOUT_MS
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

interface SnapshotBlobRead<T> {
  value: T;
  savedAt: string;
}

export async function readSnapshotBlob<T>(
  key: string,
  maxAgeMs: number
): Promise<SnapshotBlobRead<T> | null> {
  if (!hasNetlifyRuntime()) return null;

  try {
    const envelope = (await withTimeout(
      getStore({ name: STORE_NAME, consistency: "strong" }).get(key, {
        type: "json",
      })
    )) as SnapshotEnvelope<T> | null;
    if (!envelope?.savedAt) return null;
    const savedAt = Date.parse(envelope.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > maxAgeMs) {
      return null;
    }
    return { value: envelope.value, savedAt: envelope.savedAt };
  } catch {
    return null;
  }
}

export async function writeSnapshotBlob<T>(
  key: string,
  value: T
): Promise<void> {
  if (!hasNetlifyRuntime()) {
    throw new Error(
      "writeSnapshotBlob requires the Netlify runtime; refresh functions must not silently no-op."
    );
  }

  await withTimeout(
    getStore({ name: STORE_NAME, consistency: "strong" }).setJSON(key, {
      savedAt: new Date().toISOString(),
      value,
    } satisfies SnapshotEnvelope<T>)
  );
}
