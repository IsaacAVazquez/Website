import { NextResponse } from "next/server";
import {
  createEmptyLaLigaTeamSnapshot,
  getLaLigaTeamSnapshot,
  isLaLigaTeamIdShape,
  isValidLaLigaTeamId,
} from "@/lib/laLigaSnapshot";

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

  if (!isLaLigaTeamIdShape(teamId)) {
    return NextResponse.json(
      { ...createEmptyLaLigaTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: ERROR_CACHE_HEADERS }
    );
  }

  if (!isValidLaLigaTeamId(teamId)) {
    return NextResponse.json(
      {
        ...createEmptyLaLigaTeamSnapshot(),
        error: "La Liga team snapshot was not found.",
      },
      { status: 404, headers: ERROR_CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getLaLigaTeamSnapshot(teamId);
    return NextResponse.json(snapshot, { headers: SUCCESS_CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("La Liga team API error:", error);
    }
    return NextResponse.json(
      { ...createEmptyLaLigaTeamSnapshot(), error: err.message || "Unable to load La Liga team snapshot" },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS }
    );
  }
}
