import {
  AI_DEV_TOOLS_GENERATED_AT,
  AI_DEV_TOOLS_VERIFIED,
  aiDevTools,
} from "../src/app/ai-dev-tools/ai-dev-tools-data";
import {
  FOOD_MAP_AS_OF,
  FOOD_MAP_CITY_IDS,
  FOOD_MAP_CUISINE_IDS,
  FOOD_MAP_CURATOR_IDS,
  FOOD_MAP_PLACES,
  FOOD_MAP_VERIFIED,
} from "../src/app/food-map/food-map-data";
import { frontierModelsSnapshot } from "../src/data/frontierModelsSnapshot";
import {
  MUSEUM_SNAPSHOT_VERIFIED,
  museumSnapshot,
} from "../src/data/museumSnapshot";
import { techStartupSnapshot } from "../src/data/techStartupSnapshot";
import {
  DEAL_TACTICS,
  DESTINATION_REGIONS,
  RECOMMENDED_TOOLS,
  TRAVEL_DEALS_AS_OF,
  TRAVEL_DEALS_VERIFIED,
} from "../src/data/travelDealsSnapshot";
import { getDataFreshnessPolicy, type DataSurfaceId } from "../src/lib/dataFreshnessPolicy";

export interface CuratedAuditResult {
  surface: DataSurfaceId;
  asOf: string;
  verified: boolean;
  ageDays: number | null;
  maxAgeDays: number;
  needsReview: boolean;
  issues: string[];
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function aiDevToolIssues(): string[] {
  const issues: string[] = [];
  const duplicates = duplicateValues(aiDevTools.map((tool) => tool.id));
  if (aiDevTools.length === 0) issues.push("no tools");
  if (duplicates.length > 0) issues.push(`duplicate tool ids: ${duplicates.join(", ")}`);
  const missingSources = aiDevTools
    .filter(
      (tool) =>
        tool.sourceUrls.length === 0 ||
        tool.sourceUrls.some((source) => {
          try {
            return new URL(source.url).protocol !== "https:";
          } catch {
            return true;
          }
        })
    )
    .map((tool) => tool.id);
  if (missingSources.length > 0) {
    issues.push(`missing or invalid source URLs: ${missingSources.join(", ")}`);
  }
  return issues;
}

function museumIssues(): string[] {
  const issues: string[] = [];
  const duplicateIds = duplicateValues(museumSnapshot.museums.map((museum) => museum.id));
  const duplicateSlugs = duplicateValues(museumSnapshot.museums.map((museum) => museum.slug));
  if (museumSnapshot.museums.length === 0) issues.push("no museums");
  if (duplicateIds.length > 0) issues.push(`duplicate museum ids: ${duplicateIds.join(", ")}`);
  if (duplicateSlugs.length > 0) issues.push(`duplicate museum slugs: ${duplicateSlugs.join(", ")}`);
  const invalidExhibitions = museumSnapshot.museums.flatMap((museum) =>
    museum.exhibits
      .filter((exhibit) => {
        const start = Date.parse(exhibit.startDate);
        const end = exhibit.endDate ? Date.parse(exhibit.endDate) : null;
        return (
          !Number.isFinite(start) ||
          (end !== null && (!Number.isFinite(end) || start > end))
        );
      })
      .map((exhibit) => `${museum.id}/${exhibit.id}`)
  );
  if (invalidExhibitions.length > 0) {
    issues.push(`invalid exhibition dates: ${invalidExhibitions.join(", ")}`);
  }
  return issues;
}

function travelDealIssues(): string[] {
  const issues: string[] = [];
  const duplicateRegions = duplicateValues(DESTINATION_REGIONS.map((region) => region.id));
  const duplicateTactics = duplicateValues(DEAL_TACTICS.map((tactic) => tactic.id));
  const duplicateTools = duplicateValues(RECOMMENDED_TOOLS.map((tool) => tool.id));
  if (duplicateRegions.length > 0) issues.push(`duplicate region ids: ${duplicateRegions.join(", ")}`);
  if (duplicateTactics.length > 0) issues.push(`duplicate tactic ids: ${duplicateTactics.join(", ")}`);
  if (duplicateTools.length > 0) issues.push(`duplicate tool ids: ${duplicateTools.join(", ")}`);
  const invalidBands = DESTINATION_REGIONS
    .filter(
      (region) =>
        region.typicalFareLow > region.typicalFare ||
        region.typicalFare > region.typicalFareHigh ||
        region.sweetSpotMinDays > region.sweetSpotMaxDays ||
        region.sweetSpotMaxDays > region.bookWindowOpenDays
    )
    .map((region) => region.id);
  if (invalidBands.length > 0) issues.push(`invalid fare bands: ${invalidBands.join(", ")}`);
  return issues;
}

function foodMapIssues(): string[] {
  const issues: string[] = [];
  const duplicateIds = duplicateValues(FOOD_MAP_PLACES.map((place) => place.id));
  if (FOOD_MAP_PLACES.length === 0) issues.push("no places");
  if (duplicateIds.length > 0) issues.push(`duplicate place ids: ${duplicateIds.join(", ")}`);
  const cityIds = new Set<string>(FOOD_MAP_CITY_IDS);
  const cuisineIds = new Set<string>(FOOD_MAP_CUISINE_IDS);
  const curatorIds = new Set<string>(FOOD_MAP_CURATOR_IDS);
  const invalidPlaces = FOOD_MAP_PLACES
    .filter(
      (place) =>
        !cityIds.has(place.city) ||
        !cuisineIds.has(place.cuisine) ||
        place.curators.length === 0 ||
        place.curators.some((curator) => !curatorIds.has(curator)) ||
        !Number.isFinite(place.coords[0]) ||
        !Number.isFinite(place.coords[1]) ||
        Math.abs(place.coords[0]) > 90 ||
        Math.abs(place.coords[1]) > 180
    )
    .map((place) => place.id);
  if (invalidPlaces.length > 0) issues.push(`invalid places: ${invalidPlaces.join(", ")}`);
  return issues;
}

export function auditCuratedDatasets(now = new Date()): CuratedAuditResult[] {
  const datasets = [
    {
      surface: "frontier-models" as const,
      asOf: frontierModelsSnapshot.asOf ?? frontierModelsSnapshot.generatedAt,
      verified: frontierModelsSnapshot.verified !== false,
      issues: [] as string[],
    },
    {
      surface: "tech-startups" as const,
      asOf: techStartupSnapshot.asOf ?? techStartupSnapshot.generatedAt,
      verified: techStartupSnapshot.verified !== false,
      issues: [] as string[],
    },
    {
      surface: "ai-dev-tools" as const,
      asOf: AI_DEV_TOOLS_GENERATED_AT,
      verified: AI_DEV_TOOLS_VERIFIED,
      issues: aiDevToolIssues(),
    },
    {
      surface: "museum-log" as const,
      asOf: museumSnapshot.generatedAt,
      verified: MUSEUM_SNAPSHOT_VERIFIED,
      issues: museumIssues(),
    },
    {
      surface: "travel-deals" as const,
      asOf: TRAVEL_DEALS_AS_OF,
      verified: TRAVEL_DEALS_VERIFIED,
      issues: travelDealIssues(),
    },
    {
      surface: "food-map" as const,
      asOf: FOOD_MAP_AS_OF,
      verified: FOOD_MAP_VERIFIED,
      issues: foodMapIssues(),
    },
  ];

  return datasets.map((dataset) => {
    const policy = getDataFreshnessPolicy(dataset.surface, now);
    const sourceTime = Date.parse(dataset.asOf);
    const ageMs = Number.isFinite(sourceTime) ? now.getTime() - sourceTime : Number.NaN;
    return {
      ...dataset,
      ageDays: Number.isFinite(ageMs) ? Math.floor(Math.max(0, ageMs) / 86_400_000) : null,
      maxAgeDays: Math.floor(policy.maxAgeMs / 86_400_000),
      needsReview:
        !dataset.verified ||
        !Number.isFinite(ageMs) ||
        ageMs > policy.maxAgeMs ||
        dataset.issues.length > 0,
    };
  });
}

async function main() {
  const results = auditCuratedDatasets();
  const summary = results
    .map(
      (result) =>
        `- ${result.surface}: as of ${result.asOf}, ${result.ageDays ?? "unknown"} days old, verified=${result.verified}, issues=${result.issues.length > 0 ? result.issues.join("; ") : "none"}`
    )
    .join("\n");
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Curated data review\n\n${summary}\n`);
  }
  if (results.some((result) => result.needsReview)) process.exit(1);
}

if (process.argv[1]?.endsWith("auditCuratedData.ts")) {
  void main();
}
