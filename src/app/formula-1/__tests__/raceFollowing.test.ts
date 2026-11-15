import {
  formula1SessionCalendar,
  formula1RaceRows,
  constructorFollowId,
  raceReading,
} from "../raceFollowing";
import type { Formula1Snapshot } from "@/types/formula1";

it("exports only future sessions with known start and end times and stable ids", () => {
  const session = {
    key: "s1",
    name: "Race, final",
    type: "Race",
    startAt: "2026-11-01T20:00:00Z",
    endAt: "2026-11-01T22:00:00Z",
  };
  const meeting = {
    key: "m1",
    name: "Test GP",
    sessions: [
      session,
      { ...session, key: "bad", endAt: "unknown" },
      { ...session, key: "past", startAt: "2026-10-01T10:00:00Z" },
    ],
  };
  const calendar = formula1SessionCalendar(
    2026,
    meeting,
    new Date("2026-10-26T00:00:00Z"),
  );
  expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(calendar).toContain("UID:f1-2026-m1-s1@isaacvazquez.com");
  expect(calendar).toContain("Race\\, final");
  expect(calendar).toContain("DTEND:20261101T220000Z");
});

it("keeps unpublished and absent driver results unknown and sums published constructor points", () => {
  const snapshot = {
    meetings: [
      {
        key: "1",
        name: "One",
        startAt: "2026-10-01T00:00:00Z",
        status: "completed",
        resultPublished: true,
        classification: [
          {
            driverNumber: 1,
            teamName: "Example Team",
            position: 1,
            points: 25,
            statusLabel: "Classified",
          },
          {
            driverNumber: 2,
            teamName: "Example Team",
            position: null,
            points: 0,
            statusLabel: "DNF",
          },
        ],
      },
      {
        key: "2",
        status: "completed",
        resultPublished: false,
        classification: [],
      },
    ],
  } as unknown as Formula1Snapshot;
  const rows = formula1RaceRows(snapshot);
  expect(rows).toHaveLength(1);
  expect(raceReading(rows[0], "driver-1")).toBe("1st · 25 pts");
  expect(raceReading(rows[0], "driver-2")).toBe("DNF · 0 pts");
  expect(raceReading(rows[0], "driver-99")).toBe("Unreported");
  expect(raceReading(rows[0], constructorFollowId("Example Team"))).toBe(
    "25 pts · 2 drivers",
  );
});
