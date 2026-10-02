import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";
import type { DataSurfaceId } from "@/lib/dataFreshnessPolicy";

// Errors (4xx/5xx) must NOT be cached by the CDN. Otherwise a transient
// upstream failure or malformed input poisons the cache for the full success
// TTL. Distinguishes 400 (bad input) from 404 (valid input, unknown id).
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

interface TeamRouteOptions<T extends { generatedAt: string }> {
  surface: DataSurfaceId;
  /** Display name for error text, e.g. "NBA" or "Premier League". */
  label: string;
  /** Shape check first, so a malformed id is a 400 and never touches the snapshot dictionary. */
  isIdShape: (teamId: string) => boolean;
  /** Membership check, so a well-formed unknown id is a 404. */
  isValidId: (teamId: string) => boolean;
  getTeamSnapshot: (teamId: string) => Promise<T>;
  createEmpty: () => object;
}

/** GET handler for the `/api/<surface>/teams/[teamId]` routes, which all share one shape. */
export function createTeamRouteHandler<T extends { generatedAt: string }>({
  surface,
  label,
  isIdShape,
  isValidId,
  getTeamSnapshot,
  createEmpty,
}: TeamRouteOptions<T>) {
  return async function GET(
    _request: Request,
    { params }: { params: Promise<{ teamId: string }> }
  ) {
    const { teamId } = await params;

    if (!isIdShape(teamId)) {
      return NextResponse.json(
        { ...createEmpty(), error: "Invalid team id" },
        { status: 400, headers: ERROR_CACHE_HEADERS }
      );
    }

    if (!isValidId(teamId)) {
      return NextResponse.json(
        { ...createEmpty(), error: `${label} team snapshot was not found.` },
        { status: 404, headers: ERROR_CACHE_HEADERS }
      );
    }

    try {
      const snapshot = await getTeamSnapshot(teamId);
      return NextResponse.json(snapshot, {
        headers: createSnapshotResponseHeaders({
          surface,
          payload: snapshot,
          sourceAsOf: snapshot.generatedAt,
          cacheControl: "public, max-age=300, stale-while-revalidate=900",
        }),
      });
    } catch (error) {
      const err = error as Error & { status?: number };
      if ((err.status ?? 500) >= 500) {
        logger.error(`${label} team API error`, error);
      }
      return NextResponse.json(
        { ...createEmpty(), error: err.message || `Unable to load ${label} team snapshot` },
        { status: err.status ?? 500, headers: ERROR_CACHE_HEADERS }
      );
    }
  };
}
