import {
  MAX_ITINERARY_DAYS,
  calculateTripSummary,
  createActivity,
  findActivityOverlaps,
  getDayKeysBetween,
  parseTrips,
} from "@/lib/travelPlanner";
import type { Trip, TripActivity } from "@/types/travel";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    name: "Lisbon long weekend",
    destination: "Lisbon, Portugal",
    startDate: "2026-06-12",
    endDate: "2026-06-14",
    notes: "",
    budget: 0,
    activities: [],
    journal: [],
    ...overrides,
  };
}

function makeActivity(overrides: Partial<TripActivity> = {}): TripActivity {
  return {
    id: `act-${Math.random().toString(36).slice(2, 8)}`,
    date: "2026-06-12",
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

describe("parseTrips", () => {
  it("repairs a trip with a cleared start date instead of deleting it", () => {
    const stored = [
      {
        ...makeTrip(),
        startDate: "",
        activities: [makeActivity({ id: "act-1" })],
        journal: [
          { id: "jrn-1", date: "2026-06-12", title: "Day one", body: "Great", mood: "good" },
        ],
      },
    ];

    const trips = parseTrips(JSON.stringify(stored));

    expect(trips).toHaveLength(1);
    expect(trips[0].startDate).toBe("2026-06-14");
    expect(trips[0].endDate).toBe("2026-06-14");
    expect(trips[0].activities).toHaveLength(1);
    expect(trips[0].journal).toHaveLength(1);
  });

  it("repairs activities and journal entries with malformed dates instead of dropping them", () => {
    const stored = [
      {
        ...makeTrip(),
        activities: [makeActivity({ id: "act-1", date: "not-a-date" })],
        journal: [{ id: "jrn-1", date: "", title: "Kept", body: "", mood: "neutral" }],
      },
    ];

    const trips = parseTrips(JSON.stringify(stored));

    expect(trips[0].activities).toHaveLength(1);
    expect(trips[0].activities[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(trips[0].journal).toHaveLength(1);
    expect(trips[0].journal[0].title).toBe("Kept");
  });

  it("falls back to a placeholder name when the stored name is blank", () => {
    const trips = parseTrips(JSON.stringify([{ ...makeTrip(), name: "   " }]));
    expect(trips[0].name).toBe("Untitled trip");
  });

  it("keeps trailing whitespace out of stored fields without losing the words", () => {
    const trips = parseTrips(JSON.stringify([{ ...makeTrip(), name: " Lisbon long weekend " }]));
    expect(trips[0].name).toBe("Lisbon long weekend");
  });
});

describe("findActivityOverlaps", () => {
  it("does not flag stops that merely touch", () => {
    const overlaps = findActivityOverlaps([
      makeActivity({ id: "a", time: "08:00", endTime: "09:00" }),
      makeActivity({ id: "b", time: "09:00", endTime: "10:00" }),
    ]);
    expect(overlaps.ids.size).toBe(0);
    expect(overlaps.pairCount).toBe(0);
  });

  it("flags overlapping windows and counts each pair once", () => {
    const overlaps = findActivityOverlaps([
      makeActivity({ id: "a", time: "09:00", endTime: "11:00" }),
      makeActivity({ id: "b", time: "10:00", endTime: "12:00" }),
    ]);
    expect(overlaps.ids).toEqual(new Set(["a", "b"]));
    expect(overlaps.pairCount).toBe(1);
  });

  it("flags a start-only stop scheduled across another window regardless of title order", () => {
    const point = makeActivity({ id: "point", title: "Brunch", time: "09:00" });
    const window = makeActivity({ id: "window", title: "Tour", time: "09:00", endTime: "10:00" });

    expect(findActivityOverlaps([point, window]).ids).toEqual(new Set(["point", "window"]));
    // Renaming (and therefore reordering) the stops must not change the answer.
    const renamedPoint = { ...point, title: "Zoo brunch" };
    expect(findActivityOverlaps([window, renamedPoint]).ids).toEqual(
      new Set(["point", "window"])
    );
  });

  it("does not flag a start-only stop that begins when another window ends", () => {
    const overlaps = findActivityOverlaps([
      makeActivity({ id: "a", time: "08:00", endTime: "09:00" }),
      makeActivity({ id: "b", time: "09:00" }),
    ]);
    expect(overlaps.ids.size).toBe(0);
  });

  it("flags two start-only stops at the same minute", () => {
    const overlaps = findActivityOverlaps([
      makeActivity({ id: "a", time: "09:00" }),
      makeActivity({ id: "b", time: "09:00" }),
    ]);
    expect(overlaps.ids).toEqual(new Set(["a", "b"]));
  });

  it("ignores stops on different days and stops without times", () => {
    const overlaps = findActivityOverlaps([
      makeActivity({ id: "a", date: "2026-06-12", time: "09:00", endTime: "10:00" }),
      makeActivity({ id: "b", date: "2026-06-13", time: "09:00", endTime: "10:00" }),
      makeActivity({ id: "c", date: "2026-06-12" }),
    ]);
    expect(overlaps.ids.size).toBe(0);
  });
});

describe("calculateTripSummary", () => {
  it("reports the number of overlapping pairs, not flagged stops", () => {
    const trip = makeTrip({
      activities: [
        makeActivity({ id: "a", time: "09:00", endTime: "11:00" }),
        makeActivity({ id: "b", time: "10:00", endTime: "12:00" }),
      ],
    });
    const summary = calculateTripSummary(trip, "2026-06-12");
    expect(summary.conflictCount).toBe(1);
  });

  it("caps the rendered itinerary for absurd date spans and flags the truncation", () => {
    const trip = makeTrip({ startDate: "2026-06-12", endDate: "2126-06-12" });
    const summary = calculateTripSummary(trip, "2026-06-12");
    expect(summary.dayBuckets.length).toBeLessThanOrEqual(MAX_ITINERARY_DAYS);
    expect(summary.itineraryTruncated).toBe(true);
  });

  it("does not flag normal trips as truncated", () => {
    const summary = calculateTripSummary(makeTrip(), "2026-06-12");
    expect(summary.dayBuckets).toHaveLength(3);
    expect(summary.itineraryTruncated).toBe(false);
  });
});

describe("getDayKeysBetween", () => {
  it("caps at MAX_ITINERARY_DAYS", () => {
    const keys = getDayKeysBetween("2026-01-01", "2126-01-01");
    expect(keys).toHaveLength(MAX_ITINERARY_DAYS);
  });
});

describe("createActivity", () => {
  it("drops an end time that is not after the start", () => {
    const activity = createActivity({
      date: "2026-06-12",
      time: "22:00",
      endTime: "00:30",
      title: "Late train",
      location: "",
      category: "transit",
      notes: "",
    });
    expect(activity.endTime).toBe("");
  });
});
