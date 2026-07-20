import { NextResponse } from "next/server";
import {
  createEmptyFormula1Meeting,
  getFormula1Meeting,
  getFormula1Summary,
  isFormula1MeetingKeyShape,
  isValidFormula1MeetingKey,
} from "@/lib/formula1Snapshot";
import { logger } from "@/lib/logger";
import { createSnapshotResponseHeaders } from "@/lib/snapshotResponse";

// Errors (4xx/5xx) must NOT be cached by the CDN — otherwise a transient
// upstream failure or malformed input poisons the cache for the full success
// TTL. Distinguishes 400 (bad input) from 404 (valid input, unknown key).
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { meetingId } = await params;

  if (!isFormula1MeetingKeyShape(meetingId)) {
    return NextResponse.json(
      {
        ...createEmptyFormula1Meeting(),
        error: "Invalid meeting id",
      },
      {
        status: 400,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  if (!isValidFormula1MeetingKey(meetingId)) {
    return NextResponse.json(
      {
        ...createEmptyFormula1Meeting(),
        error: "Formula 1 meeting snapshot was not found.",
      },
      {
        status: 404,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  try {
    const meeting = await getFormula1Meeting(meetingId);
    // Meetings carry no timestamp of their own; the snapshot's generatedAt is
    // the freshness stamp for every meeting in it.
    const { generatedAt } = await getFormula1Summary();

    return NextResponse.json(meeting, {
      headers: createSnapshotResponseHeaders({
        surface: "formula-1",
        payload: meeting,
        sourceAsOf: generatedAt,
        cacheControl: "public, max-age=300, stale-while-revalidate=900",
      }),
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      logger.error("Formula 1 meeting API error", error);
    }

    return NextResponse.json(
      {
        ...createEmptyFormula1Meeting(),
        error: err.message || "Unable to load the Formula 1 meeting snapshot",
      },
      {
        status: err.status ?? 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
