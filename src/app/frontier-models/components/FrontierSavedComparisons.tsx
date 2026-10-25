"use client";

import { useState } from "react";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { prefixedId } from "@/lib/utils";
import {
  FRONTIER_COMPARISONS_KEY,
  FRONTIER_COMPARISON_LIMIT,
  parseFrontierComparisons,
  type FrontierWorkloadInput,
  type FrontierSavedComparison,
} from "@/lib/frontierWorkload";

function savedDate(timestamp: string) {
  // tz-local: Saved comparisons restore after hydration from this browser's storage.
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FrontierSavedComparisons({
  input,
  modelIds,
  snapshotGeneratedAt,
  onLoad,
}: {
  input: FrontierWorkloadInput | null;
  modelIds: string[];
  snapshotGeneratedAt: string;
  onLoad: (comparison: FrontierSavedComparison) => void;
}) {
  const store = useBrowserRecord(
    FRONTIER_COMPARISONS_KEY,
    parseFrontierComparisons,
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  function save() {
    if (!input || !name.trim() || modelIds.length === 0) return;
    let saved = false;
    store.update((latest) => {
      if (latest.length >= FRONTIER_COMPARISON_LIMIT) return latest;
      saved = true;
      return [
        ...latest,
        {
          id: prefixedId("comparison"),
          name: name.trim().slice(0, 80),
          input,
          modelIds: [...modelIds],
          savedAt: new Date().toISOString(),
          snapshotGeneratedAt: new Date(snapshotGeneratedAt).toISOString(),
        },
      ];
    });
    setMessage(
      saved
        ? `Saved ${name.trim()}.`
        : "Remove a saved comparison before adding another. The limit is 20.",
    );
    if (saved) setName("");
  }
  return (
    <div className="frm-workload-saved">
      <h3>Saved comparisons</h3>
      <p className="frm-workload-note">
        Save up to 20 comparisons in this browser. Loading one recalculates it
        using the displayed dataset.
      </p>
      <form
        className="frm-workload-save-form"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label className="frm-workload-field">
          Comparison name
          <input
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button
          className="frm-workload-button"
          type="submit"
          disabled={
            !input ||
            modelIds.length === 0 ||
            !name.trim() ||
            store.value.length >= FRONTIER_COMPARISON_LIMIT
          }
        >
          Save comparison
        </button>
      </form>
      {store.value.length >= FRONTIER_COMPARISON_LIMIT ? (
        <p className="frm-workload-note">
          The limit is 20. Remove a saved comparison to make room.
        </p>
      ) : null}
      {store.value.length === 0 ? (
        <p className="frm-workload-note">No saved comparisons yet.</p>
      ) : (
        <ul className="frm-workload-saved-list">
          {store.value.map((item) => (
            <li key={item.id}>
              <div>
                <span className="frm-workload-model">{item.name}</span>
                <span className="frm-workload-meta">
                  Saved {savedDate(item.savedAt)} · {item.modelIds.length}{" "}
                  models · {item.input.monthlyRequests.toLocaleString("en-US")}{" "}
                  requests / month
                </span>
              </div>
              <div className="frm-workload-actions">
                <button
                  className="frm-workload-link"
                  type="button"
                  aria-label={`Load ${item.name}`}
                  onClick={() => {
                    onLoad(item);
                    setMessage(
                      `Loaded ${item.name}. Recalculated using the displayed dataset. The saved comparison used the dataset built ${item.snapshotGeneratedAt.slice(0, 10)}.`,
                    );
                  }}
                >
                  Load
                </button>
                <button
                  className="frm-workload-link"
                  type="button"
                  aria-label={`Remove saved ${item.name}`}
                  onClick={() => {
                    store.update((latest) =>
                      latest.filter((record) => record.id !== item.id),
                    );
                    setMessage(`Removed ${item.name}.`);
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p role="status">{message}</p>
      {store.status === "memory-only" ? (
        <p role="status" className="frm-warn">
          Browser storage is unavailable. These comparisons last only while this
          tab is open.
        </p>
      ) : null}
    </div>
  );
}
