import { NextResponse } from "next/server";
import { getInvestmentsIndex } from "@/lib/investmentsData";

export async function GET() {
  try {
    const index = await getInvestmentsIndex();
    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Investments index API error:", error);
    return NextResponse.json(
      {
        symbols: [],
        failed: [],
        lastUpdated: null,
        error: "Unable to load investments index",
      },
      { status: 500 }
    );
  }
}
