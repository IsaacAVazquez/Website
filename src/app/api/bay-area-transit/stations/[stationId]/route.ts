import { NextResponse } from "next/server";
import {
  createEmptyTransitStationBoard,
  getTransitStationBoard,
  isTransitStationIdShape,
  isValidTransitStationId,
} from "@/lib/bayAreaTransitSnapshot";
import { logger } from "@/lib/logger";

const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
};
// Errors (4xx/5xx) must NOT be cached by the CDN. Distinguishes 400 (bad input)
// from 404 (valid input, unknown id), matching the rest of the data surfaces.
const ERROR_CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stationId: string }> }
) {
  const { stationId } = await params;

  if (!isTransitStationIdShape(stationId)) {
    return NextResponse.json(
      {
        ...createEmptyTransitStationBoard(),
        error: "Invalid station id",
      },
      {
        status: 400,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  if (!isValidTransitStationId(stationId)) {
    return NextResponse.json(
      {
        ...createEmptyTransitStationBoard(),
        error: "Transit station board was not found.",
      },
      {
        status: 404,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  try {
    const board = await getTransitStationBoard(stationId);

    return NextResponse.json(board, {
      headers: SUCCESS_CACHE_HEADERS,
    });
  } catch (error) {
    const err = error as Error & { status?: number };

    if ((err.status ?? 500) >= 500) {
      logger.error("Transit station API error", error);
    }

    return NextResponse.json(
      {
        ...createEmptyTransitStationBoard(),
        error: err.message || "Unable to load transit station board",
      },
      {
        status: err.status ?? 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}
