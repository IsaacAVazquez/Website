import { NextResponse } from "next/server";
import {
  createEmptyMlbTeamSnapshot,
  getMlbTeamSnapshot,
  isMlbTeamIdShape,
  isValidMlbTeamId,
} from "@/lib/mlbSnapshot";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

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

  if (!isMlbTeamIdShape(teamId)) {
    return NextResponse.json(
      { ...createEmptyMlbTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: ERROR_CACHE_HEADERS }
    );
  }

  if (!isValidMlbTeamId(teamId)) {
    return NextResponse.json(
      {
        ...createEmptyMlbTeamSnapshot(),
        error: "MLB team snapshot was not found.",
      },
      { status: 404, headers: ERROR_CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getMlbTeamSnapshot(teamId);
    return NextResponse.json(snapshot, {
      headers: createSnapshotResponseHeaders({
        surface: "mlb",
        payload: snapshot,
        sourceAsOf: snapshot.generatedAt,
        cacheControl: "public, max-age=300, stale-while-revalidate=900",
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      logger.error("MLB team API error", error);
    }
    return NextResponse.json(
      { ...createEmptyMlbTeamSnapshot(), error: err.message || "Unable to load MLB team snapshot" },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS }
    );
  }
}
