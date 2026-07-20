import { NextResponse } from "next/server";
import {
  AI_DEV_TOOLS_GENERATED_AT,
  AI_DEV_TOOLS_VERIFIED,
  aiDevTools,
} from "@/app/ai-dev-tools/ai-dev-tools-data";
import {
  FOOD_MAP_AS_OF,
  FOOD_MAP_PLACES,
  FOOD_MAP_VERIFIED,
} from "@/app/food-map/food-map-data";
import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { formula1Snapshot } from "@/data/formula1Snapshot";
import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import { golfSnapshot } from "@/data/golfSnapshot";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import { mlbSnapshot } from "@/data/mlbSnapshot";
import { nbaSnapshot } from "@/data/nbaSnapshot";
import { nflSnapshot } from "@/data/nflSnapshot";
import { pollingSnapshot } from "@/data/pollingSnapshot";
import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import { techStartupSnapshot } from "@/data/techStartupSnapshot";
import {
  DEAL_TACTICS,
  DESTINATION_REGIONS,
  RECOMMENDED_TOOLS,
  TRAVEL_DEALS_AS_OF,
  TRAVEL_DEALS_VERIFIED,
} from "@/data/travelDealsSnapshot";
import {
  MUSEUM_SNAPSHOT_VERIFIED,
  museumSnapshot,
} from "@/data/museumSnapshot";
import { worldCupSnapshot } from "@/data/worldCupSnapshot";
import { getDataFreshnessPolicy, type DataSurfaceId } from "@/lib/dataFreshnessPolicy";
import {
  createDataLedgerRevision,
  createDataRevisionEntry,
} from "@/lib/dataRevision";
import { getSpaceXSnapshot } from "@/lib/spacexSnapshot";
import { hasLiveScorePoolsData } from "@/lib/scorePoolsSnapshot";
import fantasySnapshot from "../../../../public/data/fantasy/ppr.json";
import investmentsIndex from "../../../../public/data/investments/index.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const now = Date.now();
  const nowDate = new Date(now);
  const spacexSnapshot = getSpaceXSnapshot();
  const entry = (
    surface: DataSurfaceId,
    payload: unknown,
    sourceAsOf: string | null,
    status?: "degraded"
  ) => {
    const policy = getDataFreshnessPolicy(surface, nowDate);
    return createDataRevisionEntry({
      surface,
      payload,
      sourceAsOf,
      maxAgeMs: policy.maxAgeMs,
      source: policy.source,
      now,
      status,
    });
  };
  const entries = [
    entry("earthquake", earthquakeSnapshot.summary, earthquakeSnapshot.summary.generatedAt),
    entry(
      "bay-area-transit",
      bayAreaTransitSnapshot.summary,
      bayAreaTransitSnapshot.summary.system?.generatedAt ?? null
    ),
    entry("formula-1", formula1Snapshot, formula1Snapshot.generatedAt),
    entry("github-trending", githubTrendingSnapshot, githubTrendingSnapshot.generatedAt),
    entry("golf", golfSnapshot, golfSnapshot.summary.tournament?.generatedAt ?? null),
    entry(
      "investments",
      investmentsIndex,
      investmentsIndex.lastUpdated,
      investmentsIndex.entries.some(
        (item) => "stale" in item && item.stale === true
      )
        ? "degraded"
        : undefined
    ),
    entry("spacex", spacexSnapshot, spacexSnapshot.generatedAt),
    entry("world-cup", worldCupSnapshot, worldCupSnapshot.tournament.generatedAt),
    entry(
      "premier-league",
      premierLeagueSnapshot.summary,
      premierLeagueSnapshot.summary.generatedAt
    ),
    entry("la-liga", laLigaSnapshot, laLigaSnapshot.updatedAt),
    entry("mlb", mlbSnapshot, mlbSnapshot.updatedAt),
    entry("nba", nbaSnapshot, nbaSnapshot.updatedAt),
    entry("nfl", nflSnapshot, nflSnapshot.updatedAt),
    entry("fantasy-football", fantasySnapshot, fantasySnapshot.generatedAt),
    entry(
      "score-pools",
      scorePoolsSnapshot,
      scorePoolsSnapshot.generatedAt,
      hasLiveScorePoolsData(scorePoolsSnapshot) ? undefined : "degraded"
    ),
    entry(
      "frontier-models",
      frontierModelsSnapshot,
      frontierModelsSnapshot.asOf ?? frontierModelsSnapshot.generatedAt,
      frontierModelsSnapshot.verified === false ? "degraded" : undefined
    ),
    entry(
      "tech-startups",
      techStartupSnapshot,
      techStartupSnapshot.asOf ?? techStartupSnapshot.generatedAt,
      techStartupSnapshot.verified === false ? "degraded" : undefined
    ),
    entry(
      "ai-dev-tools",
      aiDevTools,
      AI_DEV_TOOLS_GENERATED_AT,
      AI_DEV_TOOLS_VERIFIED ? undefined : "degraded"
    ),
    entry(
      "museum-log",
      museumSnapshot,
      museumSnapshot.generatedAt,
      MUSEUM_SNAPSHOT_VERIFIED ? undefined : "degraded"
    ),
    entry(
      "travel-deals",
      { destinations: DESTINATION_REGIONS, tactics: DEAL_TACTICS, tools: RECOMMENDED_TOOLS },
      TRAVEL_DEALS_AS_OF,
      TRAVEL_DEALS_VERIFIED ? undefined : "degraded"
    ),
    entry(
      "food-map",
      FOOD_MAP_PLACES,
      FOOD_MAP_AS_OF,
      FOOD_MAP_VERIFIED ? undefined : "degraded"
    ),
    entry(
      "polling",
      pollingSnapshot,
      pollingSnapshot.sourceAsOf ?? pollingSnapshot.generatedAt
    ),
  ];

  return NextResponse.json(
    {
      checkedAt: new Date(now).toISOString(),
      revision: createDataLedgerRevision(entries),
      entries,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
