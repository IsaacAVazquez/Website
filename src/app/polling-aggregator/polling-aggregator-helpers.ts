import type { CSSProperties } from "react";
import type { RaceRating, Party } from "@/types/polling";
import { DATE_ONLY_TIME_ZONE, UPDATED_AT_FORMATTER, formatStableDateTime } from "@/lib/date-formatters";

// ─── Formatting ────────────────────────────────────────────────────────────────

// endDate/date/lastPolled are ISO dates (no time component), so they're
// pinned to UTC to keep their calendar day instead of the visitor's zone.
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});
const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});
// sourceAsOf, unlike generatedAt, is one of the poll endDate values (an ISO
// date with no clock time), so it's pinned to UTC like formatDate/
// formatShortDate above rather than the display zone, or it would show a day
// early in the Americas.
const UPDATED_DATE_ONLY_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : SHORT_DATE_FMT.format(d);
}

// ─── Source freshness ──────────────────────────────────────────────────────────

const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

export function newestPollDate(polls: { endDate: string }[]): string | null {
  return polls.map((poll) => poll.endDate).sort().at(-1) ?? null;
}

/**
 * One sentence for the source note when a series has had no new poll for more
 * than 14 days. It speaks for the polls the page kept, because the builder
 * drops small samples and incomplete rows and cannot speak for the whole feed.
 */
export function describeStaleSource(
  approvalDate: string | null,
  genericBallotDate: string | null,
  now = Date.now()
): string | null {
  const [first, second] = [
    { series: "approval", date: approvalDate },
    { series: "generic ballot", date: genericBallotDate },
  ].filter(
    (entry): entry is { series: string; date: string } =>
      entry.date !== null && now - Date.parse(entry.date) > STALE_AFTER_MS
  );
  if (!first) return null;
  const lead = `The newest ${first.series} poll I have from VoteHub ended ${formatDate(first.date)}`;
  return second
    ? `${lead} and the newest ${second.series} poll ended ${formatDate(second.date)}, so the averages describe polling up to those dates.`
    : `${lead}, so the ${first.series} average describes polling up to that date.`;
}

export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unavailable";
  // A date-only "YYYY-MM-DD" string (sourceAsOf) is exactly 10 characters;
  // generatedAt is a full ISO instant and always longer.
  return iso.length === 10 ? UPDATED_DATE_ONLY_FMT.format(d) : formatStableDateTime(UPDATED_AT_FORMATTER, d);
}

export function formatMargin(margin: number): string {
  if (Math.abs(margin) < 0.05) return "Even";
  const party = margin > 0 ? "D" : "R";
  return `${party}+${Math.abs(margin).toFixed(1)}`;
}

export function formatNet(net: number): string {
  if (net === 0) return "Even";
  return `${net > 0 ? "+" : ""}${net.toFixed(1)}`;
}

// ─── Party colors ──────────────────────────────────────────────────────────────

// CSS values, so they only work in `style` (never an SVG presentation
// attribute, where var() does not resolve). These are the mark steps, for
// lines, swatches, bars, and coloured figures on the sheet; the rating fills
// below use the full inks.
export const DEM_COLOR = "var(--c97-party-d-mark)";
export const REP_COLOR = "var(--c97-party-r-mark)";
export const TUP_COLOR = "var(--c97-party-tossup-mark)";

const DEM_INK = "var(--c97-party-d)";
const REP_INK = "var(--c97-party-r)";
const TUP_INK = "var(--c97-party-tossup)";

export function partyColor(party: Party): string {
  if (party === "D") return DEM_COLOR;
  if (party === "R") return REP_COLOR;
  return "var(--c97-ink-2)";
}

// ─── Rating styles ─────────────────────────────────────────────────────────────

const rampFill = (ink: string, pct: number) => `color-mix(in srgb, ${ink} ${pct}%, var(--c97-field))`;

/*
 * Safe is the party ink, Likely mixes it 50% into the field, Lean 25%. Likely
 * sits at 50% rather than 70% because at 70% Likely D measured 3.16:1 against
 * the paper sheet's ink and 4.19:1 against its paper in light mode, so no
 * token cleared 4.5:1. The mixed steps take the sheet's ink, which clears
 * 4.5:1 in both themes on the paper sheet (lowest is Likely D in light, 4.77).
 * The full inks never change with the theme, so their text is a print ink
 * that never does either: bone on blue (6.69), black on vermilion (4.62) and
 * on saffron (10.15).
 */
export function getRatingBg(rating: RaceRating): string {
  switch (rating) {
    case "Safe D":    return DEM_INK;
    case "Likely D":  return rampFill(DEM_INK, 50);
    case "Lean D":    return rampFill(DEM_INK, 25);
    case "Toss-up":   return TUP_INK;
    case "Lean R":    return rampFill(REP_INK, 25);
    case "Likely R":  return rampFill(REP_INK, 50);
    case "Safe R":    return REP_INK;
  }
}

export function getRatingTextColor(rating: RaceRating): string {
  switch (rating) {
    case "Safe D":   return "var(--c97-print-bone)";
    case "Toss-up":
    case "Safe R":   return "var(--c97-print-black)";
    default:         return "var(--c97-ink)";
  }
}

export function getRatingPillStyle(rating: RaceRating): CSSProperties {
  return {
    background: getRatingBg(rating),
    color: getRatingTextColor(rating),
    borderColor: getRatingBg(rating),
  };
}

export function getRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      borderColor: "color-mix(in srgb, var(--c97-accent) 35%, var(--c97-rule))",
      background: "color-mix(in srgb, var(--c97-accent) 8%, var(--c97-field))",
    };
  }
  return {
    borderColor: "var(--c97-rule)",
    background: "var(--c97-field)",
  };
}

// ─── SVG trend chart helpers ───────────────────────────────────────────────────

interface Point { x: number; y: number }

/**
 * Maps a series into an SVG polyline using a *shared* Y-domain so multiple
 * series (e.g. approve + disapprove) align on one scale. The caller computes
 * `minVal`/`maxVal` across every series and passes the same values for each
 * polyline, the gridlines, and the end-dots so the chart is internally
 * consistent.
 */
export function buildPolyline(
  values: number[],
  width: number,
  height: number,
  padding: number,
  minVal: number,
  maxVal: number
): string {
  if (values.length < 2) return "";
  const range = maxVal - minVal || 1;
  const pts: Point[] = values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * (width - padding * 2),
    y: height - padding - ((v - minVal) / range) * (height - padding * 2),
  }));
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}
