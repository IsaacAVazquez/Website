"use client";

import { commuteAdvisories, type Commute } from "./commute";
import type { TransitSummary, TransitStation } from "@/types/bayAreaTransit";

export function CommutePanel({
  value,
  update,
  selected,
  summary,
  onSelect,
  open,
  onOpen,
  memoryOnly,
}: {
  value: Commute;
  update: (edit: (latest: Commute) => Commute) => void;
  selected: TransitStation | null;
  summary: TransitSummary;
  onSelect: (id: string) => void;
  open: boolean;
  onOpen: (value: boolean) => void;
  memoryOnly: boolean;
}) {
  const stations = summary.stations;
  const alerts = commuteAdvisories(
    summary.advisories,
    [selected?.abbr ?? "", value.to],
    stations.map((station) => station.abbr),
  );
  return (
    <section className="bt-commute" aria-labelledby="bt-commute-heading">
      <h2 id="bt-commute-heading">Your stations</h2>
      <div className="bt-commute-actions">
        {selected ? (
          <button
            type="button"
            aria-pressed={value.saved.includes(selected.id)}
            onClick={() =>
              update((latest) => ({
                ...latest,
                saved: latest.saved.includes(selected.id)
                  ? latest.saved.filter((id) => id !== selected.id)
                  : [...latest.saved, selected.id].slice(0, 20),
              }))
            }
          >
            {value.saved.includes(selected.id) ? "Unsave" : "Save"}{" "}
            {selected.name}
          </button>
        ) : null}
        {value.saved.map((id) => (
          <button type="button" key={id} onClick={() => onSelect(id)}>
            {stations.find((station) => station.id === id)?.name}
          </button>
        ))}
      </div>
      <p>
        {value.saved.length
          ? "Saved in this browser. Choose a station to open its board."
          : "Save a station to return to its departures quickly."}
      </p>
      {memoryOnly ? (
        <p role="status">
          Browser storage is unavailable. These preferences only last in this
          tab.
        </p>
      ) : null}
      <label className="bt-commute-toggle">
        <input
          type="checkbox"
          checked={open}
          onChange={(event) => onOpen(event.target.checked)}
        />{" "}
        Commute view
      </label>
      {open ? (
        <>
          <div className="bt-commute-fields">
            {(["from", "to"] as const).map((field) => (
              <label key={field}>
                {field === "from" ? "From station" : "To station"}
                <select
                  value={value[field]}
                  onChange={(event) =>
                    update((latest) => ({
                      ...latest,
                      [field]: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose a station</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Train direction
              <select
                value={value.direction}
                onChange={(event) => {
                  const direction =
                    event.target.value === "North" ||
                    event.target.value === "South"
                      ? event.target.value
                      : "";
                  update((latest) => ({ ...latest, direction }));
                }}
              >
                <option value="">All directions</option>
                <option value="North">North</option>
                <option value="South">South</option>
              </select>
            </label>
            <button
              type="button"
              disabled={!value.from}
              onClick={() => onSelect(value.from)}
            >
              Open commute departures
            </button>
            <button
              type="button"
              disabled={!value.from || !value.to || value.from === value.to}
              onClick={() => {
                const reverse = value.to;
                update((latest) => ({
                  ...latest,
                  from: latest.to,
                  to: latest.from,
                  direction: "",
                }));
                onSelect(reverse);
              }}
            >
              Reverse commute
            </button>
          </div>
          <p>
            Direction filters BART&apos;s reported North or South trains at the
            selected station. This view does not calculate a route or guarantee
            that a train serves your destination.
          </p>
          <h3>Alerts for your commute</h3>
          {summary.sectionStatus?.advisories !== "fresh" ? (
            <p>
              Fresh advisory data is unavailable. Check the feed status above
              before travelling.
            </p>
          ) : null}
          {alerts.length ? (
            <ul>
              {alerts.map((alert) => (
                <li key={alert.id}>{alert.description}</li>
              ))}
            </ul>
          ) : (
            <p>
              No endpoint or system advisories appear in this copy of the feed.
            </p>
          )}
          {summary.elevator.length ? (
            <>
              <p>
                Elevator notices are published without structured station
                identifiers, so all notices are shown.
              </p>
              <ul>
                {summary.elevator.map((alert) => (
                  <li key={alert.id}>{alert.description}</li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
