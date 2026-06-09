"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  TRAVEL_PLANNER_STORAGE_KEY,
  calculateTripSummary,
  createActivity,
  createJournalEntry,
  createTrip,
  loadTrips,
  parseTrips,
  saveTrips,
} from "@/lib/travelPlanner";
import type { JournalEntry, Trip, TripActivity } from "@/types/travel";

const travelListeners = new Set<() => void>();

function emit() {
  travelListeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  travelListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === TRAVEL_PLANNER_STORAGE_KEY) {
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    travelListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(TRAVEL_PLANNER_STORAGE_KEY) ?? "[]";
}

export interface NewTripInput {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export interface ActivityDraft {
  date: string;
  time: string;
  endTime: string;
  title: string;
  location: string;
  category: TripActivity["category"];
  notes: string;
}

export interface JournalDraft {
  date: string;
  title: string;
  body: string;
  mood: JournalEntry["mood"];
}

export function useTravelPlanner() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const trips = useMemo(() => parseTrips(snapshot), [snapshot]);

  const [requestedTripId, setRequestedTripId] = useState<string | null>(null);

  const activeTripId = useMemo(() => {
    if (trips.length === 0) return null;
    if (requestedTripId && trips.some((trip) => trip.id === requestedTripId)) {
      return requestedTripId;
    }
    return trips[0].id;
  }, [trips, requestedTripId]);

  const activeTrip = trips.find((trip) => trip.id === activeTripId) ?? null;
  const summary = useMemo(
    () => (activeTrip ? calculateTripSummary(activeTrip) : null),
    [activeTrip]
  );

  function commit(nextTrips: Trip[]) {
    saveTrips(nextTrips);
    emit();
  }

  function updateTrip(tripId: string, updater: (trip: Trip) => Trip) {
    const current = loadTrips();
    const next = current.map((trip) => (trip.id === tripId ? updater(trip) : trip));
    commit(next);
  }

  function addTrip(input: NewTripInput) {
    const trip = createTrip(input);
    const current = loadTrips();
    commit([...current, trip]);
    setRequestedTripId(trip.id);
    return trip;
  }

  function removeTrip(tripId: string) {
    const current = loadTrips();
    const next = current.filter((trip) => trip.id !== tripId);
    commit(next);
    if (requestedTripId === tripId) {
      setRequestedTripId(next[0]?.id ?? null);
    }
  }

  function updateTripFields(
    tripId: string,
    fields: Partial<Pick<Trip, "name" | "destination" | "startDate" | "endDate" | "notes" | "budget">>
  ) {
    updateTrip(tripId, (trip) => {
      const next: Trip = { ...trip, ...fields };
      if (next.endDate < next.startDate) next.endDate = next.startDate;
      return next;
    });
  }

  function addActivity(tripId: string, draft: ActivityDraft) {
    const activity = createActivity(draft);
    updateTrip(tripId, (trip) => ({
      ...trip,
      activities: [...trip.activities, activity],
    }));
  }

  function updateActivity(tripId: string, activityId: string, draft: ActivityDraft) {
    updateTrip(tripId, (trip) => ({
      ...trip,
      activities: trip.activities.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              ...draft,
              endTime:
                draft.time && draft.endTime && draft.endTime > draft.time
                  ? draft.endTime
                  : "",
              title: draft.title.trim() || "Untitled stop",
              location: draft.location.trim(),
              notes: draft.notes.trim(),
            }
          : activity
      ),
    }));
  }

  function toggleActivity(tripId: string, activityId: string) {
    updateTrip(tripId, (trip) => ({
      ...trip,
      activities: trip.activities.map((activity) =>
        activity.id === activityId
          ? { ...activity, completed: !activity.completed }
          : activity
      ),
    }));
  }

  function removeActivity(tripId: string, activityId: string) {
    updateTrip(tripId, (trip) => ({
      ...trip,
      activities: trip.activities.filter((activity) => activity.id !== activityId),
    }));
  }

  function addJournal(tripId: string, draft: JournalDraft) {
    const entry = createJournalEntry(draft);
    updateTrip(tripId, (trip) => ({
      ...trip,
      journal: [...trip.journal, entry],
    }));
  }

  function updateJournal(tripId: string, entryId: string, draft: JournalDraft) {
    updateTrip(tripId, (trip) => ({
      ...trip,
      journal: trip.journal.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              ...draft,
              title: draft.title.trim() || "Untitled entry",
              body: draft.body.trim(),
            }
          : entry
      ),
    }));
  }

  function removeJournal(tripId: string, entryId: string) {
    updateTrip(tripId, (trip) => ({
      ...trip,
      journal: trip.journal.filter((entry) => entry.id !== entryId),
    }));
  }

  return {
    trips,
    activeTrip,
    activeTripId,
    summary,
    selectTrip: setRequestedTripId,
    addTrip,
    removeTrip,
    updateTripFields,
    addActivity,
    updateActivity,
    toggleActivity,
    removeActivity,
    addJournal,
    updateJournal,
    removeJournal,
  };
}
