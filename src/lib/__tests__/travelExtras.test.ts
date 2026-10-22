import {
  activityBudget,
  tripCalendar,
  normalizeActivityCost,
} from "../travelExtras";
import { createTrip, createActivity } from "../travelPlanner";

it("keeps unpriced activities distinct from free ones and totals integer cents", () => {
  expect(
    activityBudget([{ cost: 0.1 }, { cost: 0.2 }, { cost: 0 }, {}]),
  ).toEqual({ total: 0.3, priced: 3, unpriced: 1 });
  expect(normalizeActivityCost(-1)).toBeNull();
  expect(normalizeActivityCost(Infinity)).toBeNull();
  expect(normalizeActivityCost("12")).toBeNull();
});
it("exports all-day dates with an exclusive next-day end and escapes property injection", () => {
  const trip = createTrip({
    name: "Test",
    destination: "Paris",
    startDate: "2026-12-31",
    endDate: "2026-12-31",
  });
  trip.activities = [
    createActivity({
      date: "2026-12-31",
      time: "",
      endTime: "",
      title: "Museum\nBEGIN:VEVENT",
      location: "A,B;C",
      category: "sight",
      notes: "note",
    }),
  ];
  const file = tripCalendar(trip, new Date("2026-10-22T00:00:00Z"));
  expect(file).toContain(
    "DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101",
  );
  expect(file).toContain("SUMMARY:Museum\\nBEGIN:VEVENT");
  expect(file).toContain("LOCATION:A\\,B\\;C");
  expect(file.match(/^BEGIN:VEVENT$/gm)).toHaveLength(1);
});

it("exports floating timed events, folds Unicode by bytes, and skips invalid dates", () => {
  const trip = createTrip({ name: "Timed trip", destination: "Paris", startDate: "2026-10-22", endDate: "2026-10-22" });
  trip.activities = [createActivity({ date: "2026-10-22", time: "09:30", endTime: "10:45", title: "博物館".repeat(40), location: "Paris", category: "sight", notes: "" })];
  const file = tripCalendar(trip);
  expect(file).toContain("DTSTART:20261022T093000\r\nDTEND:20261022T104500");
  expect(file.split("\r\n").every((line) => Buffer.byteLength(line, "utf8") <= 75)).toBe(true);
  expect(file.replace(/\r\n /g, "")).toContain(`SUMMARY:${trip.activities[0].title}`);
  trip.activities[0].date = "2026-02-30";
  expect(tripCalendar(trip)).not.toContain("BEGIN:VEVENT");
});
