import { NextResponse } from "next/server";
import {
  createEmptyGolfPlayerSnapshot,
  getGolfPlayerSnapshot,
  isValidGolfPlayerId,
} from "@/lib/golfSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  if (!isValidGolfPlayerId(playerId)) {
    return NextResponse.json(
      {
        ...createEmptyGolfPlayerSnapshot(),
        error: "Invalid player id",
      },
      {
        status: 404,
        headers: CACHE_HEADERS,
      }
    );
  }

  try {
    const snapshot = await getGolfPlayerSnapshot(playerId);

    return NextResponse.json(snapshot, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      console.error("Golf player API error:", error);
    }

    return NextResponse.json(
      {
        ...createEmptyGolfPlayerSnapshot(),
        error: err.message || "Unable to load golf player snapshot",
      },
      {
        status: err.status ?? 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
