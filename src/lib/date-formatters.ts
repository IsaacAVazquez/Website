/**
 * Shared date/time formatters used across dashboards (DB-6). Each dashboard
 * was previously declaring its own `Intl.DateTimeFormat` — having a single
 * source ensures formatting stays consistent and timezone context is shown
 * everywhere it matters.
 */

/** Short date: "Apr 25" */
export const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/** Date + time + timezone: "Apr 25, 2:30 PM EDT" */
export const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

/** Long date + time + timezone: "Sat, Apr 25, 2:30 PM EDT" */
export const LONG_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

/** "Updated at" timestamp: "Apr 25, 2:30 PM" */
export const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Full calendar date: "Apr 25, 2026" */
export const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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

export function formatFullDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "Unavailable" : FULL_DATE_FORMATTER.format(date);
}

/** Calendar key in the user's local timezone: `YYYY-MM-DD`. */
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
