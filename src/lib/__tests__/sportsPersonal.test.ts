import {
  observeSportsSnapshot,
  parseSportsHistory,
  sportsCalendar,
  standingsChanges,
} from "../sportsPersonal";

const first = {
  season: "2026",
  sourceAt: "2026-10-20T12:00:00Z",
  teams: [
    {
      id: "1",
      name: "Example",
      conference: "East",
      rank: 4,
      wins: 2,
      losses: 1,
      ties: 0,
    },
  ],
};
it("keeps bounded observations, ignores older sources and separates seasons", () => {
  expect(parseSportsHistory("null")).toEqual([]);
  const history = observeSportsSnapshot([], first);
  expect(observeSportsSnapshot(history, first)).toBe(history);
  expect(
    observeSportsSnapshot(history, {
      ...first,
      sourceAt: "2026-10-19T00:00:00Z",
    }),
  ).toBe(history);
  expect(standingsChanges(first, { ...first, season: "2025" })).toEqual([]);
});
it("reports measured changes in rank and record", () => {
  const current = {
    ...first,
    sourceAt: "2026-10-22T12:00:00Z",
    teams: [{ ...first.teams[0], rank: 2, wins: 4 }],
  };
  expect(standingsChanges(current, first)[0]).toMatchObject({
    rankChange: 2,
    winsChange: 2,
    lossesChange: 0,
  });
});
it("exports real UTC starts, omits unconfirmed dates, and escapes calendar text", () => {
  const calendar = sportsCalendar(
    "nba",
    "Example",
    [
      {
        id: "a",
        utcDate: "2026-11-01T20:00:00Z",
        home: "A, B",
        away: "C\nD",
        status: "SCHEDULED",
      },
      { id: "b", utcDate: "TBD", home: "A", away: "B", status: "SCHEDULED" },
    ],
    new Date("2026-10-23T12:00:00Z"),
  );
  expect(calendar).toContain("DTSTART:20261101T200000Z");
  expect(calendar).toContain("A\\, B");
  expect(calendar).toContain("C\\nD");
  expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(1);
});
