import {
  MAX_ITINERARY_DAYS,
  calculateTripSummary,
  createActivity,
  createTrip,
} from "@/lib/travelPlanner";
import type { Trip, TripActivity, TripDayBucket } from "@/types/travel";
import { boardingPass, itineraryColumns, timelineTicks } from "../itinerary";

function bucket(date: string, activities: TripActivity[]): TripDayBucket {
  return {
    date,
    activities,
    completed: activities.filter((activity) => activity.completed).length,
    conflictIds: [],
  };
}

function activity(overrides: Partial<TripActivity> & { id: string }): TripActivity {
  return {
    date: "2026-10-01",
    time: "",
    endTime: "",
    title: "Stop",
    location: "",
    category: "activity",
    notes: "",
    completed: false,
    ...overrides,
  };
}

describe("itineraryColumns", () => {
  it("returns an empty column for a day with no stops", () => {
    const cols = itineraryColumns([bucket("2026-10-01", [])], []);
    expect(cols).toHaveLength(1);
    expect(cols[0]).toMatchObject({ dateKey: "2026-10-01", stops: [], untimed: [] });
  });

  it("places a one-day trip's single timed stop", () => {
    const a = activity({ id: "a1", time: "09:00", endTime: "10:00" });
    const cols = itineraryColumns([bucket("2026-10-01", [a])], []);
    expect(cols).toHaveLength(1);
    expect(cols[0].stops).toHaveLength(1);
    expect(cols[0].stops[0].id).toBe("a1");
    expect(cols[0].stops[0].top).toBeGreaterThanOrEqual(0);
    expect(cols[0].stops[0].top).toBeLessThanOrEqual(1);
  });

  it("flags stops present in the conflict set and leaves others clear", () => {
    const a = activity({ id: "a1", time: "09:00", endTime: "10:00" });
    const b = activity({ id: "a2", time: "09:30", endTime: "10:30" });
    const c = activity({ id: "a3", time: "14:00", endTime: "15:00" });
    const cols = itineraryColumns([bucket("2026-10-01", [a, b, c])], ["a1", "a2"]);
    const byId = Object.fromEntries(cols[0].stops.map((s) => [s.id, s]));
    expect(byId.a1.conflict).toBe(true);
    expect(byId.a2.conflict).toBe(true);
    expect(byId.a3.conflict).toBe(false);
  });

  it("puts stops with no time in untimed, not in the placed stops", () => {
    const timed = activity({ id: "a1", time: "09:00" });
    const untimed = activity({ id: "a2", time: "" });
    const cols = itineraryColumns([bucket("2026-10-01", [timed, untimed])], []);
    expect(cols[0].stops.map((s) => s.id)).toEqual(["a1"]);
    expect(cols[0].untimed.map((s) => s.id)).toEqual(["a2"]);
  });

  it("does not let a late outlier stop squash the rest of the day into a sliver", () => {
    const morning = activity({ id: "a1", time: "09:00", endTime: "11:00" });
    const outlier = activity({ id: "a2", time: "23:30" });
    const cols = itineraryColumns([bucket("2026-10-01", [morning, outlier])], []);
    const byId = Object.fromEntries(cols[0].stops.map((s) => [s.id, s]));
    // A 2-hour morning block should still read as a meaningfully sized band,
    // not a hairline, even though a late-night stop is also on the page.
    expect(byId.a1.height).toBeGreaterThan(0.05);
    // The outlier sits near the bottom of the shared window instead of
    // stretching that window and squashing everything above it.
    expect(byId.a2.top).toBeGreaterThan(0.9);
  });

  it("keeps the column count in step with the buckets it's given", () => {
    const buckets = Array.from({ length: MAX_ITINERARY_DAYS }, (_, i) =>
      bucket(`2026-01-${String((i % 28) + 1).padStart(2, "0")}`, [])
    );
    expect(itineraryColumns(buckets, [])).toHaveLength(MAX_ITINERARY_DAYS);
  });
});

describe("boardingPass", () => {
  function tripWith(startDate: string, endDate: string): Trip {
    return createTrip({
      name: "Lisbon",
      destination: "Lisbon, Portugal",
      startDate,
      endDate,
    });
  }

  it("counts down to a trip that hasn't started", () => {
    const trip = tripWith("2026-11-01", "2026-11-05");
    const summary = calculateTripSummary(trip, "2026-10-20");
    const pass = boardingPass(trip, summary, "2026-10-20");
    expect(pass.destination).toBe("Lisbon, Portugal");
    expect(pass.countdown).toMatch(/12 days? to go/);
  });

  it("reads as day N of M while the trip is active", () => {
    const trip = tripWith("2026-11-01", "2026-11-05");
    const summary = calculateTripSummary(trip, "2026-11-03");
    const pass = boardingPass(trip, summary, "2026-11-03");
    expect(pass.countdown).toBe("Day 3 of 5");
  });

  it("reads as days back once the trip has ended", () => {
    const trip = tripWith("2026-11-01", "2026-11-05");
    const summary = calculateTripSummary(trip, "2026-11-09");
    const pass = boardingPass(trip, summary, "2026-11-09");
    expect(pass.countdown).toMatch(/Back 4 days? ago/);
  });

  it("reports stops done against the trip total", () => {
    const base = tripWith("2026-11-01", "2026-11-02");
    const sight = { ...createActivity({
      date: "2026-11-01",
      time: "09:00",
      endTime: "",
      title: "Museum",
      location: "",
      category: "sight",
      notes: "",
    }), completed: true };
    const food = createActivity({
      date: "2026-11-01",
      time: "",
      endTime: "",
      title: "Dinner",
      location: "",
      category: "food",
      notes: "",
    });
    const trip: Trip = { ...base, activities: [sight, food] };
    const summary = calculateTripSummary(trip, "2026-11-01");
    const pass = boardingPass(trip, summary, "2026-11-01");
    expect(pass.stopsDone).toBe(1);
    expect(pass.stopsTotal).toBe(2);
  });
});

describe("timelineTicks", () => {
  it("marks 6am, noon, and 6pm on the default waking-day window", () => {
    const ticks = timelineTicks([bucket("2026-10-01", [activity({ id: "a", time: "09:00" })])]);
    expect(ticks.map((tick) => tick.label)).toEqual(["6 AM", "Noon", "6 PM"]);
    expect(ticks[0].top).toBeCloseTo(0);
    expect(ticks[1].top).toBeCloseTo(1 / 3);
    expect(ticks[2].top).toBeCloseTo(2 / 3);
  });

  it("follows the window when an early stop widens it", () => {
    const ticks = timelineTicks([bucket("2026-10-01", [activity({ id: "a", time: "03:30" })])]);
    expect(ticks[0].label).toBe("6 AM");
    expect(ticks[0].top).toBeGreaterThan(0);
  });
});
