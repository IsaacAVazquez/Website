import { getStore } from "@netlify/blobs";
import { logger } from "./logger";

/**
 * Netlify Blobs envelopes, `{ savedAt, value }`, in two stores.
 *
 * `runtime-last-good` (readDurableJson / writeDurableJson) holds request-time
 * last-good state. Writes there swallow errors, because runtime data stays
 * available through the in-memory and CDN layers when the store is down.
 *
 * `dashboard-snapshots` (readSnapshotBlob / writeSnapshotBlob) is the git-free
 * refresh lane: scheduled functions write whole dashboard snapshots and serving
 * code reads the blob before the committed seed. Writes there THROW on failure,
 * timeout, or a missing runtime, so a broken refresh shows up in the function
 * logs instead of silently freezing the surface.
 *
 * Reads are fail-soft everywhere: off-Netlify (local dev, jest, CI builds), on
 * any store error, on a timeout, and past `maxAgeMs` they return null and the
 * caller serves what it has. Strong consistency, so a read right after the
 * scheduled write sees it.
 */
const RUNTIME_STORE = "runtime-last-good";
const SNAPSHOT_STORE = "dashboard-snapshots";
// The library retries five times, five seconds apart, which outlasts both a
// page request and a scheduled run when the store is not answering.
const BLOB_TIMEOUT_MS = 3_000;

interface BlobEnvelope<T> {
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

async function readBlobJson<T>(
  storeName: string,
  key: string,
  maxAgeMs: number
): Promise<BlobEnvelope<T> | null> {
  if (!hasNetlifyRuntime()) return null;

  try {
    const envelope = (await withTimeout(
      getStore({ name: storeName, consistency: "strong" }).get(key, {
        type: "json",
      })
    )) as BlobEnvelope<T> | null;
    if (!envelope?.savedAt) return null;
    const savedAt = Date.parse(envelope.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > maxAgeMs) return null;
    return { value: envelope.value, savedAt: envelope.savedAt };
  } catch {
    return null;
  }
}

async function writeBlobJson<T>(storeName: string, key: string, value: T): Promise<void> {
  await withTimeout(
    getStore({ name: storeName, consistency: "strong" }).setJSON(key, {
      savedAt: new Date().toISOString(),
      value,
    } satisfies BlobEnvelope<T>)
  );
}

export async function readDurableJson<T>(
  key: string,
  maxAgeMs: number
): Promise<T | null> {
  return (await readBlobJson<T>(RUNTIME_STORE, key, maxAgeMs))?.value ?? null;
}

export async function writeDurableJson<T>(key: string, value: T): Promise<void> {
  if (!hasNetlifyRuntime()) return;

  try {
    await writeBlobJson(RUNTIME_STORE, key, value);
  } catch (error) {
    logger.error(`Durable cache write dropped for ${key}`, error);
  }
}

export function readSnapshotBlob<T>(
  key: string,
  maxAgeMs: number
): Promise<BlobEnvelope<T> | null> {
  return readBlobJson<T>(SNAPSHOT_STORE, key, maxAgeMs);
}

export async function writeSnapshotBlob<T>(key: string, value: T): Promise<void> {
  if (!hasNetlifyRuntime()) {
    throw new Error(
      "writeSnapshotBlob requires the Netlify runtime; refresh functions must not silently no-op."
    );
  }

  await writeBlobJson(SNAPSHOT_STORE, key, value);
}
