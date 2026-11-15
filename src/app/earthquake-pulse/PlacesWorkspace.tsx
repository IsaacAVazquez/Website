"use client";

import { useState } from "react";
import { ProjectWorkspace, StorageNotice } from "@/components/ProjectWorkspace";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { prefixedId } from "@/lib/utils";
import { formatUpdatedAt } from "@/lib/date-formatters";
import type { EarthquakeSummary } from "@/types/earthquake";
import { nearbyQuakes, parsePlaces, SAVED_PLACES_KEY } from "./savedPlaces";

export function SavedPlaces({
  summary,
  onSelect,
}: {
  summary: EarthquakeSummary;
  onSelect: (id: string) => void;
}) {
  const store = useBrowserRecord(SAVED_PLACES_KEY, parsePlaces);
  const [activeId, setActiveId] = useState("");
  const [message, setMessage] = useState("");
  const active =
    store.value.find((place) => place.id === activeId) ?? store.value[0];
  const quakes = [
    ...new Map(
      [
        ...Object.values(summary.quakeDetails),
        ...summary.recent,
        ...summary.significant,
      ].map((quake) => [quake.id, quake]),
    ).values(),
  ];
  const nearby = active ? nearbyQuakes(quakes, active) : [];
  return (
    <ProjectWorkspace
      id="saved-places"
      title="Earthquakes near your places"
      description="Save coordinates, a radius, and a minimum magnitude in this browser. Coordinates can be copied from a map."
    >
      <form
        className="pw-fields"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (key: string) => {
            const value = String(data.get(key) ?? "").trim();
            return value ? Number(value) : NaN;
          };
          const place = parsePlaces(
            JSON.stringify([
              {
                id: prefixedId("place"),
                name: data.get("name"),
                latitude: number("latitude"),
                longitude: number("longitude"),
                radiusKm: number("radius"),
                minMagnitude: number("magnitude"),
              },
            ]),
          )[0];
          if (!place) {
            setMessage(
              "Enter a name, valid coordinates, a radius from 1 to 5,000 km, and a magnitude from 0 to 10.",
            );
            return;
          }
          let saved = false;
          store.update((latest) => {
            if (latest.length >= 20) return latest;
            saved = true;
            return [...latest, place];
          });
          if (saved) {
            setActiveId(place.id);
            setMessage(`Saved ${place.name}.`);
            event.currentTarget.reset();
          } else setMessage("Remove a place to make room. The limit is 20.");
        }}
      >
        <label className="pw-field">
          Place name
          <input name="name" maxLength={80} required />
        </label>
        <label className="pw-field">
          Latitude
          <input
            name="latitude"
            type="number"
            step="any"
            min={-90}
            max={90}
            required
          />
        </label>
        <label className="pw-field">
          Longitude
          <input
            name="longitude"
            type="number"
            step="any"
            min={-180}
            max={180}
            required
          />
        </label>
        <label className="pw-field">
          Radius in km
          <input
            name="radius"
            type="number"
            min={1}
            max={5000}
            defaultValue={100}
            required
          />
        </label>
        <label className="pw-field">
          Minimum magnitude
          <input
            name="magnitude"
            type="number"
            step="0.1"
            min={0}
            max={10}
            defaultValue={2.5}
            required
          />
        </label>
        <button className="pw-primary" disabled={store.value.length >= 20}>
          Save place
        </button>
      </form>
      {store.value.length ? (
        <div className="pw-actions">
          <label className="pw-field">
            Saved place
            <select
              aria-label="Saved place"
              value={active?.id ?? ""}
              onChange={(event) => setActiveId(event.target.value)}
            >
              {store.value.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              if (active)
                store.update((latest) =>
                  latest.filter((place) => place.id !== active.id),
                );
            }}
          >
            Remove place
          </button>
        </div>
      ) : null}
      {active ? (
        <>
          <p className="pw-note">
            {active.name} · {active.latitude}, {active.longitude} · within{" "}
            {active.radiusKm} km · M{active.minMagnitude} and up. Feed{" "}
            {formatUpdatedAt(summary.feedUpdated ?? summary.generatedAt)}
            {summary.feedStatus === "stale-fallback" ? " · saved fallback" : ""}
            .
          </p>
          <p className="pw-note">
            These matches come from the dashboard&apos;s recent and significant
            event lists. Those lists omit other local events and magnitudes, so
            zero matches does not mean no earthquakes occurred.
          </p>
          <ul className="pw-list">
            {nearby.map(({ quake, distance }) => (
              <li key={quake.id}>
                <button type="button" onClick={() => onSelect(quake.id)}>
                  M{quake.magnitude.toFixed(1)} · {quake.place} ·{" "}
                  {distance.toFixed(1)} km
                </button>
                <span className="pw-note">{formatUpdatedAt(quake.time)}</span>
              </li>
            ))}
          </ul>
          {!nearby.length ? (
            <p className="pw-note">
              No events in the supplied lists match this place and filter.
            </p>
          ) : null}
        </>
      ) : (
        <p className="pw-note">Save a place to see matching events here.</p>
      )}
      <p role="status" className="pw-note">
        {message}
      </p>
      <StorageNotice status={store.status} />
    </ProjectWorkspace>
  );
}
