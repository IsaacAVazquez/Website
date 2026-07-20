import { NextResponse } from "next/server";
import { createEmptyFormula1Summary, getFormula1Summary } from "@/lib/formula1Snapshot";
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
    const summary = await getFormula1Summary();

    return NextResponse.json(summary, {
      headers: createSnapshotResponseHeaders({
        surface: "formula-1",
        payload: summary,
        sourceAsOf: summary.generatedAt,
        cacheControl: SUCCESS_CACHE_CONTROL,
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      logger.error("Formula 1 summary API error", error);
    }

    return NextResponse.json(
      {
        ...createEmptyFormula1Summary(),
        error: err.message || "Unable to load the Formula 1 summary",
      },
      {
        status: err.status ?? 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
