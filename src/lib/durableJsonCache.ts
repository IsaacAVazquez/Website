import { getStore } from "@netlify/blobs";
import { logger } from "./logger";

const STORE_NAME = "runtime-last-good";
// The library retries five times, five seconds apart, and these calls sit in
// the request path, so a store that is not answering must not hold a visitor.
const BLOB_TIMEOUT_MS = 3_000;

interface DurableEnvelope<T> {
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

export async function readDurableJson<T>(
  key: string,
  maxAgeMs: number
): Promise<T | null> {
  if (!hasNetlifyRuntime()) return null;

  try {
    const envelope = (await withTimeout(
      getStore({ name: STORE_NAME, consistency: "strong" }).get(key, {
        type: "json",
      })
    )) as DurableEnvelope<T> | null;
    if (!envelope?.savedAt) return null;
    const savedAt = Date.parse(envelope.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > maxAgeMs) return null;
    return envelope.value;
  } catch {
    return null;
  }
}

export async function writeDurableJson<T>(
  key: string,
  value: T
): Promise<void> {
  if (!hasNetlifyRuntime()) return;

  try {
    await withTimeout(
      getStore({ name: STORE_NAME, consistency: "strong" }).setJSON(key, {
        savedAt: new Date().toISOString(),
        value,
      } satisfies DurableEnvelope<T>)
    );
  } catch (error) {
    // Runtime data should remain available through the in-memory and CDN
    // layers even if the durable store itself is temporarily unavailable.
    logger.error(`Durable cache write dropped for ${key}`, error);
  }
}
