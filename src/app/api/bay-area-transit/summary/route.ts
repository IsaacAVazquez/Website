import { NextResponse } from "next/server";
import {
  createEmptyTransitSummary,
  getTransitSummary,
} from "@/lib/bayAreaTransitSnapshot";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

const SUCCESS_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=120";
// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// failure poisons the cache for the full success TTL.
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const summary = await getTransitSummary({ preferLive: true });

    return NextResponse.json(summary, {
      headers: createSnapshotResponseHeaders({
        surface: "bay-area-transit",
        payload: summary,
        sourceAsOf: summary.system?.generatedAt ?? null,
        cacheControl: SUCCESS_CACHE_CONTROL,
        source: "bart-runtime-with-snapshot-fallback",
        status:
          Object.values(summary.sectionStatus ?? {}).some(
            (sectionStatus) => sectionStatus !== "fresh"
          )
            ? "degraded"
            : undefined,
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      logger.error("Transit summary API error", error);
    }

    return NextResponse.json(
      {
        ...createEmptyTransitSummary(),
        error: err.message || "Unable to load transit summary",
      },
      {
        status: err.status ?? 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
