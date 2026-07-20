import { NextResponse } from "next/server";
import {
  createEmptyEarthquakeSummary,
  getEarthquakeSummary,
} from "@/lib/earthquakeSnapshot";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

const SUCCESS_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";
// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// upstream failure poisons the cache for the full success TTL.
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const summary = await getEarthquakeSummary({ preferLive: true });

    return NextResponse.json(summary, {
      headers: createSnapshotResponseHeaders({
        surface: "earthquake",
        payload: summary,
        sourceAsOf: summary.generatedAt,
        cacheControl: SUCCESS_CACHE_CONTROL,
        source: "usgs-runtime-with-snapshot-fallback",
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      logger.error("Earthquake summary API error", error);
    }

    return NextResponse.json(
      {
        ...createEmptyEarthquakeSummary(),
        error: err.message || "Unable to load earthquake summary",
      },
      {
        status: err.status ?? 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
