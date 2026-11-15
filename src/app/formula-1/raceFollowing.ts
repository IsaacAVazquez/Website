import type { Formula1MeetingMeta, Formula1Snapshot } from "@/types/formula1";
import { escapeCalendarText, foldCalendarLine } from "@/lib/travelExtras";

export const constructorFollowId = (name: string) =>
  `constructor-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "")
    .slice(0, 80)}`;
export interface Formula1RaceRow {
  key: string;
  name: string;
  startAt: string;
  results: {
    driverNumber: number;
    teamName: string | null;
    position: number | null;
    points: number;
    statusLabel: string;
  }[];
}

export function formula1RaceRows(
  snapshot: Pick<Formula1Snapshot, "meetings">,
): Formula1RaceRow[] {
  return snapshot.meetings
    .filter(
      (meeting) => meeting.status === "completed" && meeting.resultPublished,
    )
    .map((meeting) => ({
      key: meeting.key,
      name: meeting.name,
      startAt: meeting.startAt,
      results: meeting.classification.map(
        ({ driverNumber, teamName, position, points, statusLabel }) => ({
          driverNumber,
          teamName,
          position,
          points,
          statusLabel,
        }),
      ),
    }));
}

export function raceReading(race: Formula1RaceRow, id: string) {
  if (id.startsWith("constructor-")) {
    const results = race.results.filter(
      (row) => row.teamName && constructorFollowId(row.teamName) === id,
    );
    return results.length
      ? `${results.reduce((total, row) => total + row.points, 0)} pts · ${results.length} drivers`
      : "Unreported";
  }
  const row = race.results.find((item) => `driver-${item.driverNumber}` === id);
  if (!row) return "Unreported";
  const rank = row.position;
  const suffix =
    rank === null
      ? ""
      : {
          one: "st",
          two: "nd",
          few: "rd",
          other: "th",
          zero: "th",
          many: "th",
        }[new Intl.PluralRules("en-US", { type: "ordinal" }).select(rank)];
  return `${rank === null ? row.statusLabel : `${rank}${suffix}`} · ${row.points} pts`;
}

export function formula1SessionCalendar(
  season: number,
  meeting: Pick<Formula1MeetingMeta, "key" | "name" | "sessions">,
  now: Date,
) {
  const stamp = (value: string) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Isaac Vazquez//Race Sessions//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const session of meeting.sessions) {
    if (
      !Number.isFinite(Date.parse(session.startAt)) ||
      !Number.isFinite(Date.parse(session.endAt)) ||
      Date.parse(session.startAt) <= now.getTime() ||
      Date.parse(session.endAt) <= Date.parse(session.startAt)
    )
      continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:f1-${season}-${encodeURIComponent(meeting.key)}-${encodeURIComponent(session.key)}@isaacvazquez.com`,
      `DTSTAMP:${stamp(now.toISOString())}`,
      `DTSTART:${stamp(session.startAt)}`,
      `DTEND:${stamp(session.endAt)}`,
      `SUMMARY:${escapeCalendarText(`${meeting.name} · ${session.name}`)}`,
      "DESCRIPTION:Published session schedule. Check for changes before the weekend.",
      "END:VEVENT",
    );
  }
  return (
    [...lines, "END:VCALENDAR"].map(foldCalendarLine).join("\r\n") + "\r\n"
  );
}
