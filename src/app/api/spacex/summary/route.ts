import { NextResponse } from "next/server";
import { getMissionControlSummary } from "@/lib/spacexData";

export async function GET() {
  try {
    const summary = await getMissionControlSummary();

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    console.error("SpaceX summary API error:", error);

    return NextResponse.json(
      {
        error: err.message || "Unable to load SpaceX summary",
      },
      { status: err.status ?? 500 }
    );
  }
}
