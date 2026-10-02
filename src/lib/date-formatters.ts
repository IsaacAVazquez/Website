/**
 * Shared date/time formatters used across dashboards (DB-6). Each dashboard
 * was previously declaring its own `Intl.DateTimeFormat` — having a single
 * source ensures formatting stays consistent and timezone context is shown
 * everywhere it matters.
 *
 * Every formatter pins a `timeZone`. The server renders in UTC (Netlify) and
 * each visitor's browser in its own zone, so an unpinned formatter prints
 * different text on each side and breaks hydration.
 */

/** The zone displayed clock times are pinned to. Isaac is in the Bay Area, and BART already reads in it. */
export const DISPLAY_TIME_ZONE = "America/Los_Angeles";

/** Date-only values ("2026-09-15") parse as UTC midnight, so they format in UTC to keep their calendar day. */
export const DATE_ONLY_TIME_ZONE = "UTC";

/**
 * Node, Chrome, and Firefox print an en-GB September as "Sept" and WebKit on
 * macOS prints "Sep", which is what the design uses. Every en-GB short month
 * goes through this, or a date rendered on the server and again in the
 * browser breaks hydration in WebKit for as long as it falls in September.
 */
export const sep = (text: string) => text.replace(/\bSept\b/, "Sep");

/** Short date: "Apr 25" */
export const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});

/** Date + time + timezone: "Apr 25, 2:30 PM PDT" */
export const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
  timeZoneName: "short",
});

/** Long date + time + timezone: "Sat, Apr 25, 2:30 PM PDT" */
export const LONG_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
  timeZoneName: "short",
});

/** "Updated at" timestamp: "Apr 25, 2:30 PM PDT" */
export const UPDATED_AT_FORMATTER = DATE_TIME_FORMATTER;

export function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "TBD" : SHORT_DATE_FORMATTER.format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "TBD" : DATE_TIME_FORMATTER.format(date);
}

export function formatUpdatedAt(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "Unavailable" : UPDATED_AT_FORMATTER.format(date);
}

/**
 * Calendar key in the user's local timezone: `YYYY-MM-DD`. Browser-only, for
 * data the visitor entered; never render it during SSR.
 */
export function toLocalDateKey(date: Date = new Date()): string {
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse a `YYYY-MM-DD` key at local midnight instead of UTC midnight. */
export function parseLocalDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

/** True for a real calendar date encoded as `YYYY-MM-DD`. */
export function isLocalDateKey(value: unknown): value is string {
  return typeof value === "string" && parseLocalDateKey(value) !== null;
}
