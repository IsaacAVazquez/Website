/**
 * Travel Deal Lab signature helpers: the fare gauge and the booking strip.
 *
 * Both are pure transforms of the region data and the trip form's own
 * inputs, so the SVG signature and any future surface share one source of
 * truth. `fareGauge` reuses `scoreFare`'s rating rather than inventing a
 * second one, so the gauge and the fare-checker text never disagree.
 */

import type { DestinationRegion } from "@/types/travelDeals";
import { daysBetween, scoreFare, type FareRating } from "@/lib/travelDeals";

// --- Fare gauge --------------------------------------------------------

/** Padding added to each side of the low..high band, as a fraction of its span. */
const DOMAIN_MARGIN_FRACTION = 0.2;

export interface FareGaugeBand {
  low: number;
  typical: number;
  high: number;
}

export interface FareGauge {
  domain: { low: number; high: number };
  /** Band positions as fractions (0..1) of the domain. */
  band: FareGaugeBand;
  /** Needle position as a fraction (0..1) of the domain, clamped at the ends. */
  needle: number;
  clamped: "low" | "high" | null;
  rating: FareRating;
}

/**
 * Place a quoted fare on a scale wide enough to hold the region's typical
 * band with room either side, and rate it the same way `scoreFare` does.
 */
export function fareGauge(quoted: number, region: DestinationRegion): FareGauge {
  const { typicalFareLow: low, typicalFare: typical, typicalFareHigh: high } = region;
  const span = Math.max(1, high - low);
  const margin = span * DOMAIN_MARGIN_FRACTION;
  const domainLow = Math.max(0, low - margin);
  const domainHigh = high + margin;
  const domainSpan = Math.max(1, domainHigh - domainLow);
  const toFraction = (value: number) => (value - domainLow) / domainSpan;

  const rawNeedle = toFraction(Math.max(0, quoted));
  const needle = Math.min(1, Math.max(0, rawNeedle));
  const clamped = rawNeedle < 0 ? "low" : rawNeedle > 1 ? "high" : null;

  return {
    domain: { low: domainLow, high: domainHigh },
    band: { low: toFraction(low), typical: toFraction(typical), high: toFraction(high) },
    needle,
    clamped,
    rating: scoreFare(quoted, region).rating,
  };
}

// --- Booking strip -------------------------------------------------------

/** Days of margin added beyond the sweet-spot window so it never touches the strip's edge. */
const STRIP_MARGIN_DAYS = 10;

export type BookingStripPosition = "before" | "inside" | "after";

export interface BookingStrip {
  /** The strip's full width, in days before departure. */
  spanDays: number;
  /** Sweet-spot window as fractions (0..1) of the strip, start nearer the far edge. */
  sweetSpot: { start: number; end: number };
  /** Today's marker as a fraction (0..1) of the strip, clamped at the ends. */
  todayFraction: number | null;
  daysOut: number | null;
  /** Where today sits relative to the sweet-spot window, or null with no valid departure date. */
  position: BookingStripPosition | null;
}

/**
 * Lay a region's booking window out as a strip running from `spanDays`
 * days before departure (left) to departure itself (right), with the
 * sweet-spot window shaded inside it and today marked.
 */
export function bookingStrip(
  departureKey: string,
  todayKey: string,
  region: DestinationRegion,
): BookingStrip {
  const daysOut = daysBetween(todayKey, departureKey);
  const spanDays = Math.max(
    region.sweetSpotMaxDays + STRIP_MARGIN_DAYS,
    daysOut !== null ? daysOut + STRIP_MARGIN_DAYS : 0,
  );
  const toFraction = (daysBeforeDeparture: number) => (spanDays - daysBeforeDeparture) / spanDays;

  const sweetSpot = {
    start: toFraction(region.sweetSpotMaxDays),
    end: toFraction(region.sweetSpotMinDays),
  };

  if (daysOut === null) {
    return { spanDays, sweetSpot, todayFraction: null, daysOut: null, position: null };
  }

  const todayFraction = Math.min(1, Math.max(0, toFraction(daysOut)));
  const position: BookingStripPosition =
    daysOut < region.sweetSpotMinDays
      ? "after"
      : daysOut > region.sweetSpotMaxDays
      ? "before"
      : "inside";

  return { spanDays, sweetSpot, todayFraction, daysOut, position };
}
