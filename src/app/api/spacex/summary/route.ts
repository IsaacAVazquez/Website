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
    const status = err.status === 429 ? 503 : err.status ?? 500;
    const message =
      err.status === 429
        ? "Live SpaceX data is temporarily rate limited. Retry shortly."
        : err.message || "Unable to load SpaceX summary";
    if (err.status !== 429 && status >= 500) {
      console.error("SpaceX summary API error:", error);
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}
