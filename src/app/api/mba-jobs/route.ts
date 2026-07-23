import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultMBACompanyIds,
  getMBAJobsData,
  getUnknownMBACompanyIds,
} from "@/lib/mbaJobsServer";
import {
  buildQueryCacheHeaders,
  NO_STORE_HEADERS,
} from "@/lib/apiCacheHeaders";
import {
  getClientIp,
  mbaJobsRateLimiter,
  rateLimitResponse,
} from "@/lib/rateLimit";

const SUCCESS_CACHE_HEADERS = buildQueryCacheHeaders(
  "public, s-maxage=1800, stale-while-revalidate=3600"
);

function normalizeRequestedCompanyIds(request: NextRequest): string[] {
  const params = request.nextUrl.searchParams;
  if (!params.has("companies")) {
    return getDefaultMBACompanyIds();
  }

  const rawParam = params.get("companies") ?? "";
  return Array.from(
    new Set(
      rawParam
        .split(",")
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export async function GET(request: NextRequest) {
  const rate = mbaJobsRateLimiter.check(`mba-jobs:${getClientIp(request)}`);
  if (!rate.success) {
    return rateLimitResponse(rate);
  }

  const requestedIds = normalizeRequestedCompanyIds(request);
  const externalParam = request.nextUrl.searchParams.get("external");
  if (
    externalParam !== null &&
    externalParam !== "on" &&
    externalParam !== "off"
  ) {
    return NextResponse.json(
      { error: "Invalid external parameter." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const unknownCompanyIds = getUnknownMBACompanyIds(requestedIds);
  if (unknownCompanyIds.length > 0) {
    return NextResponse.json(
      {
        error: "One or more company ids are unknown.",
        unknownCompanyIds,
      },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const result = await getMBAJobsData(
    requestedIds,
    externalParam === "on"
  );

  return NextResponse.json(result.body, {
    status: result.isError ? 503 : 200,
    headers:
      result.isError || result.isStale
        ? NO_STORE_HEADERS
        : SUCCESS_CACHE_HEADERS,
  });
}
