import { getStore } from "@netlify/blobs";

const STORE_NAME = "runtime-last-good";

interface DurableEnvelope<T> {
  savedAt: string;
  value: T;
}

function hasNetlifyRuntime(): boolean {
  return process.env.NETLIFY === "true" || process.env.NETLIFY_LOCAL === "true";
}

export async function readDurableJson<T>(
  key: string,
  maxAgeMs: number
): Promise<T | null> {
  if (!hasNetlifyRuntime()) return null;

  try {
    const envelope = (await getStore({
      name: STORE_NAME,
      consistency: "strong",
    }).get(key, { type: "json" })) as DurableEnvelope<T> | null;
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
    await getStore({ name: STORE_NAME, consistency: "strong" }).setJSON(key, {
      savedAt: new Date().toISOString(),
      value,
    } satisfies DurableEnvelope<T>);
  } catch {
    // Runtime data should remain available through the in-memory and CDN
    // layers even if the durable store itself is temporarily unavailable.
  }
}
