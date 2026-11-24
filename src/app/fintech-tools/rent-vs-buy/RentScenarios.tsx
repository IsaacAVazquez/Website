"use client";

import { useState } from "react";
import { prefixedId } from "@/lib/utils";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import {
  RENT_SCENARIOS_KEY,
  parseRentScenarios,
  rentSensitivity,
} from "@/lib/rentVsBuy/scenarios";
import { calculateRentVsBuy } from "@/lib/rentVsBuy/engine";
import { decodeRentVsBuyInput } from "@/lib/rentVsBuy/persistence";
import type { RentVsBuyInput } from "@/lib/rentVsBuy/types";
import { formatCurrency } from "@/lib/retirement/format";
import "@/components/project-workflows.css";

export function RentScenarios({
  input,
  onLoad,
}: {
  input: RentVsBuyInput;
  onLoad: (input: RentVsBuyInput) => void;
}) {
  const store = useBrowserRecord(RENT_SCENARIOS_KEY, parseRentScenarios);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const compared = store.value
    .filter((item) => selected.includes(item.id))
    .map((item) => ({ ...item, result: calculateRentVsBuy(item.input) }));
  function save() {
    if (!name.trim()) return;
    let saved = false;
    store.update((latest) => {
      if (latest.length >= 20) return latest;
      saved = true;
      return [
        ...latest,
        {
          id: prefixedId("scenario"),
          name: name.trim().slice(0, 80),
          input: decodeRentVsBuyInput(input),
        },
      ];
    });
    setMessage(
      saved
        ? `Saved ${name.trim()}.`
        : "Remove a scenario before saving another. The limit is 20.",
    );
    if (saved) setName("");
  }
  return (
    <details className="project-workflow">
      <summary>Save and compare scenarios</summary>
      <p>
        Save the numbers above for each property or plan, then compare up to
        four. Each result uses that scenario’s own assumptions and holding
        period.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="project-workflow-actions"
      >
        <label>
          Scenario name
          <input
            className="c97-field"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button
          className="c97-btn"
          type="submit"
          disabled={store.value.length >= 20}
        >
          Save current scenario
        </button>
      </form>
      {!store.value.length && <p>No saved scenarios yet.</p>}
      <ul className="project-workflow-list">
        {store.value.map((item) => (
          <li key={item.id}>
            <div className="project-workflow-actions">
              <label className="project-workflow-check">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  disabled={!selected.includes(item.id) && compared.length >= 4}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    )
                  }
                />
                Compare {item.name}
              </label>
              <button
                className="c97-btn-ghost"
                type="button"
                onClick={() => {
                  onLoad(item.input);
                  setMessage(`Loaded ${item.name}.`);
                }}
              >
                Load {item.name}
              </button>
              <button
                className="c97-btn-ghost"
                type="button"
                onClick={() => {
                  store.update((latest) =>
                    latest.filter((row) => row.id !== item.id),
                  );
                  setSelected((current) =>
                    current.filter((id) => id !== item.id),
                  );
                }}
              >
                Remove {item.name}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {compared.length > 0 && (
        <div
          className="project-workflow-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scenario comparison"
        >
          <table>
            <caption>Saved scenario comparison</caption>
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col">Home / rent</th>
                <th scope="col">Rate / appreciation</th>
                <th scope="col">Years</th>
                <th scope="col">Buyer net worth</th>
                <th scope="col">Renter net worth</th>
                <th scope="col">Buying minus renting</th>
              </tr>
            </thead>
            <tbody>
              {compared.map((item) => (
                <tr key={item.id}>
                  <th scope="row">{item.name}</th>
                  <td>
                    {formatCurrency(item.input.homePrice)} /{" "}
                    {formatCurrency(item.input.monthlyRent)} monthly
                  </td>
                  <td>
                    {item.input.mortgageRatePercent}% /{" "}
                    {item.input.homeAppreciationPercent}%
                  </td>
                  <td>{item.input.yearsStaying}</td>
                  <td>{formatCurrency(item.result.buyerNetWorthAtHorizon)}</td>
                  <td>{formatCurrency(item.result.renterNetWorthAtHorizon)}</td>
                  <td>{formatCurrency(item.result.netWorthDeltaAtHorizon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2>Which assumptions change the result?</h2>
      <p>
        Each row changes one input in your current calculation, and the rows
        marked current repeat your own numbers as the reference. Positive
        differences favor buying; negative differences favor renting.
        They are scenarios, with no assigned probability.
      </p>
      <div
        className="project-workflow-scroll"
        tabIndex={0}
        role="region"
        aria-label="Assumption sensitivity"
      >
        <table>
          <caption>Current calculation with alternate assumptions</caption>
          <thead>
            <tr>
              <th scope="col">Assumption</th>
              <th scope="col">Value</th>
              <th scope="col">Buying minus renting</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rentSensitivity(input).map((row, index) => (
              <tr key={index}>
                <th scope="row">{row.label}</th>
                <td>
                  {row.value}
                  {row.field !== "yearsStaying"
                    ? "%"
                    : row.value === 1
                      ? " year"
                      : " years"}
                  {row.current ? " (current)" : ""}
                </td>
                <td>{formatCurrency(row.delta)}</td>
                <td>
                  {row.verdict === "close"
                    ? "Close"
                    : row.verdict === "buying"
                      ? "Buying ahead"
                      : "Renting ahead"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="status">{message}</p>
      {store.status === "memory-only" && (
        <p role="status">
          Browser storage is unavailable. These scenarios last only while this
          tab is open.
        </p>
      )}
    </details>
  );
}
