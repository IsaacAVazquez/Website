import { NextResponse } from "next/server";
import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { formula1Snapshot } from "@/data/formula1Snapshot";
import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import { golfSnapshot } from "@/data/golfSnapshot";
import { worldCupSnapshot } from "@/data/worldCupSnapshot";
import { createDataRevisionEntry } from "@/lib/dataRevision";
import { getSpaceXSnapshot } from "@/lib/spacexSnapshot";
import investmentsIndex from "../../../../public/data/investments/index.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HOUR_MS = 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  const spacexSnapshot = getSpaceXSnapshot();
  const entries = [
    createDataRevisionEntry({
      surface: "earthquake",
      payload: earthquakeSnapshot.summary,
      sourceAsOf: earthquakeSnapshot.summary.generatedAt,
      maxAgeMs: 2 * HOUR_MS,
      now,
    }),
    createDataRevisionEntry({
      surface: "bay-area-transit",
      // Summary grain, matching /api/bay-area-transit/summary's X-Data-Revision.
      payload: bayAreaTransitSnapshot.summary,
      sourceAsOf: bayAreaTransitSnapshot.summary.system?.generatedAt ?? null,
      maxAgeMs: 8 * HOUR_MS,
      now,
    }),
    createDataRevisionEntry({
      surface: "formula-1",
      payload: formula1Snapshot,
      sourceAsOf: formula1Snapshot.generatedAt,
      maxAgeMs: 48 * HOUR_MS,
      now,
    }),
    createDataRevisionEntry({
      surface: "github-trending",
      payload: githubTrendingSnapshot,
      sourceAsOf: githubTrendingSnapshot.generatedAt,
      maxAgeMs: 36 * HOUR_MS,
      now,
    }),
    createDataRevisionEntry({
      surface: "golf",
      payload: golfSnapshot,
      sourceAsOf: golfSnapshot.summary.tournament?.generatedAt ?? null,
      maxAgeMs: 36 * HOUR_MS,
      now,
    }),
    createDataRevisionEntry({
      surface: "investments",
      payload: investmentsIndex,
      sourceAsOf: investmentsIndex.lastUpdated,
      // The refresh runs Mon+Thu 22:15 UTC; the Thu -> Mon gap is exactly 96h,
      // so a 120h window keeps an on-cadence snapshot from reading stale.
      maxAgeMs: 5 * 24 * HOUR_MS,
      now,
      status:
        investmentsIndex.entries.some(
          (entry) => "stale" in entry && entry.stale === true
        )
          ? "degraded"
          : undefined,
    }),
    createDataRevisionEntry({
      surface: "spacex",
      payload: spacexSnapshot,
      sourceAsOf: spacexSnapshot.generatedAt,
      maxAgeMs: 36 * HOUR_MS,
      now,
    }),
    createDataRevisionEntry({
      surface: "world-cup",
      payload: worldCupSnapshot,
      sourceAsOf: worldCupSnapshot.tournament.generatedAt,
      maxAgeMs: 8 * HOUR_MS,
      now,
    }),
  ];

  return NextResponse.json(
    {
      checkedAt: new Date(now).toISOString(),
      entries,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
