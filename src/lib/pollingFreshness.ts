import { getDataFreshnessPolicy } from "@/lib/dataFreshnessPolicy";
import type { PollingSnapshot } from "@/types/polling";

const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export function isPollingSnapshotSourceFresh(
  snapshot: Pick<PollingSnapshot, "sourceAsOf">,
  now = Date.now()
): boolean {
  const sourceTime = Date.parse(snapshot.sourceAsOf ?? "");
  if (!Number.isFinite(sourceTime)) return false;

  const { maxAgeMs } = getDataFreshnessPolicy("polling", new Date(now));
  const ageMs = now - sourceTime;
  return ageMs >= -FUTURE_TOLERANCE_MS && ageMs <= maxAgeMs;
}

export function assertPollingSnapshotSourceFresh(
  snapshot: Pick<PollingSnapshot, "sourceAsOf">,
  now = Date.now()
): void {
  if (isPollingSnapshotSourceFresh(snapshot, now)) return;

  const { maxAgeMs } = getDataFreshnessPolicy("polling", new Date(now));
  throw new Error(
    `Polling snapshot source is stale or invalid (source as of ${snapshot.sourceAsOf ?? "unavailable"}; maximum age ${Math.floor(maxAgeMs / 86_400_000)} days).`
  );
}
