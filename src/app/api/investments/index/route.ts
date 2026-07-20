import { NextRequest, NextResponse } from "next/server";
import { getInvestmentsIndex } from "@/lib/investmentsData";
import { logger } from "@/lib/logger";
import { NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

export async function GET(request: NextRequest) {
  try {
    const index = await getInvestmentsIndex({ assetOrigin: request.nextUrl.origin });
    const status =
      (index.staleCount ?? index.entries?.filter((entry) => entry.stale).length ?? 0) > 0 ||
      (index.partialCount ?? index.entries?.filter((entry) => entry.partial).length ?? 0) > 0 ||
      (index.priceHealth?.delayedCount ?? 0) > 0 ||
      (index.priceHealth?.missingCount ?? 0) > 0
        ? "degraded"
        : undefined;
    return NextResponse.json(index, {
      headers: createSnapshotResponseHeaders({
        surface: "investments",
        payload: index,
        sourceAsOf: index.lastUpdated,
        cacheControl: "public, max-age=300, stale-while-revalidate=3600",
        status,
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    logger.error("Investments index API error", error);
    return NextResponse.json(
      {
        symbols: [],
        failed: [],
        lastUpdated: null,
        entries: [],
        error: err.message || "Unable to load investments index",
      },
      { status: err.status ?? 500, headers: NO_STORE_HEADERS }
    );
  }
}
