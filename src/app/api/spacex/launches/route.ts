import { NextRequest, NextResponse } from "next/server";
import type { MissionControlStatus } from "@/types/spacex";
import { getMissionLaunchCards } from "@/lib/spacexData";
import { logger } from "@/lib/logger";
import { buildQueryCacheHeaders, NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";
import { getSpaceXSnapshot } from "@/lib/spacexSnapshot";

const SUCCESS_CACHE_CONTROL =
  "public, max-age=120, stale-while-revalidate=600"

function isValidStatus(status: string): status is MissionControlStatus {
  return status === "upcoming" || status === "past";
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? "upcoming";
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  if (!isValidStatus(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  if (
    limitParam &&
    (!Number.isInteger(limit) || (limit ?? 0) < 1 || (limit ?? 0) > 100)
  ) {
    return NextResponse.json(
      { error: "Invalid limit" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const launches = await getMissionLaunchCards(status, limit);
    const payload = { launches };
    const snapshot = getSpaceXSnapshot();

    return NextResponse.json(
      payload,
      {
        headers: {
          ...buildQueryCacheHeaders(SUCCESS_CACHE_CONTROL),
          ...createSnapshotResponseHeaders({
            surface: "spacex",
            payload,
            sourceAsOf: snapshot.generatedAt,
            cacheControl: SUCCESS_CACHE_CONTROL,
          }),
        },
      }
    );
  } catch (error) {
    const err = error as Error & { status?: number };
    const status = err.status === 429 ? 503 : err.status ?? 500;
    const message =
      err.status === 429
        ? "Live SpaceX data is temporarily rate limited. Retry shortly."
        : err.message || "Unable to load launches";
    if (err.status !== 429 && status >= 500) {
      logger.error("SpaceX launches API error", error);
    }

    return NextResponse.json(
      {
        launches: [],
        error: message,
      },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}
