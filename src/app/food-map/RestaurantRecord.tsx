"use client";

import { useMemo, useState } from "react";
import {
  useLocalStorageString,
  useLocalStoragePersistenceStatus,
} from "@/hooks/useLocalStorageString";
import {
  TRAVEL_PLANNER_STORAGE_KEY,
  parseTrips,
  loadTrips,
  saveTrips,
} from "@/lib/travelPlanner";
import { addFoodToTrip, type FoodRecord } from "./foodPersonal";
import type { FoodMapPlace } from "./food-map-data";
import { FOOD_SOURCE_CHECKS } from "./foodSources";
import "@/components/project-workflows.css";

export function FoodPersonal({
  place,
  record,
  onChange,
}: {
  place: FoodMapPlace;
  record: FoodRecord;
  onChange: (patch: Partial<FoodRecord>) => void;
}) {
  const raw = useLocalStorageString(TRAVEL_PLANNER_STORAGE_KEY, "[]");
  const trips = useMemo(() => parseTrips(raw), [raw]);
  const status = useLocalStoragePersistenceStatus(TRAVEL_PLANNER_STORAGE_KEY);
  const [tripId, setTripId] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const trip = trips.find((item) => item.id === tripId);
  const day = date || trip?.startDate || "";
  const source = Object.hasOwn(FOOD_SOURCE_CHECKS, place.id)
    ? FOOD_SOURCE_CHECKS[place.id]
    : null;
  function add() {
    const latest = loadTrips();
    const current = latest.find((item) => item.id === tripId);
    if (!current) {
      setMessage(
        "Choose an existing trip. It may have changed in another tab.",
      );
      return;
    }
    const next = addFoodToTrip(current, place, day);
    if (next === current) {
      setMessage(
        "Choose a date within the trip. A restaurant already added on that date stays there once.",
      );
      return;
    }
    saveTrips(latest.map((item) => (item.id === current.id ? next : item)));
    setMessage(`Added ${place.name} to ${current.name} on ${day}.`);
  }
  return (
    <section
      className="project-workflow"
      aria-label={`Your record for ${place.name}`}
    >
      <h3>Your restaurant record</h3>
      <div className="project-workflow-actions">
        <label className="project-workflow-check">
          <input
            type="checkbox"
            checked={record.saved}
            onChange={(event) => onChange({ saved: event.target.checked })}
          />
          Saved restaurant
        </label>
        <label className="project-workflow-check">
          <input
            type="checkbox"
            checked={record.visited}
            onChange={(event) => onChange({ visited: event.target.checked })}
          />
          Visited
        </label>
      </div>
      <label>
        Personal notes
        <textarea
          className="c97-field"
          maxLength={2000}
          value={record.note}
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </label>
      <h3>Add to an itinerary</h3>
      {trips.length ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <div className="project-workflow-fields">
            <label>
              Restaurant trip
              <select
                className="c97-field"
                required
                value={tripId}
                onChange={(event) => {
                  setTripId(event.target.value);
                  setDate("");
                  setMessage("");
                }}
              >
                <option value="">Choose a trip</option>
                {trips.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.destination}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Restaurant visit date
              <input
                className="c97-field"
                required
                type="date"
                disabled={!trip}
                min={trip?.startDate}
                max={trip?.endDate}
                value={day}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <button className="c97-btn" type="submit" disabled={!trip}>
            Add restaurant to trip
          </button>
          <small>
            The stop stays unpriced until you enter its cost in Travel Planner.
          </small>
        </form>
      ) : (
        <p>
          Create a trip in <a href="/travel">Travel Planner</a> to add this
          restaurant.
        </p>
      )}
      {source ? (
        <p>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            Official source
          </a>{" "}
          checked {source.checked}. {source.note}
        </p>
      ) : (
        <p>
          This restaurant has no new source check. Confirm its location and
          opening hours before visiting.
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {status === "memory-only" && (
        <p role="status">
          Trip changes last only while this tab is open because browser storage
          is unavailable.
        </p>
      )}
    </section>
  );
}
