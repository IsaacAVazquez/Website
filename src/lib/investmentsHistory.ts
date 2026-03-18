function parseHistoryDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseReferenceDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffInCalendarDays(later: Date, earlier: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate()) -
    Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate())) / msPerDay);
}

export function formatHistoryAsOf(raw: string | undefined | null): string {
  const parsed = parseHistoryDate(raw);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getHistoricalPriceFreshness(
  latestHistoryDate: string | undefined | null,
  datasetLastUpdated: string | null,
  referenceDate: Date = new Date()
): {
  historyDate: Date | null;
  referenceDate: Date;
  lagDays: number | null;
  isStale: boolean;
} {
  const historyDate = parseHistoryDate(latestHistoryDate);
  if (!historyDate) {
    return {
      historyDate: null,
      referenceDate,
      lagDays: null,
      isStale: false,
    };
  }

  const datasetDate = parseReferenceDate(datasetLastUpdated);
  const comparisonDate =
    datasetDate && datasetDate.getTime() < referenceDate.getTime()
      ? datasetDate
      : referenceDate;

  const lagDays = Math.max(0, diffInCalendarDays(comparisonDate, historyDate));

  return {
    historyDate,
    referenceDate: comparisonDate,
    lagDays,
    isStale: lagDays > 3,
  };
}
