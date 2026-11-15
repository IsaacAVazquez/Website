"use client";

import { useState } from "react";
import { ProjectWorkspace, StorageNotice } from "@/components/ProjectWorkspace";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { prefixedId } from "@/lib/utils";
import { aiDevTools } from "./ai-dev-tools-data";
import {
  DEFAULT_TOOL_REQUIREMENTS,
  parseToolComparisons,
  requirementChecks,
  TOOL_COMPARISONS_KEY,
  TOOL_ENVIRONMENTS,
  TOOL_PRICING_CHECKED_AT,
  type ToolRequirements,
} from "./toolComparisons";

export function ToolComparison() {
  const store = useBrowserRecord(TOOL_COMPARISONS_KEY, parseToolComparisons);
  const [ids, setIds] = useState<string[]>([]);
  const [requirements, setRequirements] = useState(DEFAULT_TOOL_REQUIREMENTS);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const requirementsList = [
    ["ownKeys", "Use my own provider keys"],
    ["localModels", "Run local models"],
    ["teamAdmin", "Team administration"],
    ["openSource", "Open source"],
  ] as const;
  return (
    <ProjectWorkspace
      id="tool-comparison"
      title="Compare tools for your work"
      description="Choose up to four tools and the requirements that matter to you, then save a named shortlist in this browser."
    >
      <div className="pw-fields">
        <label className="pw-field">
          Add a tool
          <select
            aria-label="Add a tool"
            value=""
            disabled={ids.length >= 4}
            onChange={(event) => {
              if (event.target.value) setIds([...ids, event.target.value]);
            }}
          >
            <option value="">Choose a tool</option>
            {aiDevTools
              .filter((t) => !ids.includes(t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        <label className="pw-field">
          Working environment
          <select
            aria-label="Working environment"
            value={requirements.environment}
            onChange={(event) =>
              setRequirements({
                ...requirements,
                environment: event.target
                  .value as ToolRequirements["environment"],
              })
            }
          >
            {Object.entries(TOOL_ENVIRONMENTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="pw-actions">
        {requirementsList.map(([key, label]) => (
          <label className="pw-check" key={key}>
            <input
              type="checkbox"
              checked={requirements[key]}
              onChange={(event) =>
                setRequirements({
                  ...requirements,
                  [key]: event.target.checked,
                })
              }
            />
            {label}
          </label>
        ))}
      </div>
      <p className="pw-note">
        Pricing checked {TOOL_PRICING_CHECKED_AT}. Published plans and usage
        charges differ. Confirm your chosen plan with its provider. “Unknown”
        means the catalog does not confirm that requirement.
      </p>
      {ids.length ? (
        <div
          className="pw-scroll"
          role="region"
          aria-label="Tool comparison (scrolls sideways)"
          tabIndex={0}
        >
          <table className="pw-table pw-table--tools">
            <caption>
              Your tool shortlist. Scroll sideways to see all columns.
            </caption>
            <thead>
              <tr>
                <th scope="col">Tool</th>
                <th scope="col">Pricing</th>
                <th scope="col">Environment and models</th>
                <th scope="col">Your requirements</th>
              </tr>
            </thead>
            <tbody>
              {ids.map((id) => {
                const tool = aiDevTools.find((t) => t.id === id);
                return (
                  <tr key={id}>
                    <th scope="row">
                      {tool?.name ?? `${id} (unavailable)`}
                      <div>
                        <button
                          type="button"
                          aria-label={`Remove ${tool?.name ?? id} from comparison`}
                          onClick={() =>
                            setIds(ids.filter((item) => item !== id))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                    <td>
                      {tool ? (
                        <>
                          {tool.pricingSummary}
                          <div>
                            <a
                              className="pw-source"
                              href={
                                tool.sourceUrls.find((source) =>
                                  /pricing|plans/i.test(source.label),
                                )?.url ??
                                tool.sourceUrls[0]?.url ??
                                tool.website
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Provider source
                            </a>
                          </div>
                        </>
                      ) : (
                        "Unavailable in this catalog"
                      )}
                    </td>
                    <td>
                      {tool ? (
                        <>
                          {tool.surfaces.join(", ")}
                          <p className="pw-note">{tool.modelSummary}</p>
                        </>
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td>
                      {tool
                        ? requirementChecks(tool, requirements).map((check) => (
                            <p key={check.label}>
                              {check.label} ·{" "}
                              {check.result === "yes"
                                ? "Listed"
                                : check.result === "no"
                                  ? "Does not match"
                                  : "Unknown"}
                            </p>
                          ))
                        : "Unknown"}
                      {tool && !requirementChecks(tool, requirements).length
                        ? "Choose requirements above."
                        : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="pw-note">
          Add your first tool above to start a comparison.
        </p>
      )}
      <form
        className="pw-fields"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !ids.length) return;
          let saved = false;
          store.update((latest) => {
            if (latest.length >= 20) return latest;
            saved = true;
            return [
              ...latest,
              {
                id: prefixedId("shortlist"),
                name: name.trim(),
                toolIds: ids,
                requirements,
              },
            ];
          });
          setMessage(
            saved
              ? `Saved ${name.trim()}.`
              : "Remove a saved shortlist to make room. The limit is 20.",
          );
          if (saved) setName("");
        }}
      >
        <label className="pw-field">
          Shortlist name
          <input
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button
          className="pw-primary"
          disabled={!name.trim() || !ids.length || store.value.length >= 20}
        >
          Save shortlist
        </button>
      </form>
      <ul className="pw-list">
        {store.value.map((saved) => (
          <li key={saved.id}>
            <span>{saved.name}</span>
            <div className="pw-actions">
              <button
                type="button"
                aria-label={`Load ${saved.name}`}
                onClick={() => {
                  setIds(saved.toolIds);
                  setRequirements(saved.requirements);
                  setMessage(
                    `Loaded ${saved.name} using the current catalog.`,
                  );
                }}
              >
                Load
              </button>
              <button
                type="button"
                aria-label={`Delete ${saved.name}`}
                onClick={() =>
                  store.update((latest) =>
                    latest.filter((item) => item.id !== saved.id),
                  )
                }
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p role="status" className="pw-note">
        {message}
      </p>
      <StorageNotice status={store.status} />
    </ProjectWorkspace>
  );
}
