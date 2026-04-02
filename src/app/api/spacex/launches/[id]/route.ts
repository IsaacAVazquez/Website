import { NextResponse } from "next/server";
import { getMissionLaunchDetail, isValidMissionLaunchId } from "@/lib/spacexData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidMissionLaunchId(id)) {
    return NextResponse.json({ error: "Invalid launch id" }, { status: 400 });
  }

  try {
    const launch = await getMissionLaunchDetail(id);

    return NextResponse.json(launch, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    if ((err.status ?? 500) >= 500) {
      console.error("SpaceX launch detail API error:", error);
    }

    return NextResponse.json(
      {
        error: err.message || "Unable to load launch detail",
      },
      { status: err.status ?? 500 }
    );
  }
}
