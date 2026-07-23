import { NextResponse } from "next/server";
import { buildCdnCacheHeaders } from "@/lib/apiCacheHeaders";
import { getNewsPulseData } from "@/lib/newsPulseServer";

const CACHE_CONTROL_HEADER = "public, s-maxage=300, stale-while-revalidate=600";
const ERROR_CACHE_CONTROL_HEADER = "no-store";

export async function GET() {
  const result = await getNewsPulseData();

  return NextResponse.json(result.body, {
    status: result.status,
    headers:
      result.isError || result.isStale
        ? { "Cache-Control": ERROR_CACHE_CONTROL_HEADER }
        : buildCdnCacheHeaders(CACHE_CONTROL_HEADER),
  });
}
