"use client";

import { useId, useState } from "react";
import {
  DEFAULT_FRONTIER_WORKLOAD,
  FRONTIER_MODEL_LIMIT,
  FRONTIER_WORKLOAD_BOUNDS,
  decodeFrontierWorkload,
  type FrontierWorkloadInput,
} from "@/lib/frontierWorkload";
import { formatLongUtcDate } from "@/lib/date-formatters";
import type { FrontierModel } from "@/types/frontierModels";
import { FrontierWorkloadResults } from "./FrontierWorkloadResults";
import { FrontierSavedComparisons } from "./FrontierSavedComparisons";

const COUNT_FIELDS = [
  ["monthlyRequests", "Monthly requests"],
  ["inputTokens", "Input tokens per request"],
  ["outputTokens", "Output tokens per request"],
] as const;

function draftFor(input: FrontierWorkloadInput) {
  return {
    monthlyRequests: String(input.monthlyRequests),
    inputTokens: String(input.inputTokens),
    outputTokens: String(input.outputTokens),
  };
}

function validCount(raw: string, limit: number) {
  const value = raw.trim() ? Number(raw) : NaN;
  return Number.isSafeInteger(value) && value >= 0 && value <= limit;
}

export function FrontierWorkload({
  models,
  snapshotGeneratedAt,
  factsAsOf,
  reviewIsOverdue,
}: {
  models: FrontierModel[];
  snapshotGeneratedAt: string;
  factsAsOf: string;
  reviewIsOverdue: boolean;
}) {
  const headingId = useId();
  const [draft, setDraft] = useState(() => draftFor(DEFAULT_FRONTIER_WORKLOAD));
  const [requirements, setRequirements] = useState({
    vision: false,
    audio: false,
    reasoning: false,
  });
  const [modelIds, setModelIds] = useState<string[]>([]);
  const input = decodeFrontierWorkload({
    monthlyRequests: draft.monthlyRequests.trim()
      ? Number(draft.monthlyRequests)
      : NaN,
    inputTokens: draft.inputTokens.trim() ? Number(draft.inputTokens) : NaN,
    outputTokens: draft.outputTokens.trim() ? Number(draft.outputTokens) : NaN,
    ...requirements,
  });
  const errorId = `${headingId}-error`;
  return (
    <section
      id="frontier-workload"
      className="frm-workload"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="frm-h2">
        Estimate a workload
      </h2>
      <p className="frm-workload-intro">
        I use the same workload for each model so the text-token cost
        differences are easy to check. Choose up to four models and enter your
        expected usage. The starting numbers are an example.
      </p>
      <div className="frm-workload-fields">
        {COUNT_FIELDS.map(([field, label]) => (
          <label className="frm-workload-field" key={field}>
            {label}
            <input
              type="number"
              min={0}
              max={FRONTIER_WORKLOAD_BOUNDS[field]}
              step={1}
              required
              value={draft[field]}
              aria-invalid={
                !validCount(draft[field], FRONTIER_WORKLOAD_BOUNDS[field])
              }
              aria-describedby={
                !validCount(draft[field], FRONTIER_WORKLOAD_BOUNDS[field])
                  ? errorId
                  : undefined
              }
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [field]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>
      <p className="frm-workload-note">
        Tokens are pieces of text the model reads or produces. Use your expected
        token counts per request, including any billed reasoning tokens in the
        output.
      </p>
      {!input ? (
        <p id={errorId} className="frm-warn" role="status">
          Enter whole numbers from 0 to 1,000,000,000 requests and 0 to
          10,000,000 tokens per request.
        </p>
      ) : null}
      <fieldset className="frm-workload-requirements">
        <legend>Listed capabilities required</legend>
        <span className="frm-workload-note">Text is always checked.</span>
        {(
          [
            ["vision", "Vision"],
            ["audio", "Audio"],
            ["reasoning", "Reasoning"],
          ] as const
        ).map(([field, label]) => (
          <label className="frm-workload-check" key={field}>
            <input
              type="checkbox"
              checked={requirements[field]}
              onChange={(event) =>
                setRequirements((current) => ({
                  ...current,
                  [field]: event.target.checked,
                }))
              }
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="frm-workload-field frm-workload-picker">
        <label htmlFor={`${headingId}-model`}>Add a model</label>
        <select
          id={`${headingId}-model`}
          value=""
          disabled={modelIds.length >= FRONTIER_MODEL_LIMIT}
          onChange={(event) => {
            const id = event.target.value;
            if (models.some((model) => model.id === id))
              setModelIds((current) =>
                current.includes(id) || current.length >= FRONTIER_MODEL_LIMIT
                  ? current
                  : [...current, id],
              );
          }}
        >
          <option value="">
            {modelIds.length >= FRONTIER_MODEL_LIMIT
              ? "Four models selected"
              : "Choose a model to compare"}
          </option>
          {models
            .filter((model) => !modelIds.includes(model.id))
            .map((model) => (
              <option key={model.id} value={model.id}>
                {model.providerLabel} {model.name}
              </option>
            ))}
        </select>
      </div>
      {modelIds.length >= FRONTIER_MODEL_LIMIT ? (
        <p className="frm-workload-note">Remove a model to add another.</p>
      ) : null}
      {modelIds.length === 0 ? (
        <p className="frm-workload-note">
          Add a model to compare its monthly cost and listed requirements.
        </p>
      ) : input ? (
        <FrontierWorkloadResults
          models={models}
          modelIds={modelIds}
          input={input}
          onRemove={(id) =>
            setModelIds((current) => current.filter((value) => value !== id))
          }
        />
      ) : null}
      <p className="frm-workload-note">
        Prices come from the dataset on this page, built{" "}
        {formatLongUtcDate(snapshotGeneratedAt)}, with curated facts as of{" "}
        {formatLongUtcDate(factsAsOf)}.{" "}
        {reviewIsOverdue
          ? "Its review is overdue or pending, so check provider pricing before purchasing. "
          : ""}
        The estimate covers text tokens only and excludes image and audio
        charges, tools, caching, batch discounts, usage tiers, taxes, and
        retries. Capability checks use the catalog’s labels; confirm the
        required input and output formats in the provider documentation.
      </p>
      <FrontierSavedComparisons
        input={input}
        modelIds={modelIds}
        snapshotGeneratedAt={snapshotGeneratedAt}
        onLoad={(comparison) => {
          setDraft(draftFor(comparison.input));
          setRequirements({
            vision: comparison.input.vision,
            audio: comparison.input.audio,
            reasoning: comparison.input.reasoning,
          });
          setModelIds(comparison.modelIds);
        }}
      />
    </section>
  );
}
