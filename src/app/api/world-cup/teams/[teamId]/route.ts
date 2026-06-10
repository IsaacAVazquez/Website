import { NextResponse } from "next/server";
import {
  createEmptyWorldCupTeamSnapshot,
  getWorldCupTeamSnapshot,
  isValidWorldCupTeamId,
  isWorldCupTeamIdShape,
} from "@/lib/worldCupSnapshot";
import { logger } from "@/lib/logger";

const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};
// Errors (4xx/5xx) must NOT be cached by the CDN. Distinguishes 400 (bad input)
// from 404 (valid input, unknown id).
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isWorldCupTeamIdShape(teamId)) {
    return NextResponse.json(
      { ...createEmptyWorldCupTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: ERROR_CACHE_HEADERS }
    );
  }

  if (!isValidWorldCupTeamId(teamId)) {
    return NextResponse.json(
      {
        ...createEmptyWorldCupTeamSnapshot(),
        error: "World Cup team snapshot was not found.",
      },
      { status: 404, headers: ERROR_CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getWorldCupTeamSnapshot(teamId);
    return NextResponse.json(snapshot, { headers: SUCCESS_CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      logger.error("World Cup team API error", error);
    }
    return NextResponse.json(
      {
        ...createEmptyWorldCupTeamSnapshot(),
        error: err.message || "Unable to load World Cup team snapshot",
      },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS }
    );
  }
}
