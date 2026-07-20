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
 * - Reads are fail-soft: off-Netlify (local dev, jest, CI builds) and on any
 *   store error they return null, and the caller serves the committed seed.
 * - Writes THROW on failure. They only run inside scheduled refresh
 *   functions, which must fail loudly so a broken refresh is visible in the
 *   function logs instead of silently freezing the surface.
 * - Strong consistency, so a read right after the scheduled write sees it.
 */
const STORE_NAME = "dashboard-snapshots";

interface SnapshotEnvelope<T> {
  savedAt: string;
  value: T;
}

function hasNetlifyRuntime(): boolean {
  return process.env.NETLIFY === "true" || process.env.NETLIFY_LOCAL === "true";
}

export interface SnapshotBlobRead<T> {
  value: T;
  savedAt: string;
}

export async function readSnapshotBlob<T>(
  key: string,
  maxAgeMs: number
): Promise<SnapshotBlobRead<T> | null> {
  if (!hasNetlifyRuntime()) return null;

  try {
    const envelope = (await getStore({
      name: STORE_NAME,
      consistency: "strong",
    }).get(key, { type: "json" })) as SnapshotEnvelope<T> | null;
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

  await getStore({ name: STORE_NAME, consistency: "strong" }).setJSON(key, {
    savedAt: new Date().toISOString(),
    value,
  } satisfies SnapshotEnvelope<T>);
}
