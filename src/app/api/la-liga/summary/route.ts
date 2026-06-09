import { NextResponse } from "next/server";
import {
  createEmptyLaLigaSummarySnapshot,
  getLaLigaSummarySnapshot,
} from "@/lib/laLigaSnapshot";
import { logger } from "@/lib/logger";

const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};
// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// upstream failure poisons the cache for the full success TTL.
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const summary = await getLaLigaSummarySnapshot();
    return NextResponse.json(summary, { headers: SUCCESS_CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      logger.error("La Liga summary API error", error);
    }

    return NextResponse.json(
      {
        ...createEmptyLaLigaSummarySnapshot(),
        error: err.message || "Unable to load La Liga summary",
      },
      {
        status: err.status ?? 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
