import { NextResponse } from "next/server";
import {
  createEmptyNbaSummarySnapshot,
  getNbaSummarySnapshot,
} from "@/lib/nbaSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET() {
  try {
    const summary = await getNbaSummarySnapshot();
    return NextResponse.json(summary, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("NBA summary API error:", error);
    }
    return NextResponse.json(
      {
        ...createEmptyNbaSummarySnapshot(),
        error: err.message || "Unable to load NBA summary",
      },
      {
        status: err.status ?? 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
