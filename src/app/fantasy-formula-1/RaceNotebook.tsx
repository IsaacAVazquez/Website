"use client";

import { useState } from "react";
import type {
  FantasyFormula1Asset,
  FantasyFormula1LineupSummary,
} from "@/types/fantasyFormula1";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { f1ResultsKey, parseF1Results } from "@/lib/fantasyFormula1Records";
import { prefixedId } from "@/lib/utils";
import { formatDateTime } from "@/lib/date-formatters";
import "@/components/project-workflows.css";

export function RaceNotebook({
  season,
  race,
  date,
  sourceAt,
  assets,
  lineup,
  prices,
  onPrice,
  memoryOnly,
}: {
  season: number;
  race: string;
  date: string;
  sourceAt: string;
  assets: FantasyFormula1Asset[];
  lineup: FantasyFormula1LineupSummary;
  prices: Record<string, number>;
  onPrice: (id: string, value: number | null) => void;
  memoryOnly: boolean;
}) {
  const store = useBrowserRecord(f1ResultsKey(season), parseF1Results);
  const [raceName, setRaceName] = useState(race);
  const [raceDate, setRaceDate] = useState(date);
  const [message, setMessage] = useState("");
  function save() {
    if (!lineup.isComplete || lineup.isOverBudget) {
      setMessage(
        "Build a complete lineup within the $100m planning budget first.",
      );
      return;
    }
    const record = parseF1Results(
      JSON.stringify([
        {
          id: prefixedId("race"),
          race: raceName,
          date: raceDate,
          sourceAt,
          savedAt: new Date().toISOString(),
          actual: null,
          assets: lineup.assets.map((asset) => ({
            id: asset.id,
            name: asset.name,
            price: asset.price,
            estimate: asset.projectedPoints,
            entered: Object.hasOwn(prices, asset.id),
          })),
        },
      ]),
    )[0];
    if (!record) {
      setMessage("Enter a race name and a valid race date.");
      return;
    }
    let saved = false;
    store.update((latest) => {
      if (latest.length >= 30) return latest;
      saved = true;
      return [record, ...latest];
    });
    setMessage(
      saved
        ? `Recorded the lineup for ${record.race}.`
        : "Remove an old record before adding another. The limit is 30.",
    );
  }
  return (
    <details className="project-workflow">
      <summary>Game prices and race notebook</summary>
      <p>
        Enter prices from your game in millions. Entered prices change the
        builder and optimizer for this race; blank fields use model prices. The
        planning budget stays $100m, and point estimates still use this site’s
        model.
      </p>
      <details>
        <summary className="c97-btn-ghost">
          Edit driver and constructor prices
        </summary>
        <div className="project-workflow-fields">
          {assets.map((asset) => (
            <label key={asset.id}>
              {asset.name}, $m
              <input
                className="c97-field"
                type="number"
                min="0.1"
                max={100}
                step="0.1"
                value={prices[asset.id] ?? ""}
                placeholder={`Model ${asset.price.toFixed(1)}`}
                onChange={(event) => {
                  const value =
                    event.target.value === ""
                      ? null
                      : Number(event.target.value);
                  if (
                    value === null ||
                    (Number.isFinite(value) && value >= 0.1 && value <= 100)
                  )
                    onPrice(asset.id, value);
                }}
              />
              <small>
                {Object.hasOwn(prices, asset.id)
                  ? "Entered game price"
                  : "Model price"}
              </small>
            </label>
          ))}
        </div>
      </details>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="project-workflow-fields">
          <label>
            Race record name
            <input
              className="c97-field"
              required
              maxLength={100}
              value={raceName}
              onChange={(event) => setRaceName(event.target.value)}
            />
          </label>
          <label>
            Race record date
            <input
              required
              className="c97-field"
              type="date"
              value={raceDate}
              onChange={(event) => setRaceDate(event.target.value)}
            />
          </label>
        </div>
        <button
          type="submit"
          className="c97-btn"
          disabled={
            !lineup.isComplete ||
            lineup.isOverBudget ||
            store.value.length >= 30
          }
        >
          Record current lineup
        </button>
      </form>
      <p>
        Records keep the seven picks, prices, estimates, and source date as they
        were saved. Enter the actual total after the race. The model does not
        implement official game scoring, so the difference is descriptive and
        does not establish prediction accuracy.
      </p>
      {!store.value.length ? (
        <p>No recorded race lineups yet.</p>
      ) : (
        <ul className="project-workflow-list">
          {store.value.map((row) => {
            const estimate = row.assets.reduce(
              (sum, asset) => sum + asset.estimate,
              0,
            );
            return (
              <li key={row.id}>
                <h3>
                  {row.race} · {row.date}
                </h3>
                <p>{row.assets.map((asset) => asset.name).join(", ")}</p>
                <p>
                  Saved cost $
                  {row.assets
                    .reduce((sum, asset) => sum + asset.price, 0)
                    .toFixed(1)}
                  m · {row.assets.filter((asset) => asset.entered).length} of 7
                  entered prices · Model estimate {estimate.toFixed(1)} points
                </p>
                <small>
                  Model source {formatDateTime(row.sourceAt)} · Recorded{" "}
                  {formatDateTime(row.savedAt)}
                </small>
                <form
                  className="project-workflow-actions"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const raw = String(
                      new FormData(event.currentTarget).get("actual") ?? "",
                    ).trim();
                    const actual = raw === "" ? null : Number(raw);
                    if (
                      actual !== null &&
                      (!Number.isFinite(actual) ||
                        actual < -10000 ||
                        actual > 10000)
                    )
                      return;
                    let found = false;
                    store.update((latest) =>
                      latest.map((item) => {
                        if (item.id !== row.id) return item;
                        found = true;
                        return { ...item, actual };
                      }),
                    );
                    setMessage(
                      found
                        ? `Saved the result for ${row.race}.`
                        : "That record was removed in another tab.",
                    );
                  }}
                >
                  <label>
                    Actual points for {row.race}
                    <input
                      className="c97-field"
                      name="actual"
                      type="number"
                      min={-10000}
                      max={10000}
                      step="0.1"
                      defaultValue={row.actual ?? ""}
                      key={`${row.id}-${row.actual}`}
                    />
                  </label>
                  <button type="submit" className="c97-btn-ghost">
                    Save race result
                  </button>
                  <button
                    type="button"
                    className="c97-btn-ghost"
                    onClick={() =>
                      store.update((latest) =>
                        latest.filter((item) => item.id !== row.id),
                      )
                    }
                  >
                    Remove {row.race}
                  </button>
                </form>
                <p>
                  {row.actual === null
                    ? "Actual result not recorded."
                    : `Actual ${row.actual.toFixed(1)} points · Actual minus model ${(row.actual - estimate).toFixed(1)} points`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <p role="status">{message}</p>
      {(memoryOnly || store.status === "memory-only") && (
        <p role="status">
          Browser storage is unavailable. Changes last only while this tab is
          open.
        </p>
      )}
    </details>
  );
}
