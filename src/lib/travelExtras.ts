import type { Trip } from "@/types/travel";
import { isLocalDateKey } from "./date-formatters";

export function normalizeActivityCost(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 10_000_000
    ? Math.round(value * 100) / 100
    : null;
}
export function activityBudget(activities: { cost?: number | null }[]) {
  const costs = activities
    .map((activity) => normalizeActivityCost(activity.cost))
    .filter((cost): cost is number => cost !== null);
  return {
    total: costs.reduce((sum, cost) => sum + Math.round(cost * 100), 0) / 100,
    priced: costs.length,
    unpriced: activities.length - costs.length,
  };
}
const escapeText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
/** Fold by UTF-8 octets without splitting a Unicode code point (RFC 5545). */
function fold(line: string): string {
  const chunks: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const code = char.codePointAt(0)!;
    const size = code < 128 ? 1 : code < 2048 ? 2 : code < 65536 ? 3 : 4;
    if (bytes + size > 74) {
      chunks.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  chunks.push(current);
  return chunks.join("\r\n");
}
export function tripCalendar(trip: Trip, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Isaac Vazquez//Travel Planner//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(trip.name)}`,
  ];
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  for (const activity of trip.activities) {
    if (!isLocalDateKey(activity.date)) continue;
    const date = activity.date.replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(trip.id)}-${encodeURIComponent(activity.id)}@isaacvazquez.com`,
      `DTSTAMP:${stamp}`,
    );
    if (validTime(activity.time)) {
      lines.push(`DTSTART:${date}T${activity.time.replace(":", "")}00`);
      if (validTime(activity.endTime) && activity.endTime > activity.time)
        lines.push(`DTEND:${date}T${activity.endTime.replace(":", "")}00`);
    } else {
      const next = new Date(`${activity.date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      lines.push(
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
      );
    }
    lines.push(
      `SUMMARY:${escapeText(activity.title)}`,
      `LOCATION:${escapeText(activity.location)}`,
      `DESCRIPTION:${escapeText(activity.notes)}`,
      "END:VEVENT",
    );
  }
  return [...lines, "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}
