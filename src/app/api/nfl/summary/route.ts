import { NextResponse } from "next/server";
import {
  createEmptyNflSummarySnapshot,
  getNflSummarySnapshot,
} from "@/lib/nflSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET() {
  try {
    const summary = await getNflSummarySnapshot();
    return NextResponse.json(summary, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("NFL summary API error:", error);
    }
    return NextResponse.json(
      {
        ...createEmptyNflSummarySnapshot(),
        error: err.message || "Unable to load NFL summary",
      },
      { status: err.status ?? 500, headers: CACHE_HEADERS }
    );
  }
}
