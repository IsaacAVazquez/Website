import { NextResponse } from "next/server";
import {
  createEmptyMlbSummarySnapshot,
  getMlbSummarySnapshot,
} from "@/lib/mlbSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET() {
  try {
    const summary = await getMlbSummarySnapshot();
    return NextResponse.json(summary, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      console.error("MLB summary API error:", error);
    }

    return NextResponse.json(
      {
        ...createEmptyMlbSummarySnapshot(),
        error: err.message || "Unable to load MLB summary",
      },
      {
        status: err.status ?? 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
