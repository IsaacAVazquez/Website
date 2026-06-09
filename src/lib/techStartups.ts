import type {
  TechStartup,
  TechStartupRound,
  TechStartupSegment,
  TechStartupSegmentKind,
  TechStartupSnapshot,
  TechStartupSortKey,
} from "@/types/techStartup";

/**
 * Curated seed entry. The build script hands these to {@link buildTechStartupSnapshot},
 * which derives momentum scores, sector/stage segments, and snapshot totals.
 */
export interface TechStartupSeedEntry {
  id: string;
  name: string;
  description: string;
  sector: { key: string; label: string };
  stage: { key: string; label: string };
  headquarters: string;
  country: string;
  founded: number;
  website: string;
  totalRaised: number;
  valuation: number | null;
  employees: string;
  lastRound: TechStartupRound;
  notableInvestors: string[];
  tags: string[];
}

export interface BuildTechStartupSnapshotInput {
  entries: TechStartupSeedEntry[];
  generatedAt: string;
  asOf: string;
  verified: boolean;
  sourceLabel: string;
  sourceUrl: string;
  disclaimer: string;
  currency?: string;
}

const UNICORN_THRESHOLD = 1_000_000_000;

/** Whole months between an as-of date and a YYYY-MM round date (never negative). */
function monthsSince(asOf: string, roundDate: string): number {
  const asOfDate = new Date(`${asOf.slice(0, 7)}-01T00:00:00Z`);
  const round = new Date(`${roundDate.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(asOfDate.getTime()) || Number.isNaN(round.getTime())) {
    return 0;
  }
  const months =
    (asOfDate.getUTCFullYear() - round.getUTCFullYear()) * 12 +
    (asOfDate.getUTCMonth() - round.getUTCMonth());
  return Math.max(0, months);
}

/**
 * Composite momentum score. Rewards recent rounds, larger latest raises, and
 * higher valuations so the "Momentum" sort surfaces companies that are actively
 * moving rather than simply the largest by headline figure.
 */
export function calculateMomentumScore(
  entry: Pick<TechStartupSeedEntry, "totalRaised" | "valuation" | "lastRound">,
  asOf: string
): number {
  const monthsAgo = monthsSince(asOf, entry.lastRound.date);
  const recencyScale = Math.max(0, 24 - monthsAgo) * 2.5;
  const roundScale = Math.log10(entry.lastRound.amount + 1) * 3;
  const valuationScale =
    Math.log10((entry.valuation ?? entry.totalRaised) + 1) * 1.5;
  return Math.round((recencyScale + roundScale + valuationScale) * 10) / 10;
}

function buildSegments(
  startups: TechStartup[],
  kind: TechStartupSegmentKind,
  labels: Map<string, string>,
  keyOrder: string[]
): TechStartupSegment[] {
  return keyOrder.map((key) => {
    const members = startups.filter((startup) =>
      kind === "sector" ? startup.sector === key : startup.stage === key
    );
    const topStartup = members.reduce<TechStartup | null>((best, candidate) => {
      if (!best || candidate.momentumScore > best.momentumScore) {
        return candidate;
      }
      return best;
    }, null);

    return {
      key,
      label: labels.get(key) ?? key,
      kind,
      startupIds: members.map((startup) => startup.id),
      startupCount: members.length,
      totalRaised: members.reduce((sum, startup) => sum + startup.totalRaised, 0),
      totalValuation: members.reduce(
        (sum, startup) => sum + (startup.valuation ?? 0),
        0
      ),
      topStartupId: topStartup?.id ?? null,
    };
  });
}

export function buildTechStartupSnapshot(
  input: BuildTechStartupSnapshotInput
): TechStartupSnapshot {
  const sectorLabels = new Map<string, string>();
  const stageLabels = new Map<string, string>();
  const sectorOrder: string[] = [];
  const stageOrder: string[] = [];

  const startups: TechStartup[] = input.entries.map((entry) => {
    if (!sectorLabels.has(entry.sector.key)) {
      sectorLabels.set(entry.sector.key, entry.sector.label);
      sectorOrder.push(entry.sector.key);
    }
    if (!stageLabels.has(entry.stage.key)) {
      stageLabels.set(entry.stage.key, entry.stage.label);
      stageOrder.push(entry.stage.key);
    }

    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      sector: entry.sector.key,
      stage: entry.stage.key,
      headquarters: entry.headquarters,
      country: entry.country,
      founded: entry.founded,
      website: entry.website,
      totalRaised: entry.totalRaised,
      valuation: entry.valuation,
      employees: entry.employees,
      lastRound: entry.lastRound,
      notableInvestors: entry.notableInvestors,
      tags: entry.tags,
      momentumScore: calculateMomentumScore(entry, input.asOf),
    };
  });

  const sectors = buildSegments(startups, "sector", sectorLabels, sectorOrder);
  const stages = buildSegments(startups, "stage", stageLabels, stageOrder);

  return {
    generatedAt: input.generatedAt,
    asOf: input.asOf,
    verified: input.verified,
    sourceLabel: input.sourceLabel,
    sourceUrl: input.sourceUrl,
    disclaimer: input.disclaimer,
    currency: input.currency ?? "USD",
    startups,
    sectors,
    stages,
    totals: {
      startups: startups.length,
      sectors: sectors.length,
      stages: stages.length,
      totalRaised: startups.reduce((sum, startup) => sum + startup.totalRaised, 0),
      totalValuation: startups.reduce(
        (sum, startup) => sum + (startup.valuation ?? 0),
        0
      ),
      unicornCount: startups.filter(
        (startup) => (startup.valuation ?? 0) >= UNICORN_THRESHOLD
      ).length,
    },
  };
}

export function sortTechStartups(
  startups: TechStartup[],
  sortKey: TechStartupSortKey
): TechStartup[] {
  const next = [...startups];
  switch (sortKey) {
    case "valuation":
      return next.sort(
        (a, b) =>
          (b.valuation ?? 0) - (a.valuation ?? 0) || b.totalRaised - a.totalRaised
      );
    case "raised":
      return next.sort(
        (a, b) => b.totalRaised - a.totalRaised || (b.valuation ?? 0) - (a.valuation ?? 0)
      );
    case "recent":
      return next.sort(
        (a, b) =>
          b.lastRound.date.localeCompare(a.lastRound.date) ||
          b.momentumScore - a.momentumScore
      );
    case "momentum":
    default:
      return next.sort(
        (a, b) =>
          b.momentumScore - a.momentumScore || (b.valuation ?? 0) - (a.valuation ?? 0)
      );
  }
}

/** Compact USD formatter: `$300B`, `$13.8B`, `$600M`. */
export function formatUsdCompact(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "Undisclosed";
  const format = (scaled: number, suffix: string) => {
    const rounded = Math.round(scaled * 10) / 10;
    const text = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    return `$${text}${suffix}`;
  };
  if (value >= 1e12) return format(value / 1e12, "T");
  if (value >= 1e9) return format(value / 1e9, "B");
  if (value >= 1e6) return format(value / 1e6, "M");
  if (value >= 1e3) return format(value / 1e3, "K");
  return `$${value}`;
}
