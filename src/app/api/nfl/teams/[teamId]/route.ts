import { NextResponse } from "next/server";
import {
  createEmptyNflTeamSnapshot,
  getNflTeamSnapshot,
  isNflTeamIdShape,
  isValidNflTeamId,
} from "@/lib/nflSnapshot";
import { logger } from "@/lib/logger";

const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};
// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// upstream failure or malformed input poisons the cache for the full success
// TTL. Distinguishes 400 (bad input) from 404 (valid input, unknown id).
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isNflTeamIdShape(teamId)) {
    return NextResponse.json(
      { ...createEmptyNflTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: ERROR_CACHE_HEADERS }
    );
  }

  if (!isValidNflTeamId(teamId)) {
    return NextResponse.json(
      {
        ...createEmptyNflTeamSnapshot(),
        error: "NFL team snapshot was not found.",
      },
      { status: 404, headers: ERROR_CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getNflTeamSnapshot(teamId);
    return NextResponse.json(snapshot, { headers: SUCCESS_CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      logger.error("NFL team API error", error);
    }
    return NextResponse.json(
      {
        ...createEmptyNflTeamSnapshot(),
        error: err.message || "Unable to load NFL team snapshot",
      },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS }
    );
  }
}
