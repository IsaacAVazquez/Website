import { NextResponse } from "next/server";
import { createEmptyScorePoolsSummary, getScorePoolsSummary } from "@/lib/scorePoolsSnapshot";
import { logger } from "@/lib/logger";

const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const summary = await getScorePoolsSummary();
    return NextResponse.json(summary, { headers: SUCCESS_CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      logger.error("Score-pools summary API error", error);
    }
    return NextResponse.json(
      {
        ...createEmptyScorePoolsSummary(),
        error: err.message || "Unable to load the score-pools summary",
      },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS },
    );
  }
}
