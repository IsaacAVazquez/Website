import { NextRequest, NextResponse } from "next/server";
import {
  FantasyAllPositionsResponse,
  FantasyPositionResponse,
  FantasyRoutePosition,
  getFantasySliceMetadata,
  getFantasyPlayersForPosition,
  normalizeFantasyRoutePosition,
  normalizeFantasyRouteScoring,
  routeScoringToScoringFormat,
} from "@/lib/fantasy";
import { loadFantasySnapshot } from "@/lib/fantasySnapshotServer";
import { fantasyRateLimiter, getClientIdentifier, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

function buildHeaders() {
  return {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  };
}

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = fantasyRateLimiter.check(clientId);

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  const searchParams = request.nextUrl.searchParams;
  const scoring = normalizeFantasyRouteScoring(searchParams.get("scoring"));
  const position = normalizeFantasyRoutePosition(searchParams.get("position"));
  const getAllPositions = searchParams.get("all") === "true";

  try {
    const snapshot = await loadFantasySnapshot(scoring);

    if (getAllPositions) {
      const response: FantasyAllPositionsResponse = {
        success: true,
        data: snapshot,
        metadata: {
          season: snapshot.season,
          week: snapshot.week,
        generatedAt: snapshot.generatedAt,
        scoringFormat: snapshot.scoringFormat,
        source: snapshot.source,
        position: "all",
        playerCount: snapshot.overall.length,
        slice: null,
        slices: snapshot.sliceMetadata,
      },
    };

      return NextResponse.json(response, { headers: buildHeaders() });
    }

    const players = getFantasyPlayersForPosition(snapshot, position);
    const response: FantasyPositionResponse = {
      success: true,
      players,
      metadata: {
        season: snapshot.season,
        week: snapshot.week,
        generatedAt: snapshot.generatedAt,
        scoringFormat: routeScoringToScoringFormat(scoring),
        source: snapshot.source,
        position: position as FantasyRoutePosition,
        playerCount: players.length,
        slice: getFantasySliceMetadata(snapshot, position),
        slices: snapshot.sliceMetadata,
      },
    };

    return NextResponse.json(response, { headers: buildHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fantasy snapshot error";
    logger.error(`Fantasy snapshot read failed: ${message}`);

    return NextResponse.json(
      {
        success: false,
        error: message,
        metadata: {
          position,
          scoringFormat: routeScoringToScoringFormat(scoring),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
