import { NextResponse } from "next/server";
import {
  createEmptyWorldCupSummarySnapshot,
  getWorldCupSummarySnapshot,
} from "@/lib/worldCupSnapshot";
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
    const summary = await getWorldCupSummarySnapshot();
    return NextResponse.json(summary, {
      headers: createSnapshotResponseHeaders({
        surface: "world-cup",
        payload: summary,
        sourceAsOf: summary.tournament.generatedAt,
        cacheControl: SUCCESS_CACHE_CONTROL,
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      logger.error("World Cup summary API error", error);
    }
    return NextResponse.json(
      {
        ...createEmptyWorldCupSummarySnapshot(),
        error: err.message || "Unable to load World Cup summary",
      },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS }
    );
  }
}
