import { NextRequest, NextResponse } from "next/server";
import { getInvestmentsIndex } from "@/lib/investmentsData";

export async function GET(request: NextRequest) {
  try {
    const index = await getInvestmentsIndex({ assetOrigin: request.nextUrl.origin });
    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    console.error("Investments index API error:", error);
    return NextResponse.json(
      {
        symbols: [],
        failed: [],
        lastUpdated: null,
        error: err.message || "Unable to load investments index",
      },
      { status: err.status ?? 500 }
    );
  }
}
