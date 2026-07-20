import { NextResponse } from "next/server";
import { getMissionControlSummary } from "@/lib/spacexData";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

export async function GET() {
  try {
    const summary = await getMissionControlSummary();

    return NextResponse.json(summary, {
      headers: createSnapshotResponseHeaders({
        surface: "spacex",
        payload: summary,
        sourceAsOf: summary.generatedAt,
        cacheControl: "public, max-age=120, stale-while-revalidate=600",
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    const status = err.status === 429 ? 503 : err.status ?? 500;
    const message =
      err.status === 429
        ? "Live SpaceX data is temporarily rate limited. Retry shortly."
        : err.message || "Unable to load SpaceX summary";
    if (err.status !== 429 && status >= 500) {
      logger.error("SpaceX summary API error", error);
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}
