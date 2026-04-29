import { NextResponse } from "next/server";
import {
  createEmptyNflTeamSnapshot,
  getNflTeamSnapshot,
  isValidNflTeamId,
} from "@/lib/nflSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidNflTeamId(teamId)) {
    return NextResponse.json(
      { ...createEmptyNflTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getNflTeamSnapshot(teamId);
    return NextResponse.json(snapshot, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("NFL team API error:", error);
    }
    return NextResponse.json(
      {
        ...createEmptyNflTeamSnapshot(),
        error: err.message || "Unable to load NFL team snapshot",
      },
      { status: err.status ?? 500, headers: CACHE_HEADERS }
    );
  }
}
