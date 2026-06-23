import { act, renderHook } from "@testing-library/react";
import {
  TRAVEL_PLANNER_STORAGE_KEY,
  parseTrips,
} from "@/lib/travelPlanner";
import { useTravelPlanner } from "../useTravelPlanner";

function readStored() {
  return parseTrips(window.localStorage.getItem(TRAVEL_PLANNER_STORAGE_KEY));
}

describe("useTravelPlanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty with no active trip", () => {
    const { result } = renderHook(() => useTravelPlanner());

    expect(result.current.trips).toHaveLength(0);
    expect(result.current.activeTrip).toBeNull();
    expect(result.current.activeTripId).toBeNull();
    expect(result.current.summary).toBeNull();
  });

  it("adds a trip, persists it, and makes it active", () => {
    const { result } = renderHook(() => useTravelPlanner());

    let created: ReturnType<typeof result.current.addTrip> | undefined;
    act(() => {
      created = result.current.addTrip({
        name: "Italy Adventure",
        destination: "Rome",
        startDate: "2026-09-01",
        endDate: "2026-09-10",
      });
    });

    expect(created?.id).toEqual(expect.any(String));
    expect(result.current.trips).toHaveLength(1);
    expect(result.current.activeTripId).toBe(created?.id);
    expect(result.current.activeTrip?.name).toBe("Italy Adventure");
    expect(result.current.activeTrip?.destination).toBe("Rome");
    expect(result.current.summary).not.toBeNull();

    // Persisted to localStorage under the storage key.
    const stored = readStored();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(created?.id);
    expect(stored[0].name).toBe("Italy Adventure");
  });

  it("updates trip fields and keeps prior valid dates when given bad input", () => {
    const { result } = renderHook(() => useTravelPlanner());

    let tripId = "";
    act(() => {
      tripId = result.current.addTrip({
        name: "Original",
        destination: "Lisbon",
        startDate: "2026-05-01",
        endDate: "2026-05-05",
      }).id;
    });

    act(() => {
      result.current.updateTripFields(tripId, {
        name: "Renamed Trip",
        destination: "Porto",
        notes: "Bring a jacket",
        budget: 1200,
        startDate: "not-a-date",
      });
    });

    const trip = result.current.activeTrip;
    expect(trip?.name).toBe("Renamed Trip");
    expect(trip?.destination).toBe("Porto");
    expect(trip?.notes).toBe("Bring a jacket");
    expect(trip?.budget).toBe(1200);
    // Bad date input is ignored; previous valid date is preserved.
    expect(trip?.startDate).toBe("2026-05-01");

    expect(readStored()[0].name).toBe("Renamed Trip");
  });

  it("adds, toggles, updates, and removes itinerary activities", () => {
    const { result } = renderHook(() => useTravelPlanner());

    let tripId = "";
    act(() => {
      tripId = result.current.addTrip({
        name: "City Break",
        destination: "Paris",
        startDate: "2026-07-01",
        endDate: "2026-07-03",
      }).id;
    });

    act(() => {
      result.current.addActivity(tripId, {
        date: "2026-07-01",
        time: "09:00",
        endTime: "10:30",
        title: "Louvre",
        location: "Rue de Rivoli",
        category: "sight",
        notes: "Buy tickets ahead",
      });
    });

    expect(result.current.activeTrip?.activities).toHaveLength(1);
    const activity = result.current.activeTrip!.activities[0];
    expect(activity.id).toEqual(expect.any(String));
    expect(activity.title).toBe("Louvre");
    expect(activity.completed).toBe(false);
    expect(readStored()[0].activities).toHaveLength(1);

    // Toggle completion.
    act(() => {
      result.current.toggleActivity(tripId, activity.id);
    });
    expect(result.current.activeTrip?.activities[0].completed).toBe(true);
    expect(readStored()[0].activities[0].completed).toBe(true);

    // Update the activity.
    act(() => {
      result.current.updateActivity(tripId, activity.id, {
        date: "2026-07-02",
        time: "14:00",
        endTime: "15:00",
        title: "Eiffel Tower",
        location: "Champ de Mars",
        category: "sight",
        notes: "Sunset view",
      });
    });
    const updated = result.current.activeTrip!.activities[0];
    expect(updated.title).toBe("Eiffel Tower");
    expect(updated.date).toBe("2026-07-02");
    expect(readStored()[0].activities[0].title).toBe("Eiffel Tower");

    // Remove it.
    act(() => {
      result.current.removeActivity(tripId, activity.id);
    });
    expect(result.current.activeTrip?.activities).toHaveLength(0);
    expect(readStored()[0].activities).toHaveLength(0);
  });

  it("adds, updates, and removes journal entries", () => {
    const { result } = renderHook(() => useTravelPlanner());

    let tripId = "";
    act(() => {
      tripId = result.current.addTrip({
        name: "Road Trip",
        destination: "Big Sur",
        startDate: "2026-08-01",
        endDate: "2026-08-04",
      }).id;
    });

    act(() => {
      result.current.addJournal(tripId, {
        date: "2026-08-01",
        title: "Day one",
        body: "Drove the coast",
        mood: "amazing",
      });
    });

    expect(result.current.activeTrip?.journal).toHaveLength(1);
    const entry = result.current.activeTrip!.journal[0];
    expect(entry.id).toEqual(expect.any(String));
    expect(entry.title).toBe("Day one");
    expect(entry.mood).toBe("amazing");
    expect(result.current.summary?.journalCount).toBe(1);
    expect(readStored()[0].journal).toHaveLength(1);

    act(() => {
      result.current.updateJournal(tripId, entry.id, {
        date: "2026-08-02",
        title: "Day two",
        body: "Hiked the trails",
        mood: "good",
      });
    });
    const updated = result.current.activeTrip!.journal[0];
    expect(updated.title).toBe("Day two");
    expect(updated.mood).toBe("good");
    expect(updated.date).toBe("2026-08-02");
    expect(readStored()[0].journal[0].title).toBe("Day two");

    act(() => {
      result.current.removeJournal(tripId, entry.id);
    });
    expect(result.current.activeTrip?.journal).toHaveLength(0);
    expect(readStored()[0].journal).toHaveLength(0);
  });

  it("selects an active trip among several and falls back after deletion", () => {
    const { result } = renderHook(() => useTravelPlanner());

    let firstId = "";
    let secondId = "";
    act(() => {
      firstId = result.current.addTrip({
        name: "Trip A",
        destination: "Tokyo",
        startDate: "2026-03-01",
        endDate: "2026-03-05",
      }).id;
    });
    act(() => {
      secondId = result.current.addTrip({
        name: "Trip B",
        destination: "Kyoto",
        startDate: "2026-04-01",
        endDate: "2026-04-05",
      }).id;
    });

    expect(result.current.trips).toHaveLength(2);
    // Adding sets the new trip active.
    expect(result.current.activeTripId).toBe(secondId);

    act(() => {
      result.current.selectTrip(firstId);
    });
    expect(result.current.activeTripId).toBe(firstId);
    expect(result.current.activeTrip?.name).toBe("Trip A");

    // Delete the active trip; selection falls back to a remaining trip.
    act(() => {
      result.current.removeTrip(firstId);
    });
    expect(result.current.trips).toHaveLength(1);
    expect(result.current.activeTripId).toBe(secondId);
    expect(readStored()).toHaveLength(1);
    expect(readStored()[0].id).toBe(secondId);
  });

  it("syncs from a cross-tab storage event", () => {
    const { result } = renderHook(() => useTravelPlanner());

    expect(result.current.trips).toHaveLength(0);

    const externalTrips = [
      {
        id: "trip-external",
        name: "External Trip",
        destination: "Oslo",
        startDate: "2026-10-01",
        endDate: "2026-10-04",
        notes: "",
        budget: 0,
        activities: [],
        journal: [],
      },
    ];

    act(() => {
      window.localStorage.setItem(
        TRAVEL_PLANNER_STORAGE_KEY,
        JSON.stringify(externalTrips)
      );
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: TRAVEL_PLANNER_STORAGE_KEY,
          newValue: JSON.stringify(externalTrips),
        })
      );
    });

    expect(result.current.trips).toHaveLength(1);
    expect(result.current.activeTrip?.name).toBe("External Trip");
  });
});
