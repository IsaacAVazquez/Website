import { NextResponse } from "next/server";
import {
  createEmptyNflSummarySnapshot,
  getNflSummarySnapshot,
} from "@/lib/nflSnapshot";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

const SUCCESS_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=900";
// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// upstream failure poisons the cache for the full success TTL.
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const summary = await getNflSummarySnapshot();
    return NextResponse.json(summary, {
      headers: createSnapshotResponseHeaders({
        surface: "nfl",
        payload: summary,
        sourceAsOf: summary.updatedAt,
        cacheControl: SUCCESS_CACHE_CONTROL,
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      logger.error("NFL summary API error", error);
    }
    return NextResponse.json(
      {
        ...createEmptyNflSummarySnapshot(),
        error: err.message || "Unable to load NFL summary",
      },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS }
    );
  }
}
