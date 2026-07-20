import type {
  InvestmentSection,
  InvestmentSnapshot,
  InvestmentSnapshotFreshness,
} from "@/types/investment";
import { buildInvestmentCapabilities } from "@/lib/investmentCapabilities";
import { isStrictIsoCalendarDate } from "@/lib/investmentsPriceHealth";

type SnapshotLike = Pick<InvestmentSnapshot, "lastUpdated" | "sections" | "freshness">;

const RETAINABLE_SECTIONS: InvestmentSection[] = [
  "price",
  "info",
  "fundamentals",
  "profitability",
  "margins",
  "growth",
  "income_statement",
  "balance_sheet",
  "cash_flow",
  "wacc",
  "industry",
  "beta",
  "news",
  "officers",
];

const FIELD_MERGE_SECTIONS = new Set<InvestmentSection>([
  "info",
  "fundamentals",
  "profitability",
  "margins",
  "growth",
  "income_statement",
  "balance_sheet",
  "cash_flow",
  "wacc",
  "industry",
  "beta",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeMissingValues(current: unknown, prior: unknown): unknown {
  if (current === undefined || current === null || current === "") return prior;
  if (isRecord(current) && typeof current.error === "string") return prior;

  if (Array.isArray(current) && Array.isArray(prior)) {
    if (current.length === 0) return prior;

    const hasMetricIdentity = current.every(
      (row) => isRecord(row) && typeof row.metric === "string",
    ) && prior.every(
      (row) => isRecord(row) && typeof row.metric === "string",
    );
    if (hasMetricIdentity) {
      const currentByMetric = new Map(
        current.map((row) => [(row as Record<string, unknown>).metric as string, row]),
      );
      return prior.reduce<unknown[]>((rows, priorRow) => {
        const metric = (priorRow as Record<string, unknown>).metric as string;
        const currentRow = currentByMetric.get(metric);
        if (!currentRow) return [...rows, priorRow];
        return rows.map((row) => row === currentRow
          ? mergeMissingValues(currentRow, priorRow)
          : row);
      }, [...current]);
    }

    return current;
  }

  if (isRecord(current) && isRecord(prior)) {
    const merged: Record<string, unknown> = { ...prior };
    for (const [key, value] of Object.entries(current)) {
      merged[key] = key in prior ? mergeMissingValues(value, prior[key]) : value;
    }
    return merged;
  }

  return current;
}

function pruneEmptyFreshnessSections(
  sections: Partial<Record<InvestmentSection, string | null>>
): Partial<Record<InvestmentSection, string | null>> {
  return Object.fromEntries(
    Object.entries(sections).filter(([, value]) => typeof value === "string" && value.length > 0)
  ) as Partial<Record<InvestmentSection, string | null>>;
}

export function getPriceAsOf(rows: unknown): string | null {
  if (!Array.isArray(rows)) return null;
  return rows.reduce<string | null>((latest, row) => {
    if (!isRecord(row)) return latest;
    const raw = typeof row.date === "string"
      ? row.date
      : typeof row.report_date === "string"
        ? row.report_date
        : null;
    if (!raw || !isStrictIsoCalendarDate(raw)) return latest;
    const candidate = raw.slice(0, 10);
    return !latest || candidate > latest ? candidate : latest;
  }, null);
}

export function buildInvestmentFreshness(options: {
  snapshotBuiltAt: string | null;
  sections?: Partial<Record<InvestmentSection, string | null>>;
  retainedSections?: InvestmentSection[];
}): InvestmentSnapshotFreshness {
  const retainedSections = Array.from(new Set(options.retainedSections ?? []))
    .filter((section) => RETAINABLE_SECTIONS.includes(section));
  return {
    snapshotBuiltAt: options.snapshotBuiltAt ?? null,
    sections: pruneEmptyFreshnessSections(options.sections ?? {}),
    ...(retainedSections.length > 0 ? { retainedSections } : {}),
  };
}

export function normalizeInvestmentFreshness(
  snapshot: SnapshotLike
): InvestmentSnapshotFreshness {
  const existingSections = snapshot.freshness?.sections ?? {};
  const priceAsOf = existingSections.price ?? getPriceAsOf(snapshot.sections.price);

  return buildInvestmentFreshness({
    snapshotBuiltAt: snapshot.freshness?.snapshotBuiltAt ?? snapshot.lastUpdated ?? null,
    sections: {
      ...existingSections,
      price: priceAsOf,
    },
    retainedSections: snapshot.freshness?.retainedSections,
  });
}

export function normalizeInvestmentSnapshot(
  snapshot: InvestmentSnapshot
): InvestmentSnapshot {
  // The committed legacy valuation section capitalizes trailing EPS as though
  // it were free cash flow. Keep old artifacts readable, but suppress that
  // section at the shared normalization boundary so neither the API nor the
  // static client path presents it as investment research.
  const sections: Record<string, unknown> = { ...snapshot.sections };
  delete sections.dcf;

  return {
    ...snapshot,
    capabilities: buildInvestmentCapabilities(sections),
    sections: sections as Partial<Record<InvestmentSection, unknown>>,
    freshness: normalizeInvestmentFreshness(snapshot),
  };
}

/**
 * Quarantine partial provider failures at section granularity. Valid fresh
 * price data is allowed to advance while any section that became
 * empty/error-shaped keeps its prior meaningful value and is explicitly marked
 * as retained.
 */
export function mergeInvestmentSnapshots(
  currentSnapshot: InvestmentSnapshot,
  priorSnapshot: InvestmentSnapshot
): InvestmentSnapshot {
  const current = normalizeInvestmentSnapshot(currentSnapshot);
  const prior = normalizeInvestmentSnapshot(priorSnapshot);
  const sections = { ...current.sections };
  const retainedSections = new Set<InvestmentSection>();
  const sectionFreshness = { ...(current.freshness?.sections ?? {}) };
  const currentPriceAsOf = current.freshness?.sections?.price ?? null;
  const priorPriceAsOf = prior.freshness?.sections?.price ?? null;
  const currentPriceRows = Array.isArray(current.sections.price)
    ? current.sections.price.length
    : 0;
  const priorPriceRows = Array.isArray(prior.sections.price)
    ? prior.sections.price.length
    : 0;

  for (const section of RETAINABLE_SECTIONS) {
    const priceRegressed =
      section === "price" &&
      prior.capabilities.price === true &&
      !!priorPriceAsOf &&
      (!currentPriceAsOf || currentPriceAsOf < priorPriceAsOf);
    const priceCoverageCollapsed =
      section === "price" &&
      priorPriceRows >= 20 &&
      currentPriceRows < Math.ceil(priorPriceRows * 0.8);
    const retainWholeSection =
      (
        current.capabilities[section] !== true ||
        priceRegressed ||
        priceCoverageCollapsed
      ) &&
      prior.capabilities[section] === true &&
      prior.sections[section] !== undefined;
    if (retainWholeSection) {
      sections[section] = prior.sections[section];
      retainedSections.add(section);
      const priorAsOf = prior.freshness?.sections?.[section];
      if (priorAsOf) sectionFreshness[section] = priorAsOf;
      continue;
    }

    if (
      FIELD_MERGE_SECTIONS.has(section) &&
      current.capabilities[section] === true &&
      prior.capabilities[section] === true
    ) {
      const currentSection = current.sections[section];
      const priorSection = prior.sections[section];
      const mergedSection =
        section === "margins" &&
        Array.isArray(currentSection) &&
        currentSection.length === 1 &&
        Array.isArray(priorSection) &&
        priorSection.length === 1
          ? [mergeMissingValues(currentSection[0], priorSection[0])]
          : mergeMissingValues(currentSection, priorSection);
      if (JSON.stringify(mergedSection) !== JSON.stringify(current.sections[section])) {
        sections[section] = mergedSection;
        retainedSections.add(section);
        const priorAsOf = prior.freshness?.sections?.[section];
        if (priorAsOf) sectionFreshness[section] = priorAsOf;
      }
    }
  }

  return normalizeInvestmentSnapshot({
    ...current,
    sections,
    capabilities: buildInvestmentCapabilities(sections),
    freshness: buildInvestmentFreshness({
      snapshotBuiltAt: current.freshness?.snapshotBuiltAt ?? current.lastUpdated,
      sections: sectionFreshness,
      retainedSections: [...retainedSections],
    }),
  });
}
