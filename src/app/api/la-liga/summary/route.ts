import { NextResponse } from "next/server";
import {
  createEmptyLaLigaSummarySnapshot,
  getLaLigaSummarySnapshot,
} from "@/lib/laLigaSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET() {
  try {
    const summary = await getLaLigaSummarySnapshot();
    return NextResponse.json(summary, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      console.error("La Liga summary API error:", error);
    }

    return NextResponse.json(
      {
        ...createEmptyLaLigaSummarySnapshot(),
        error: err.message || "Unable to load La Liga summary",
      },
      {
        status: err.status ?? 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
