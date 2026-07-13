import { NextRequest, NextResponse } from "next/server";
import type { MissionControlStatus } from "@/types/spacex";
import { getMissionLaunchCards } from "@/lib/spacexData";
import { logger } from "@/lib/logger";
import { buildQueryCacheHeaders, NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";

const SUCCESS_CACHE_HEADERS = buildQueryCacheHeaders(
  "public, max-age=120, stale-while-revalidate=600"
);

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

    return NextResponse.json(
      {
        launches,
      },
      {
        headers: SUCCESS_CACHE_HEADERS,
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
