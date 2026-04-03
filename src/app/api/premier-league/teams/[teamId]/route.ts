import { NextResponse } from "next/server";
import {
  createEmptyPremierLeagueTeamSnapshot,
  getPremierLeagueTeamSnapshot,
  isValidPremierLeagueTeamId,
} from "@/lib/premierLeagueData";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  if (!isValidPremierLeagueTeamId(teamId)) {
    return NextResponse.json(
      {
        ...createEmptyPremierLeagueTeamSnapshot(),
        error: "Invalid team id",
      },
      {
        status: 400,
        headers: CACHE_HEADERS,
      }
    );
  }

  try {
    const snapshot = await getPremierLeagueTeamSnapshot(teamId);

    return NextResponse.json(snapshot, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      console.error("Premier League team API error:", error);
    }

    return NextResponse.json(
      {
        ...createEmptyPremierLeagueTeamSnapshot(),
        error: err.message || "Unable to load Premier League team snapshot",
      },
      {
        status: err.status ?? 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
