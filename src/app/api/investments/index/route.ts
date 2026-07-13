import { NextRequest, NextResponse } from "next/server";
import { getInvestmentsIndex } from "@/lib/investmentsData";
import { logger } from "@/lib/logger";
import { NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";
import {
  createDataResponseHeaders,
  createDataRevisionEntry,
} from "@/lib/dataRevision";

export async function GET(request: NextRequest) {
  try {
    const index = await getInvestmentsIndex({ assetOrigin: request.nextUrl.origin });
    const revision = createDataRevisionEntry({
      surface: "investments",
      payload: index,
      sourceAsOf: index.lastUpdated,
      // The refresh runs Mon+Thu 22:15 UTC; the Thu -> Mon gap is exactly 96h,
      // so a 120h window keeps an on-cadence snapshot from reading stale.
      maxAgeMs: 5 * 24 * 60 * 60 * 1000,
      status: (index.staleCount ?? 0) > 0 ? "degraded" : undefined,
    });
    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        ...createDataResponseHeaders(revision),
      },
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
