import type {
  InvestmentSection,
  InvestmentSnapshot,
  InvestmentSnapshotFreshness,
} from "@/types/investment";

type SnapshotLike = Pick<InvestmentSnapshot, "lastUpdated" | "sections" | "freshness">;

function getLatestDatedEntry(
  rows: unknown,
  keys: readonly string[]
): string | null {
  if (!Array.isArray(rows)) {
    return null;
  }

  let latestDate: string | null = null;

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const record = row as Record<string, unknown>;
    const candidate = keys.find(
      (key) => typeof record[key] === "string" && record[key]
    );
    const value = candidate ? (record[candidate] as string) : null;

    if (!value) {
      continue;
    }

    if (!latestDate || value > latestDate) {
      latestDate = value;
    }
  }

  return latestDate;
}

function pruneEmptyFreshnessSections(
  sections: Partial<Record<InvestmentSection, string | null>>
): Partial<Record<InvestmentSection, string | null>> {
  return Object.fromEntries(
    Object.entries(sections).filter(([, value]) => typeof value === "string" && value.length > 0)
  ) as Partial<Record<InvestmentSection, string | null>>;
}

export function getPriceAsOf(rows: unknown): string | null {
  return getLatestDatedEntry(rows, ["date", "report_date"]);
}

export function buildInvestmentFreshness(options: {
  snapshotBuiltAt: string | null;
  sections?: Partial<Record<InvestmentSection, string | null>>;
}): InvestmentSnapshotFreshness {
  return {
    snapshotBuiltAt: options.snapshotBuiltAt ?? null,
    sections: pruneEmptyFreshnessSections(options.sections ?? {}),
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
  });
}

export function normalizeInvestmentSnapshot(
  snapshot: InvestmentSnapshot
): InvestmentSnapshot {
  return {
    ...snapshot,
    freshness: normalizeInvestmentFreshness(snapshot),
  };
}
