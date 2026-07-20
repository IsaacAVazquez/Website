import { createHash } from "node:crypto";

export type DataDeliveryStatus =
  | "fresh"
  | "degraded"
  | "stale-fallback"
  | "unavailable";

export interface DataRevisionEntry {
  surface: string;
  revision: string;
  sourceAsOf: string | null;
  source: string;
  status: DataDeliveryStatus;
  ageSeconds: number | null;
  maxAgeSeconds: number;
}

interface DataRevisionOptions {
  surface: string;
  payload: unknown;
  sourceAsOf: string | null;
  maxAgeMs: number;
  source?: string;
  now?: number;
  status?: DataDeliveryStatus;
}

export function createDataRevision(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function createDataLedgerRevision(
  entries: readonly DataRevisionEntry[]
): string {
  return createDataRevision(
    entries.map(({ surface, revision, sourceAsOf }) => ({
      surface,
      revision,
      sourceAsOf,
    }))
  );
}

export function getDataDeliveryStatus(
  sourceAsOf: string | null,
  maxAgeMs: number,
  now = Date.now()
): Pick<DataRevisionEntry, "status" | "ageSeconds"> {
  if (!sourceAsOf) {
    return { status: "unavailable", ageSeconds: null };
  }

  const sourceTime = Date.parse(sourceAsOf);
  if (!Number.isFinite(sourceTime)) {
    return { status: "unavailable", ageSeconds: null };
  }

  const ageMs = Math.max(0, now - sourceTime);
  return {
    status: ageMs <= maxAgeMs ? "fresh" : "stale-fallback",
    ageSeconds: Math.floor(ageMs / 1000),
  };
}

export function createDataRevisionEntry({
  surface,
  payload,
  sourceAsOf,
  maxAgeMs,
  source = "git-snapshot",
  now = Date.now(),
  status,
}: DataRevisionOptions): DataRevisionEntry {
  const freshness = getDataDeliveryStatus(sourceAsOf, maxAgeMs, now);
  const resolvedStatus =
    status === "degraded" && freshness.status !== "fresh"
      ? freshness.status
      : status ?? freshness.status;

  return {
    surface,
    revision: createDataRevision(payload),
    sourceAsOf,
    source,
    status: resolvedStatus,
    ageSeconds: freshness.ageSeconds,
    maxAgeSeconds: Math.floor(maxAgeMs / 1000),
  };
}

export function createDataResponseHeaders(
  entry: DataRevisionEntry
): Record<string, string> {
  const headers: Record<string, string> = {
    ETag: `"${entry.revision}"`,
    "X-Data-Revision": entry.revision,
    "X-Data-Source": entry.source,
    "X-Data-Status": entry.status,
  };

  if (entry.sourceAsOf) {
    const sourceTime = Date.parse(entry.sourceAsOf);
    if (Number.isFinite(sourceTime)) {
      headers["Last-Modified"] = new Date(sourceTime).toUTCString();
      headers["X-Data-Source-As-Of"] = entry.sourceAsOf;
    }
  }

  return headers;
}
