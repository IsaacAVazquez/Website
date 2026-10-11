import type { EnhancedHolding, InvestmentsPriceHealth } from "@/types/investment";

export interface QuoteSourceCounts {
  total: number;
  live: number;
  saved: number;
}

/**
 * Where the portfolio's prices came from, counted once so the quote tape and
 * the balance read the same numbers. Cost basis is the remainder.
 */
export function countQuoteSources(holdings: ReadonlyArray<Pick<EnhancedHolding, "priceSource">>): QuoteSourceCounts {
  let live = 0;
  let saved = 0;
  for (const holding of holdings) {
    if (holding.priceSource === "live") live += 1;
    else if (holding.priceSource === "saved") saved += 1;
  }
  return { total: holdings.length, live, saved };
}

const DEFAULT_MAX_PRICE_AGE_DAYS = 7;

export function isStrictIsoCalendarDate(value: string): boolean {
  const dateOnly = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return false;
  const parsed = new Date(`${dateOnly}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateOnly;
}

function calendarDayDiff(later: string, earlier: string): number | null {
  if (!isStrictIsoCalendarDate(later) || !isStrictIsoCalendarDate(earlier)) {
    return null;
  }
  const laterDate = new Date(`${later.slice(0, 10)}T00:00:00Z`);
  const earlierDate = new Date(`${earlier.slice(0, 10)}T00:00:00Z`);
  return Math.floor((laterDate.getTime() - earlierDate.getTime()) / 86_400_000);
}

export function isRecentInvestmentPrice(
  priceAsOf: string | null | undefined,
  assessedAt: string,
  maxAgeDays = DEFAULT_MAX_PRICE_AGE_DAYS
): boolean {
  if (!priceAsOf) return false;
  const ageDays = calendarDayDiff(assessedAt, priceAsOf);
  return ageDays !== null && ageDays >= -1 && ageDays <= maxAgeDays;
}

export function buildInvestmentsPriceHealth(
  priceDates: Array<string | null | undefined>,
  assessedAt: string,
  maxAgeDays = DEFAULT_MAX_PRICE_AGE_DAYS
): InvestmentsPriceHealth {
  const validDates = priceDates.filter(
    (value): value is string =>
      typeof value === "string" &&
      value.length > 0 &&
      calendarDayDiff(assessedAt, value) !== null
  );
  validDates.sort();
  const recentCount = validDates.filter((value) =>
    isRecentInvestmentPrice(value, assessedAt, maxAgeDays)
  ).length;

  return {
    assessedAt,
    maxAgeDays,
    pricedCount: validDates.length,
    recentCount,
    delayedCount: validDates.length - recentCount,
    missingCount: priceDates.length - validDates.length,
    oldestAsOf: validDates[0] ?? null,
    latestAsOf: validDates.at(-1) ?? null,
  };
}
