function parseHistoryDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
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

  // Lag is measured against today, not the snapshot build date. The build date
  // moved with the snapshot, so a history that stopped months ago read as
  // current whenever the snapshot itself was just as old.
  const lagDays = Math.max(0, diffInCalendarDays(referenceDate, historyDate));

  return {
    historyDate,
    referenceDate,
    lagDays,
    isStale: lagDays > 3,
  };
}
