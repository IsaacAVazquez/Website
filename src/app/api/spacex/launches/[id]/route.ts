import { NextResponse } from "next/server";
import { getMissionLaunchDetail, isValidMissionLaunchId } from "@/lib/spacexData";
import { logger } from "@/lib/logger";
import { NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidMissionLaunchId(id)) {
    return NextResponse.json(
      { error: "Invalid launch id" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const launch = await getMissionLaunchDetail(id, { source: "snapshot" });

    return NextResponse.json(launch, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    const status = err.status === 429 ? 503 : err.status ?? 500;
    const message =
      err.status === 429
        ? "Live SpaceX data is temporarily rate limited. Retry shortly."
        : err.message || "Unable to load launch detail";

    if (err.status !== 429 && status >= 500) {
      logger.error("SpaceX launch detail API error", error);
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}
