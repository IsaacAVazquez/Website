import type { MissionLaunchCard } from "@/types/spacex";
import {
  isFollowingId,
  isSourceTime,
  readRecordArray,
} from "@/lib/personalFollowing";
import { escapeCalendarText, foldCalendarLine } from "@/lib/travelExtras";

export const FOLLOWED_LAUNCHES_KEY = "spacex-followed-launches-v1";
export const LAUNCH_READINGS_KEY = "spacex-launch-readings-v1";
export interface LaunchReading {
  id: string;
  sourceAt: string;
  dateUtc: string;
  precise: boolean;
  upcoming: boolean;
  success: boolean | null;
}
export function launchReading(
  launch: MissionLaunchCard,
  sourceAt: string,
): LaunchReading {
  return {
    id: launch.id,
    sourceAt,
    dateUtc: launch.dateUtc,
    precise:
      launch.hasExactTime &&
      !launch.tbd &&
      !launch.net &&
      !launch.isStaleSchedule,
    upcoming: launch.upcoming,
    success: launch.success,
  };
}
export function parseLaunchReadings(raw: string): LaunchReading[] {
  return readRecordArray(raw)
    .flatMap((row): LaunchReading[] =>
      isFollowingId(row.id) &&
      isSourceTime(row.sourceAt) &&
      isSourceTime(row.dateUtc) &&
      typeof row.precise === "boolean" &&
      typeof row.upcoming === "boolean" &&
      (row.success === null || typeof row.success === "boolean")
        ? [
            {
              id: row.id,
              sourceAt: row.sourceAt,
              dateUtc: row.dateUtc,
              precise: row.precise,
              upcoming: row.upcoming,
              success: row.success,
            },
          ]
        : [],
    )
    .slice(0, 80);
}
export function scheduleChange(
  current: LaunchReading,
  previous: LaunchReading,
) {
  return (
    current.id === previous.id &&
    (current.dateUtc !== previous.dateUtc ||
      current.precise !== previous.precise ||
      current.upcoming !== previous.upcoming ||
      current.success !== previous.success)
  );
}
export function calendarLaunches(launches: MissionLaunchCard[], now: Date) {
  return launches.filter(
    (launch) =>
      launch.hasExactTime &&
      !launch.tbd &&
      !launch.net &&
      !launch.isStaleSchedule &&
      launch.upcoming &&
      isSourceTime(launch.dateUtc) &&
      Date.parse(launch.dateUtc) > now.getTime(),
  );
}
const icsTime = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
export function launchCalendar(
  launches: MissionLaunchCard[],
  now = new Date(),
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Isaac Vazquez//Launch Tracker//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const launch of calendarLaunches(launches, now))
    lines.push(
      "BEGIN:VEVENT",
      `UID:launch-${encodeURIComponent(launch.id)}@isaacvazquez.com`,
      `DTSTAMP:${icsTime(now)}`,
      `DTSTART:${icsTime(new Date(launch.dateUtc))}`,
      `SUMMARY:${escapeCalendarText(launch.name)}`,
      `LOCATION:${escapeCalendarText(launch.launchpadName ?? "")}`,
      "DESCRIPTION:Published launch schedule. Check the provider for changes before launch.",
      "END:VEVENT",
    );
  return (
    [...lines, "END:VCALENDAR"].map(foldCalendarLine).join("\r\n") + "\r\n"
  );
}
