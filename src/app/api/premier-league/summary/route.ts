import { NextResponse } from "next/server";
import {
  createEmptyPremierLeagueSummary,
  getPremierLeagueSummary,
} from "@/lib/premierLeagueSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET() {
  try {
    const summary = await getPremierLeagueSummary();

    return NextResponse.json(summary, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      console.error("Premier League summary API error:", error);
    }

    return NextResponse.json(
      {
        ...createEmptyPremierLeagueSummary(),
        error: err.message || "Unable to load Premier League summary",
      },
      {
        status: err.status ?? 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
