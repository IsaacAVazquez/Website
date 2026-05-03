import { NextResponse } from "next/server";
import {
  createEmptyGolfPlayerSnapshot,
  getGolfPlayerSnapshot,
  isGolfPlayerIdShape,
  isValidGolfPlayerId,
} from "@/lib/golfSnapshot";

const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};
// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// upstream failure or malformed input poisons the cache for the full success
// TTL. Distinguishes 400 (bad input) from 404 (valid input, unknown id).
// Previously this route returned 404 for malformed ids — corrected here so
// shape errors are 400, alignment with the rest of the sports surfaces.
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  if (!isGolfPlayerIdShape(playerId)) {
    return NextResponse.json(
      {
        ...createEmptyGolfPlayerSnapshot(),
        error: "Invalid player id",
      },
      {
        status: 400,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  if (!isValidGolfPlayerId(playerId)) {
    return NextResponse.json(
      {
        ...createEmptyGolfPlayerSnapshot(),
        error: "Golf player snapshot was not found.",
      },
      {
        status: 404,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  try {
    const snapshot = await getGolfPlayerSnapshot(playerId);

    return NextResponse.json(snapshot, {
      headers: SUCCESS_CACHE_HEADERS,
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
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
