import { NextRequest, NextResponse } from "next/server";
import {
  FantasyAllPositionsResponse,
  FANTASY_ROUTE_POSITIONS,
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
import { buildQueryCacheHeaders, NO_STORE_HEADERS } from "@/lib/apiCacheHeaders";

const SUCCESS_CACHE_HEADERS = buildQueryCacheHeaders(
  "public, max-age=3600, stale-while-revalidate=86400"
);

const VALID_SCORING_PARAMS = new Set([
  "ppr",
  "half",
  "halfppr",
  "half_ppr",
  "half-ppr",
  "std",
  "standard",
]);

function invalidQueryResponse(parameter: string) {
  return NextResponse.json(
    { success: false, error: `Invalid ${parameter} parameter` },
    { status: 400, headers: NO_STORE_HEADERS }
  );
}

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = fantasyRateLimiter.check(clientId);

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  const searchParams = request.nextUrl.searchParams;
  // Empty-string values (?scoring=) mean "not provided" — treat them like absent params.
  const rawScoring = searchParams.get("scoring") || null;
  const rawPosition = searchParams.get("position") || null;
  const rawAll = searchParams.get("all") || null;
  const normalizedScoring = rawScoring?.trim().toLowerCase();
  const normalizedPosition = rawPosition?.trim().toLowerCase();

  if (rawScoring !== null && !VALID_SCORING_PARAMS.has(normalizedScoring ?? "")) {
    return invalidQueryResponse("scoring");
  }

  if (
    rawPosition !== null &&
    !FANTASY_ROUTE_POSITIONS.includes(
      normalizedPosition as (typeof FANTASY_ROUTE_POSITIONS)[number]
    )
  ) {
    return invalidQueryResponse("position");
  }

  if (rawAll !== null && rawAll !== "true" && rawAll !== "false") {
    return invalidQueryResponse("all");
  }

  const scoring = normalizeFantasyRouteScoring(rawScoring);
  const position = normalizeFantasyRoutePosition(rawPosition);
  const getAllPositions = rawAll === "true";

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
          upstreamUpdatedAt: snapshot.upstreamUpdatedAt,
          scoringFormat: snapshot.scoringFormat,
          source: snapshot.source,
          position: "all",
          playerCount: snapshot.overall.length,
          slice: null,
          slices: snapshot.sliceMetadata,
        },
      };

      return NextResponse.json(response, { headers: SUCCESS_CACHE_HEADERS });
    }

    const players = getFantasyPlayersForPosition(snapshot, position);
    const response: FantasyPositionResponse = {
      success: true,
      players,
      metadata: {
        season: snapshot.season,
        week: snapshot.week,
        generatedAt: snapshot.generatedAt,
        upstreamUpdatedAt: snapshot.upstreamUpdatedAt,
        scoringFormat: routeScoringToScoringFormat(scoring),
        source: snapshot.source,
        position: position as FantasyRoutePosition,
        playerCount: players.length,
        slice: getFantasySliceMetadata(snapshot, position),
        slices: snapshot.sliceMetadata,
      },
    };

    return NextResponse.json(response, { headers: SUCCESS_CACHE_HEADERS });
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
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
