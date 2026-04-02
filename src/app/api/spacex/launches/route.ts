import { NextRequest, NextResponse } from "next/server";
import type { MissionControlStatus } from "@/types/spacex";
import { getMissionLaunchCards } from "@/lib/spacexData";

function isValidStatus(status: string): status is MissionControlStatus {
  return status === "upcoming" || status === "past";
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? "upcoming";
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  if (!isValidStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (limitParam && (!Number.isFinite(limit) || (limit ?? 0) < 1)) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  try {
    const launches = await getMissionLaunchCards(status, limit);

    return NextResponse.json(
      {
        launches,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    const err = error as Error & { status?: number };
    console.error("SpaceX launches API error:", error);

    return NextResponse.json(
      {
        launches: [],
        error: err.message || "Unable to load launches",
      },
      { status: err.status ?? 500 }
    );
  }
}
