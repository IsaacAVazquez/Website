import { appendFile, writeFile } from "node:fs/promises";

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
import { MARCH_MADNESS_UPDATED_AT } from "../src/app/march-madness-2026/march-madness-data";
import { getMuseumExhibitStatus } from "../src/app/museum-log/museum-log-helpers";
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
import { getDataFreshnessPolicy } from "../src/lib/dataFreshnessPolicy";
import { createAssumptionsMeta } from "../src/lib/rentVsBuy/defaults";
import { CMA_AS_OF, CMA_VERIFIED } from "../src/lib/retirement/capitalMarketAssumptions";
import type { Museum } from "../src/types/museum";

const DAY_MS = 86_400_000;
// The capital market assumptions and the tax constants have no entry in
// dataFreshnessPolicy. One edition of the assumptions comes out a year and the
// tax constants change with the tax year, so both get a year plus a month.
const ANNUAL_EDITION_DAYS = 400;

interface CuratedDataset {
  surface: string;
  asOf: string;
  /** null when the dataset carries no verified flag. */
  verified: boolean | null;
  /** null for a finished event, which is archived and never goes overdue. */
  maxAgeDays: number | null;
  issues: string[];
}

export interface CuratedAuditResult extends CuratedDataset {
  ageDays: number | null;
  status: string;
  needsReview: boolean;
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

/**
 * Exhibitions the catalog showed as running or upcoming on its as-of date that
 * have closed since, so the catalog still presents them as current.
 */
export function closedExhibitions(
  snapshot: { generatedAt: string; museums: Array<Pick<Museum, "id" | "exhibits">> },
  now: Date
): string[] {
  const asOf = snapshot.generatedAt.slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  return snapshot.museums.flatMap((museum) =>
    museum.exhibits
      .filter(
        (exhibit) =>
          getMuseumExhibitStatus(exhibit, asOf) !== "ended" &&
          getMuseumExhibitStatus(exhibit, today) === "ended"
      )
      .map((exhibit) => `${museum.id}/${exhibit.id} (closed ${exhibit.endDate})`)
  );
}

function museumIssues(now: Date): string[] {
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
  const closed = closedExhibitions(museumSnapshot, now);
  if (closed.length > 0) {
    issues.push(`exhibitions that closed after the as-of date: ${closed.join(", ")}`);
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

export function evaluateCuratedDataset(dataset: CuratedDataset, now: Date): CuratedAuditResult {
  const sourceTime = Date.parse(dataset.asOf);
  const ageDays = Number.isFinite(sourceTime)
    ? Math.floor(Math.max(0, now.getTime() - sourceTime) / DAY_MS)
    : null;
  const issues =
    ageDays === null
      ? [...dataset.issues, `as-of date "${dataset.asOf}" is not a date`]
      : dataset.issues;
  const failures = [
    ...(ageDays !== null && dataset.maxAgeDays !== null && ageDays > dataset.maxAgeDays
      ? ["overdue"]
      : []),
    ...(issues.length > 0 ? ["invalid"] : []),
  ];
  return {
    ...dataset,
    issues,
    ageDays,
    status: failures.join(", ") || (dataset.maxAgeDays === null ? "archived" : "ok"),
    needsReview: failures.length > 0,
  };
}

export function auditCuratedDatasets(now = new Date()): CuratedAuditResult[] {
  const taxConstants = createAssumptionsMeta("single");
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
      issues: museumIssues(now),
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
  ].map((dataset) => ({
    ...dataset,
    maxAgeDays: Math.floor(getDataFreshnessPolicy(dataset.surface, now).maxAgeMs / DAY_MS),
  }));

  const outsidePolicy: CuratedDataset[] = [
    {
      surface: "capital-market-assumptions",
      asOf: CMA_AS_OF,
      verified: CMA_VERIFIED,
      maxAgeDays: ANNUAL_EDITION_DAYS,
      issues: [],
    },
    {
      surface: "rent-vs-buy-tax-constants",
      asOf: taxConstants.asOf,
      verified: taxConstants.verified,
      maxAgeDays: ANNUAL_EDITION_DAYS,
      issues: [],
    },
    {
      // The tournament ended on 2026-04-06, so the page records a finished event.
      surface: "march-madness-2026",
      asOf: MARCH_MADNESS_UPDATED_AT,
      verified: null,
      maxAgeDays: null,
      issues: [],
    },
  ];

  return [...datasets, ...outsidePolicy].map((dataset) => evaluateCuratedDataset(dataset, now));
}

/** Markdown, so the same text reads in a terminal, a step summary, and an issue comment. */
export function formatAuditReport(results: CuratedAuditResult[], now: Date): string {
  const rows = results.map((result) =>
    [
      "",
      result.surface,
      result.ageDays === null ? result.asOf : result.asOf.slice(0, 10),
      result.ageDays ?? "unknown",
      result.maxAgeDays ?? "none",
      result.status,
      result.verified === null ? "not tracked" : result.verified ? "yes" : "no",
      "",
    ]
      .join(" | ")
      .trim()
  );
  const issues = results.flatMap((result) =>
    result.issues.map((issue) => `- ${result.surface}: ${issue}`)
  );
  const failing = results.filter((result) => result.needsReview).map((result) => result.surface);
  return [
    `## Curated data review, ${now.toISOString().slice(0, 10)}`,
    "",
    "| Dataset | As of | Age in days | Window in days | Status | Verified |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    ...(issues.length > 0 ? ["### Issues", "", ...issues, ""] : []),
    `Review needed for ${failing.length} of ${results.length}${
      failing.length > 0 ? `: ${failing.join(", ")}` : ""
    }. A dataset fails on age or structure, and the Verified column is a label that never fails it.`,
  ].join("\n");
}

async function main() {
  const now = new Date();
  const results = auditCuratedDatasets(now);
  const report = formatAuditReport(results, now);
  console.log(report);
  // The workflow posts this file on the review issue, so it holds the report and nothing else.
  const markdownPath = process.argv
    .find((arg) => arg.startsWith("--markdown="))
    ?.slice("--markdown=".length);
  if (markdownPath) await writeFile(markdownPath, `${report}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  }
  if (results.some((result) => result.needsReview)) process.exitCode = 1;
}

if (process.argv[1]?.endsWith("auditCuratedData.ts")) {
  void main();
}
