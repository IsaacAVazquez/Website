/**
 * Travel Deal Lab — the pure optimization engine.
 *
 * Framework-free, dependency-free, and fully unit-tested so the client UI and
 * any future surface share one source of truth. Nothing here calls a network:
 * the fare bands and points baseline it reasons against live in
 * `src/data/travelDealsSnapshot.ts` as curated, unverified editorial estimates.
 * Every function is a pure transform of its inputs.
 */

import type { DestinationRegion, RegionId } from "@/types/travelDeals";
import { DESTINATION_REGIONS, POINTS_BASELINE_CENTS } from "@/data/travelDealsSnapshot";

// --- Date helpers (self-contained so the engine has no cross-module deps) ---

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE.test(value);
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date | null {
  if (!isIsoDate(value)) return null;
  const date = new Date(`${value}T00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whole days from `fromKey` to `toKey`; negative when `toKey` is in the past. */
export function daysBetween(fromKey: string, toKey: string): number | null {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// --- Region lookup ----------------------------------------------------------

export function getRegion(regionId: RegionId): DestinationRegion | undefined {
  return DESTINATION_REGIONS.find((region) => region.id === regionId);
}

// --- Booking window ---------------------------------------------------------

export type BookingStatus =
  | "departed"
  | "too-early"
  | "watching"
  | "sweet-spot"
  | "closing"
  | "last-call";

export interface BookingWindow {
  status: BookingStatus;
  daysUntilDeparture: number | null;
  sweetSpotMinDays: number;
  sweetSpotMaxDays: number;
  /** Days from today until the sweet spot opens; 0 once you are inside it. */
  daysUntilSweetSpot: number;
  headline: string;
  message: string;
}

const LAST_CALL_DAYS = 14;

/**
 * Classify where today sits relative to a region's cheaper booking window and
 * return plain guidance. The thresholds encode the usual advance-purchase
 * pattern: fares are noise far out, tend to bottom out inside the sweet spot,
 * and climb into the last two weeks. It is guidance about *when to book*, not a
 * price prediction for a specific route.
 */
export function getBookingWindow(
  region: DestinationRegion,
  departureDateKey: string,
  today = todayKey(),
): BookingWindow {
  const base = {
    sweetSpotMinDays: region.sweetSpotMinDays,
    sweetSpotMaxDays: region.sweetSpotMaxDays,
  };

  const daysUntil = daysBetween(today, departureDateKey);
  if (daysUntil === null) {
    return {
      ...base,
      status: "watching",
      daysUntilDeparture: null,
      daysUntilSweetSpot: 0,
      headline: "Add a departure date",
      message: "Pick a departure date and I will map out when to start watching fares and when the cheaper window usually opens.",
    };
  }

  const daysUntilSweetSpot = Math.max(0, daysUntil - region.sweetSpotMaxDays);

  if (daysUntil < 0) {
    return {
      ...base,
      status: "departed",
      daysUntilDeparture: daysUntil,
      daysUntilSweetSpot: 0,
      headline: "Departure has passed",
      message: "This date is in the past. Update it to plan a live trip.",
    };
  }

  if (daysUntil > region.bookWindowOpenDays) {
    return {
      ...base,
      status: "too-early",
      daysUntilDeparture: daysUntil,
      daysUntilSweetSpot,
      headline: "Too early to commit",
      message: `You are ${daysUntil} days out, which is further than fares tend to mean anything for this kind of trip. Set a price alert now and let it run. The window worth watching opens around ${region.bookWindowOpenDays} days before you go.`,
    };
  }

  if (daysUntil > region.sweetSpotMaxDays) {
    return {
      ...base,
      status: "watching",
      daysUntilDeparture: daysUntil,
      daysUntilSweetSpot,
      headline: "Window is open, keep watching",
      message: `Fares are worth tracking now. I would not book at full price yet, but if an alert fires with a fare below the typical band, take it. The cheaper stretch usually runs ${region.sweetSpotMinDays} to ${region.sweetSpotMaxDays} days out.`,
    };
  }

  if (daysUntil >= region.sweetSpotMinDays) {
    return {
      ...base,
      status: "sweet-spot",
      daysUntilDeparture: daysUntil,
      daysUntilSweetSpot: 0,
      headline: "You are in the sweet spot",
      message: `At ${daysUntil} days out you are inside the window where fares for this kind of trip tend to be lowest. If today's price is at or below the typical band, book it rather than waiting for a bottom you probably will not time.`,
    };
  }

  if (daysUntil >= LAST_CALL_DAYS) {
    return {
      ...base,
      status: "closing",
      daysUntilDeparture: daysUntil,
      daysUntilSweetSpot: 0,
      headline: "Window is closing",
      message: `Under ${region.sweetSpotMinDays} days out, prices usually start climbing. Book the best fare you can find soon, and stay flexible on the exact day if you can.`,
    };
  }

  return {
    ...base,
    status: "last-call",
    daysUntilDeparture: daysUntil,
    daysUntilSweetSpot: 0,
    headline: "Last-minute booking",
    message: `Inside two weeks fares are usually at their highest. Check nearby airports and adjacent dates, look at whether points cover the ticket at a fair value, and book once you find something workable.`,
  };
}

// --- Fare deal score --------------------------------------------------------

export type FareRating = "steal" | "good" | "fair" | "high";

export interface FareScore {
  /** Typical benchmark fare for the whole party, in USD. */
  benchmark: number;
  benchmarkLow: number;
  benchmarkHigh: number;
  quoted: number;
  /** benchmark - quoted; positive means you are under the typical fare. */
  savings: number;
  /** savings / benchmark, clamped to a sane range for display. */
  savingsPct: number;
  rating: FareRating;
  message: string;
}

function roundCurrency(value: number): number {
  return Math.round(value);
}

/**
 * Score a quoted fare for the whole party against the region's typical band.
 * `quoted` is the total the search shows for `travelers` seats; the benchmark
 * scales the per-traveler typical fare by the party size.
 */
export function scoreFare(
  quoted: number,
  region: DestinationRegion,
  travelers = 1,
): FareScore {
  const party = Math.max(1, Math.round(travelers));
  const benchmark = roundCurrency(region.typicalFare * party);
  const benchmarkLow = roundCurrency(region.typicalFareLow * party);
  const benchmarkHigh = roundCurrency(region.typicalFareHigh * party);
  const safeQuoted = Math.max(0, quoted);
  const savings = roundCurrency(benchmark - safeQuoted);
  const savingsPct = benchmark > 0 ? savings / benchmark : 0;

  let rating: FareRating;
  let message: string;
  if (savingsPct >= 0.3) {
    rating = "steal";
    message = "That is well under the typical fare. If the dates and routing work, book it now.";
  } else if (savingsPct >= 0.1) {
    rating = "good";
    message = "A solid fare, below the typical band. Worth booking unless you have reason to think a sale is coming.";
  } else if (savingsPct >= -0.1) {
    rating = "fair";
    message = "About average for this route. Fine to book if timing matters, but a price alert might catch something better.";
  } else {
    rating = "high";
    message = "Above the typical fare. I would hold off, set an alert, and check nearby airports or adjacent dates before committing.";
  }

  return {
    benchmark,
    benchmarkLow,
    benchmarkHigh,
    quoted: safeQuoted,
    savings,
    savingsPct,
    rating,
    message,
  };
}

// --- Points redemption value ------------------------------------------------

export type PointsRating = "excellent" | "good" | "fair" | "poor";

export interface PointsValue {
  centsPerPoint: number;
  baseline: number;
  rating: PointsRating;
  message: string;
}

/**
 * Value a points or miles redemption as cents per point, netting out the taxes
 * and fees you still pay in cash. Compares against a baseline (the rough value
 * of transferable points, defaulting to the curated snapshot figure) so a
 * redemption reads as good only when it beats cashing the points out.
 */
export function valuePoints(
  cashPrice: number,
  taxesAndFees: number,
  pointsUsed: number,
  baseline = POINTS_BASELINE_CENTS,
): PointsValue {
  if (!(pointsUsed > 0)) {
    return {
      centsPerPoint: 0,
      baseline,
      rating: "poor",
      message: "Enter how many points the award costs to see the value.",
    };
  }

  const cashValue = Math.max(0, cashPrice - Math.max(0, taxesAndFees));
  const centsPerPoint = Math.round(((cashValue / pointsUsed) * 100) * 100) / 100;

  let rating: PointsRating;
  let message: string;
  if (centsPerPoint >= baseline * 1.5) {
    rating = "excellent";
    message = `At ${centsPerPoint.toFixed(2)}¢ per point you are getting outsized value. This is the kind of redemption points are worth hoarding for.`;
  } else if (centsPerPoint >= baseline) {
    rating = "good";
    message = `At ${centsPerPoint.toFixed(2)}¢ per point you are beating the baseline. A fair use of points.`;
  } else if (centsPerPoint >= baseline * 0.7) {
    rating = "fair";
    message = `At ${centsPerPoint.toFixed(2)}¢ per point this is close to a wash against paying cash. Reasonable if you are point-rich, otherwise pay cash and keep the points.`;
  } else {
    rating = "poor";
    message = `At ${centsPerPoint.toFixed(2)}¢ per point you are burning points below their baseline value. Pay cash unless you are trying to clear a balance.`;
  }

  return { centsPerPoint, baseline, rating, message };
}

// --- Budget split -----------------------------------------------------------

export interface BudgetPlan {
  total: number;
  nights: number;
  days: number;
  travelers: number;
  flights: number;
  lodging: number;
  food: number;
  activities: number;
  buffer: number;
  /** Nightly lodging target across the whole party. */
  lodgingPerNight: number;
  /** Daily food target per traveler. */
  foodPerDayPerPerson: number;
}

/**
 * Suggest a starting split of a total trip budget. The percentages are a
 * sensible default, not a rule: flights and lodging dominate, with a buffer
 * held back for the costs that always appear. Returns per-night and per-person
 * targets so the numbers translate into decisions while shopping.
 */
export function planBudget(total: number, nights: number, travelers = 1): BudgetPlan {
  const safeTotal = Math.max(0, total);
  const safeNights = Math.max(1, Math.round(nights));
  const days = safeNights + 1;
  const party = Math.max(1, Math.round(travelers));

  const flights = roundCurrency(safeTotal * 0.35);
  const lodging = roundCurrency(safeTotal * 0.3);
  const food = roundCurrency(safeTotal * 0.2);
  const activities = roundCurrency(safeTotal * 0.1);
  // Buffer absorbs rounding so the parts always sum back to the total.
  const buffer = roundCurrency(safeTotal - flights - lodging - food - activities);

  return {
    total: safeTotal,
    nights: safeNights,
    days,
    travelers: party,
    flights,
    lodging,
    food,
    activities,
    buffer,
    lodgingPerNight: roundCurrency(lodging / safeNights),
    foodPerDayPerPerson: roundCurrency(food / (days * party)),
  };
}

// --- Formatters -------------------------------------------------------------

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(value: number): string {
  return USD.format(Math.round(value));
}

export function formatSignedPercent(value: number): string {
  const pct = Math.round(value * 100);
  if (pct > 0) return `+${pct}%`;
  return `${pct}%`;
}
