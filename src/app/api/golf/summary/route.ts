import { NextResponse } from "next/server";
import { createEmptyGolfSummary, getGolfSummary } from "@/lib/golfSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET() {
  try {
    const summary = await getGolfSummary();

    return NextResponse.json(summary, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      console.error("Golf summary API error:", error);
    }

    return NextResponse.json(
      {
        ...createEmptyGolfSummary(),
        error: err.message || "Unable to load golf summary",
      },
      {
        status: err.status ?? 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
