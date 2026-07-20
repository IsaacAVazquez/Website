import {
  createDataResponseHeaders,
  createDataRevisionEntry,
  type DataDeliveryStatus,
} from "@/lib/dataRevision";
import {
  getDataFreshnessPolicy,
  type DataSurfaceId,
} from "@/lib/dataFreshnessPolicy";

interface SnapshotResponseHeadersOptions {
  surface: DataSurfaceId;
  payload: unknown;
  sourceAsOf: string | null;
  cacheControl: string;
  source?: string;
  status?: DataDeliveryStatus;
}

export function createSnapshotResponseHeaders({
  surface,
  payload,
  sourceAsOf,
  cacheControl,
  source,
  status,
}: SnapshotResponseHeadersOptions): Record<string, string> {
  const policy = getDataFreshnessPolicy(surface);
  const revision = createDataRevisionEntry({
    surface,
    payload,
    sourceAsOf,
    maxAgeMs: policy.maxAgeMs,
    source,
    status,
  });

  return {
    "Cache-Control": cacheControl,
    ...createDataResponseHeaders(revision),
  };
}
