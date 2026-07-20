import { NextResponse } from "next/server";
import { getFrontierModelsSnapshot } from "@/lib/frontierModelsSnapshot";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

const SUCCESS_CACHE_CONTROL =
  "public, max-age=300, stale-while-revalidate=3600";
// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// failure poisons the cache for the full success TTL.
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const snapshot = await getFrontierModelsSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        ...createSnapshotResponseHeaders({
          surface: "frontier-models",
          payload: snapshot,
          sourceAsOf: snapshot.liveFacts?.checkedAt ?? snapshot.generatedAt,
          cacheControl: SUCCESS_CACHE_CONTROL,
          source: snapshot.liveFacts
            ? "curated-with-daily-fact-check"
            : "curated-seed",
        }),
        // Lets the scheduled refresh purge exactly this surface's CDN entries
        // right after writing a fresh blob.
        "Netlify-Cache-Tag": "frontier-models",
      },
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      logger.error("Frontier models summary API error", error);
    }

    return NextResponse.json(
      { error: err.message || "Unable to load the frontier models snapshot" },
      {
        status: err.status ?? 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
