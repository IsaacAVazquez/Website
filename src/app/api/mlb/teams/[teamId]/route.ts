import { NextResponse } from "next/server";
import {
  createEmptyMlbTeamSnapshot,
  getMlbTeamSnapshot,
  isValidMlbTeamId,
} from "@/lib/mlbSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidMlbTeamId(teamId)) {
    return NextResponse.json(
      { ...createEmptyMlbTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getMlbTeamSnapshot(teamId);
    return NextResponse.json(snapshot, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("MLB team API error:", error);
    }
    return NextResponse.json(
      { ...createEmptyMlbTeamSnapshot(), error: err.message || "Unable to load MLB team snapshot" },
      { status: err.status ?? 500, headers: CACHE_HEADERS }
    );
  }
}
