"use client";

import { useMemo, useState } from "react";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { ProjectWorkspace, StorageNotice } from "@/components/ProjectWorkspace";
import { formatCurrency, type RetirementPlanInput } from "@/lib/retirement";
import { DISPLAY_TIME_ZONE } from "@/lib/date-formatters";
import {
  compareRetirementScenarios,
  parseRetirementScenarios,
  RETIREMENT_SCENARIOS_KEY,
  type RetirementScenario,
} from "@/lib/retirement/scenarios";

import { RetirementScenarioTable } from "./RetirementScenarioTable";

export function RetirementScenarios({
  plan,
  onLoad,
}: {
  plan: RetirementPlanInput;
  onLoad: (plan: RetirementPlanInput) => void;
}) {
  const saved = useBrowserRecord(
    RETIREMENT_SCENARIOS_KEY,
    parseRetirementScenarios,
  );
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<RetirementScenario[]>([]);
  const [message, setMessage] = useState("");
  const year = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: DISPLAY_TIME_ZONE,
      year: "numeric",
    }).format(new Date()),
  );
  const results = useMemo(
    () => compareRetirementScenarios(comparison, year),
    [comparison, year],
  );
  const chosen = selected.filter((id) =>
    saved.value.some((row) => row.id === id),
  );
  const changedSinceComparison =
    comparison.length > 0 &&
    JSON.stringify(comparison) !==
      JSON.stringify(saved.value.filter((row) => chosen.includes(row.id)));
  return (
    <ProjectWorkspace
      id="retirement-comparisons"
      title="Compare saved retirement plans"
      description="Save the current inputs under a name, then choose up to four plans to compare. Each saved plan keeps all the inputs you entered and stays in this browser."
    >
      <form
        className="pw-fields"
        onSubmit={(event) => {
          event.preventDefault();
          const clean = name.trim();
          if (!clean) return;
          const row = {
            id: crypto.randomUUID(),
            name: clean.slice(0, 80),
            savedAt: new Date().toISOString(),
            plan,
          };
          let added = false;
          saved.update((latest) => {
            if (latest.length >= 20) return latest;
            added = true;
            return [...latest, row];
          });
          if (added) {
            setName("");
            setMessage("Plan saved.");
            setSelected((ids) => [...ids, row.id].slice(-4));
          } else
            setMessage(
              "Twenty plans are saved. Remove one before saving another.",
            );
        }}
      >
        <label className="pw-field">
          Plan name
          <input
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button
          className="pw-primary"
          type="submit"
          disabled={saved.value.length >= 20 || !name.trim()}
        >
          Save current retirement plan
        </button>
      </form>
      {!saved.value.length && (
        <p className="pw-note">
          No named plans saved yet. Try saving your starting plan before
          changing an input.
        </p>
      )}
      <ul className="pw-list">
        {saved.value.map((row) => (
          <li key={row.id}>
            <div className="pw-actions">
              <label className="pw-check">
                <input
                  type="checkbox"
                  checked={chosen.includes(row.id)}
                  disabled={!chosen.includes(row.id) && chosen.length >= 4}
                  onChange={() =>
                    setSelected(
                      chosen.includes(row.id)
                        ? chosen.filter((id) => id !== row.id)
                        : [...chosen, row.id],
                    )
                  }
                />
                {row.name}
              </label>
              <button
                type="button"
                onClick={() => {
                  onLoad(row.plan);
                  setMessage(`Loaded ${row.name}.`);
                }}
              >
                Load {row.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  saved.update((latest) =>
                    latest.filter((item) => item.id !== row.id),
                  );
                  setComparison([]);
                  setMessage(`Removed ${row.name}.`);
                }}
              >
                Remove {row.name}
              </button>
            </div>
            <p className="pw-note">
              Retire at {row.plan.retirementAge}, plan through{" "}
              {row.plan.horizonAge}, spend{" "}
              {formatCurrency(row.plan.desiredAnnualSpend)} a year · saved{" "}
              {row.savedAt.slice(0, 10)}
            </p>
          </li>
        ))}
      </ul>
      <div className="pw-actions">
        <button
          type="button"
          disabled={chosen.length < 2}
          onClick={() => {
            setComparison(saved.value.filter((row) => chosen.includes(row.id)));
            setMessage(
              "Comparison recalculated with the calculator and assumptions on this page.",
            );
          }}
        >
          Compare selected retirement plans
        </button>
        <span className="pw-note">{chosen.length} of 4 selected</span>
      </div>
      {changedSinceComparison && (
        <p role="status">
          The selection or saved plans changed. Compare again to update the
          table.
        </p>
      )}
      {results.length > 0 && (
        <>
          <p className="pw-note">
            Recalculated for {year} using each plan&apos;s saved assumptions.
            Amounts use today&apos;s dollars. Differences describe changed
            inputs and do not isolate each input&apos;s effect.
          </p>
          <RetirementScenarioTable results={results} />
        </>
      )}
      {message && <p role="status">{message}</p>}
      <StorageNotice status={saved.status} />
    </ProjectWorkspace>
  );
}
