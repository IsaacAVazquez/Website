import { NextResponse } from "next/server";
import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import {
  getScorePoolLeague,
  isScorePoolLeagueKeyShape,
  isValidScorePoolLeagueKey,
} from "@/lib/scorePoolsSnapshot";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!isScorePoolLeagueKeyShape(key)) {
    return NextResponse.json(
      { error: "Malformed league key." },
      { status: 400, headers: ERROR_CACHE_HEADERS },
    );
  }
  if (!isValidScorePoolLeagueKey(key)) {
    return NextResponse.json(
      { error: "Score-pool league was not found." },
      { status: 404, headers: ERROR_CACHE_HEADERS },
    );
  }
  try {
    const league = await getScorePoolLeague(key);
    const hasLiveData =
      !league.sample &&
      league.fixtures.some((fixture) =>
        fixture.odds.some((odds) => !odds.manual)
      );
    return NextResponse.json(league, {
      headers: createSnapshotResponseHeaders({
        surface: "score-pools",
        payload: league,
        sourceAsOf: league.generatedAt || scorePoolsSnapshot.generatedAt,
        cacheControl: "public, max-age=300, stale-while-revalidate=900",
        status: hasLiveData ? undefined : "degraded",
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      logger.error("Score-pools league API error", error);
    }
    return NextResponse.json(
      { error: err.message || "Unable to load the league snapshot" },
      { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS },
    );
  }
}
