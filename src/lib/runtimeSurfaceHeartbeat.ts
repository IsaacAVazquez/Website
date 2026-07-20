import type { DataDeliveryStatus } from "@/lib/dataRevision";
import { readDurableJson, writeDurableJson } from "@/lib/durableJsonCache";

// News Pulse and MBA jobs fetch at request time and keep their last-good data in
// per-instance in-memory Maps backed by the durable Netlify Blobs cache. Those
// durable values are keyed for the route's own fallback needs (per feed, per
// query hash), so they're awkward for the revision ledger to read. Instead each
// runtime surface writes a single fixed-key "heartbeat" on every refresh that
// served usable data: when it last had good data and in what condition. The
// ledger reads those heartbeats to place these surfaces alongside the committed
// snapshots without reaching into each route's private keying.

export type RuntimeSurfaceId = "news-pulse" | "mba-jobs";

export interface RuntimeSurfaceHeartbeat {
  // ISO timestamp of the last refresh that served usable data. For a
  // stale-fallback serve this is the last *successful* fetch, not the failed
  // attempt, so ledger age reflects true data age.
  fetchedAt: string;
  status: DataDeliveryStatus;
}

// Read generously — the freshness verdict is the ledger's job via the surface's
// dataFreshnessPolicy, not this max-age. This only discards a heartbeat so old
// it's certainly not the live pipeline's state.
const HEARTBEAT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function heartbeatKey(surface: RuntimeSurfaceId): string {
  return `heartbeat/${surface}`;
}

export async function recordRuntimeSurfaceHeartbeat(
  surface: RuntimeSurfaceId,
  heartbeat: RuntimeSurfaceHeartbeat
): Promise<void> {
  // A total outage that served nothing must not overwrite the last known-good
  // heartbeat; callers should skip recording in that case, but guard here too.
  if (heartbeat.status === "unavailable") return;
  await writeDurableJson(heartbeatKey(surface), heartbeat);
}

export async function readRuntimeSurfaceHeartbeat(
  surface: RuntimeSurfaceId
): Promise<RuntimeSurfaceHeartbeat | null> {
  return readDurableJson<RuntimeSurfaceHeartbeat>(
    heartbeatKey(surface),
    HEARTBEAT_MAX_AGE_MS
  );
}
