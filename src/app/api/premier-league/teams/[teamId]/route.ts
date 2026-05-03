import { NextResponse } from "next/server";
import {
  createEmptyPremierLeagueTeamSnapshot,
  getPremierLeagueTeamSnapshot,
  isPremierLeagueTeamIdShape,
  isValidPremierLeagueTeamId,
} from "@/lib/premierLeagueSnapshot";

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

  // Defense-in-depth: regex shape check first, return 400 for malformed ids
  // so we never look them up against the snapshot dictionary.
  if (!isPremierLeagueTeamIdShape(teamId)) {
    return NextResponse.json(
      {
        ...createEmptyPremierLeagueTeamSnapshot(),
        error: "Invalid team id",
      },
      {
        status: 400,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  // Valid shape but not in our snapshot — that's a 404, not a 400.
  if (!isValidPremierLeagueTeamId(teamId)) {
    return NextResponse.json(
      {
        ...createEmptyPremierLeagueTeamSnapshot(),
        error: "Premier League team snapshot was not found.",
      },
      {
        status: 404,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  try {
    const snapshot = await getPremierLeagueTeamSnapshot(teamId);

    return NextResponse.json(snapshot, {
      headers: SUCCESS_CACHE_HEADERS,
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
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
