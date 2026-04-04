import { NextResponse } from "next/server";
import {
  createEmptyLaLigaTeamSnapshot,
  getLaLigaTeamSnapshot,
  isValidLaLigaTeamId,
} from "@/lib/laLigaSnapshot";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidLaLigaTeamId(teamId)) {
    return NextResponse.json(
      { ...createEmptyLaLigaTeamSnapshot(), error: "Invalid team id" },
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  try {
    const snapshot = await getLaLigaTeamSnapshot(teamId);
    return NextResponse.json(snapshot, { headers: CACHE_HEADERS });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("La Liga team API error:", error);
    }
    return NextResponse.json(
      { ...createEmptyLaLigaTeamSnapshot(), error: err.message || "Unable to load La Liga team snapshot" },
      { status: err.status ?? 500, headers: CACHE_HEADERS }
    );
  }
}
