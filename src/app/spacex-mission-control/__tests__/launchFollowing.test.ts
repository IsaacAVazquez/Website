import {
  launchCalendar,
  launchReading,
  parseLaunchReadings,
  scheduleChange,
} from "../launchFollowing";
import type { MissionLaunchCard } from "@/types/spacex";

const launch = {
  id: "launch",
  name: "Test, mission; one\nNew line",
  dateUtc: "2026-10-27T10:00:00Z",
  hasExactTime: true,
  upcoming: true,
  tbd: false,
  net: false,
  isStaleSchedule: false,
  success: null,
  datePrecision: "hour",
} as MissionLaunchCard;
it("only exports precise future times with stable ids and escaped titles", () => {
  const now = new Date("2026-10-25T00:00:00Z");
  const calendar = launchCalendar(
    [
      launch,
      { ...launch, id: "tbd", tbd: true },
      { ...launch, id: "net", net: true },
      { ...launch, id: "past", upcoming: false },
      { ...launch, id: "stale", isStaleSchedule: true },
    ],
    now,
  );
  expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(calendar).toContain("DTSTART:20261027T100000Z");
  expect(calendar).toContain("SUMMARY:Test\\, mission\\; one\\nNew line");
  expect(calendar).toContain("UID:launch-launch@isaacvazquez.com");
});
it("detects precision, time, and outcome changes, without exporting invalid dates", () => {
  const before = launchReading(launch, "2026-10-24T00:00:00Z");
  const after = launchReading({ ...launch, tbd: true }, "2026-10-25T00:00:00Z");
  expect(scheduleChange(after, before)).toBe(true);
  expect(
    parseLaunchReadings(
      JSON.stringify([before, { ...after, sourceAt: "bad" }]),
    ),
  ).toEqual([before]);
  expect(
    launchCalendar([{ ...launch, dateUtc: "bad" }], new Date("2026-10-25")),
  ).not.toContain("BEGIN:VEVENT");
});
