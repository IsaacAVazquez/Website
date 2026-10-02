import type { CSSProperties } from "react";
import type { RaceRating, Party } from "@/types/polling";
import { DATE_ONLY_TIME_ZONE, UPDATED_AT_FORMATTER } from "@/lib/date-formatters";

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
  return iso.length === 10 ? UPDATED_DATE_ONLY_FMT.format(d) : UPDATED_AT_FORMATTER.format(d);
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

export const DEM_COLOR = "#2563EB";   // blue-600
export const REP_COLOR = "#DC2626";   // red-600
export const TUP_COLOR = "#D97706";   // amber-600 (toss-up)

export function partyColor(party: Party): string {
  if (party === "D") return DEM_COLOR;
  if (party === "R") return REP_COLOR;
  return "#64748B";
}

export function partyLabel(party: Party): string {
  if (party === "D") return "Dem.";
  if (party === "R") return "Rep.";
  if (party === "I") return "Ind.";
  return party;
}

// ─── Rating styles ─────────────────────────────────────────────────────────────

export function getRatingBg(rating: RaceRating): string {
  switch (rating) {
    case "Safe D":    return "#1D4ED8";
    case "Likely D":  return "#3B82F6";
    case "Lean D":    return "#93C5FD";
    case "Toss-up":   return "#D97706";
    case "Lean R":    return "#FCA5A5";
    case "Likely R":  return "#EF4444";
    case "Safe R":    return "#B91C1C";
  }
}

export function getRatingTextColor(rating: RaceRating): string {
  switch (rating) {
    case "Safe D":   return "#fff";
    case "Likely D": return "#fff";
    case "Lean D":   return "#1e3a5f";
    case "Toss-up":  return "#fff";
    case "Lean R":   return "#5c1a1a";
    case "Likely R": return "#fff";
    case "Safe R":   return "#fff";
  }
}

export function getRatingPillStyle(rating: RaceRating): CSSProperties {
  return {
    background: getRatingBg(rating),
    color: getRatingTextColor(rating),
    borderColor: getRatingBg(rating),
  };
}

export function getActiveViewStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      background: "var(--c97-ink)",
      color: "var(--c97-surface)",
      borderColor: "var(--c97-ink)",
    };
  }
  return {
    borderColor: "var(--c97-rule)",
    background: "var(--c97-field)",
    color: "var(--c97-ink-2)",
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
