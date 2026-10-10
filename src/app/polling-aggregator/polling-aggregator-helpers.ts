import type { CSSProperties } from "react";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";

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

/** Whether a series' newest kept poll ended more than 14 days before `now`. */
export function isStalePollDate(date: string | null, now = Date.now()): boolean {
  return date !== null && now - Date.parse(date) > STALE_AFTER_MS;
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
    (entry): entry is { series: string; date: string } => isStalePollDate(entry.date, now)
  );
  if (!first) return null;
  const lead = `The newest ${first.series} poll I have from VoteHub ended ${formatDate(first.date)}`;
  return second
    ? `${lead} and the newest ${second.series} poll ended ${formatDate(second.date)}, so the averages describe polling up to those dates.`
    : `${lead}, so the ${first.series} average describes polling up to that date.`;
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
// lines, swatches, bars, and coloured figures on the sheet. They colour the
// approval and generic ballot series only, since VoteHub publishes a race
// poll's candidates without a party.
export const DEM_COLOR = "var(--c97-party-d-mark)";
export const REP_COLOR = "var(--c97-party-r-mark)";

// ─── Row styles ────────────────────────────────────────────────────────────────

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
