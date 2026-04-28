import { NextResponse } from "next/server";
import {
  createEmptyNbaTeamSnapshot,
  getNbaTeamSnapshot,
  isValidNbaTeamId,
} from "@/lib/nbaSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidNbaTeamId(teamId)) {
    return NextResponse.json(
      { ...createEmptyNbaTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getNbaTeamSnapshot(teamId);
    return NextResponse.json(snapshot, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("NBA team API error:", error);
    }
    return NextResponse.json(
      { ...createEmptyNbaTeamSnapshot(), error: err.message || "Unable to load NBA team snapshot" },
      { status: err.status ?? 500, headers: CACHE_HEADERS }
    );
  }
}
