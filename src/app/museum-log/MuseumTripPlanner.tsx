"use client";

import { useMemo, useState } from "react";
import {
  useLocalStorageString,
  useLocalStoragePersistenceStatus,
} from "@/hooks/useLocalStorageString";
import {
  TRAVEL_PLANNER_STORAGE_KEY,
  loadTrips,
  parseTrips,
  saveTrips,
} from "@/lib/travelPlanner";
import type { Museum } from "@/types/museum";
import {
  museumExhibitsDuring,
  addMuseumToTrip,
  isMuseumTripDate,
} from "./museumTrips";
import { formatDate } from "./museum-log-helpers";

export function MuseumTripPlanner({
  museums,
  onOpenMuseum,
}: {
  museums: Museum[];
  onOpenMuseum: (slug: string) => void;
}) {
  const raw = useLocalStorageString(TRAVEL_PLANNER_STORAGE_KEY, "[]");
  const trips = useMemo(() => parseTrips(raw), [raw]);
  const persistence = useLocalStoragePersistenceStatus(
    TRAVEL_PLANNER_STORAGE_KEY,
  );
  const [tripId, setTripId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);
  const trip = trips.find((item) => item.id === tripId);
  const from = trip?.startDate ?? start;
  const through = trip?.endDate ?? end;
  const day = visitDate >= from && visitDate <= through ? visitDate : from;
  const valid =
    isMuseumTripDate(from) && isMuseumTripDate(through) && from <= through;
  const matches = valid
    ? museums
        .filter((m) =>
          `${m.name} ${m.city}`.toLowerCase().includes(query.toLowerCase()),
        )
        .map((museum) => ({
          museum,
          exhibits: museumExhibitsDuring(museum, from, through),
        }))
        .filter((item) => item.exhibits.length > 0)
    : [];
  function add(museum: Museum) {
    const latest = loadTrips();
    const current = latest.find((item) => item.id === tripId);
    if (
      !current ||
      !isMuseumTripDate(day) ||
      day < current.startDate ||
      day > current.endDate
    ) {
      setMessage(
        "The trip changed. Choose a trip and a date within its saved dates.",
      );
      return;
    }
    const updated = addMuseumToTrip(current, museum, day);
    if (museumExhibitsDuring(museum, day, day).length === 0) {
      setMessage(
        "None of this museum’s listed exhibitions are open on that date. Choose a date when one is open.",
      );
      return;
    }
    if (updated === current) {
      setMessage("This museum is already in the trip on that date.");
      return;
    }
    saveTrips(latest.map((item) => (item.id === tripId ? updated : item)));
    setMessage(
      `Added ${museum.name} to ${current.name} on ${formatDate(day)}.`,
    );
  }
  return (
    <section className="mlog-trip">
      <button
        type="button"
        className="mlog-trip-toggle"
        aria-expanded={expanded}
        aria-controls={expanded ? "museum-trip-fields" : undefined}
        onClick={() => setExpanded((value) => !value)}
      >
        <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
        <span>Find exhibitions during a trip</span>
      </button>
      {expanded && (
        <div id="museum-trip-fields" className="mlog-trip-body">
          <p className="mlog-meta">
            This only searches the exhibitions I’ve listed with published
            dates, so a museum missing here may still have a show on. Check the
            museum’s calendar before booking.
          </p>
          <div className="mlog-trip-fields">
            <label>
              Saved trip
              <select
                className="c97-field"
                value={tripId}
                onChange={(e) => {
                  setTripId(e.target.value);
                  setMessage("");
                  setVisitDate("");
                }}
              >
                <option value="">Custom dates</option>
                {trips.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.destination}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trip start date
              <input
                className="c97-field"
                type="date"
                disabled={Boolean(trip)}
                value={from}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Trip end date
              <input
                className="c97-field"
                type="date"
                min={from || undefined}
                disabled={Boolean(trip)}
                value={through}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <label>
              City or museum
              <input
                className="c97-field"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {trip && (
              <label>
                Museum visit date
                <input
                  className="c97-field"
                  type="date"
                  min={from}
                  max={through}
                  value={day}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              </label>
            )}
          </div>
          {!trip && (
            <p className="mlog-meta">
              Create a trip in <a href="/travel">Travel Planner</a> to add a
              museum to its itinerary.
            </p>
          )}
          {!valid ? (
            <p>
              Choose a valid start and end date to see matching exhibitions.
            </p>
          ) : matches.length === 0 ? (
            <p>None of the listed exhibitions match these dates and this search.</p>
          ) : (
            <ul className="mlog-trip-results">
              {matches.map(({ museum, exhibits }) => (
                <li key={museum.id}>
                  <div>
                    <button
                      className="c97-btn-ghost"
                      type="button"
                      onClick={() => onOpenMuseum(museum.slug)}
                    >
                      {museum.name}
                    </button>
                    <p className="mlog-meta">{museum.city}</p>
                    {exhibits.map((exhibit) => (
                      <p className="mlog-small" key={exhibit.id}>
                        {exhibit.title} · {formatDate(exhibit.startDate)} to{" "}
                        {exhibit.endDate
                          ? formatDate(exhibit.endDate)
                          : "ongoing"}
                      </p>
                    ))}
                  </div>
                  {trip && (
                    <button
                      type="button"
                      className="c97-btn-ghost"
                      onClick={() => add(museum)}
                    >
                      Add to trip
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {message && (
            <p role="status" className="mlog-meta">
              {message}
            </p>
          )}
          {persistence === "memory-only" && (
            <p role="status" className="mlog-meta">
              Trip changes last only while this tab is open because browser
              storage is unavailable.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
