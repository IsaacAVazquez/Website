"use client";

import { useMemo, useState } from "react";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { prefixedId } from "@/lib/utils";
import { evaluateDecision } from "./decision-lab-data";
import type { DecisionLabState } from "./decision-lab-state";
import {
  parseSavedBets,
  saveBet,
  SAVED_BETS_KEY,
  verdictChanges,
  type SavedBet,
} from "./decisionSaved";

export function SavedBets({
  state,
  onLoad,
}: {
  state: DecisionLabState;
  onLoad: (state: DecisionLabState) => void;
}) {
  const {
    value: bets,
    update,
    status,
  } = useBrowserRecord(SAVED_BETS_KEY, parseSavedBets);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [original, setOriginal] = useState<SavedBet | undefined>();
  const [message, setMessage] = useState("");
  const { impact, confidence, effort, reversibility } = state;
  const changes = useMemo(
    () => verdictChanges({ impact, confidence, effort, reversibility }),
    [impact, confidence, effort, reversibility],
  );
  const ranked = useMemo(
    () =>
      bets
        .map((bet) => ({ bet, result: evaluateDecision(bet) }))
        .sort((a, b) => b.result.weightedScore - a.result.weightedScore),
    [bets],
  );
  const selected = bets.find((bet) => bet.id === selectedId);
  function save(replace: boolean) {
    if (!name.trim()) {
      setMessage("Give this bet a name before saving.");
      return;
    }
    if (!replace && bets.length >= 20) {
      setMessage(
        "There is room for 20 bets. Remove one before adding another.",
      );
      return;
    }
    const id = replace && original ? original.id : prefixedId("bet");
    const saved = update((latest) =>
      saveBet(
        latest,
        { ...state, id, name: name.trim().slice(0, 80) },
        replace ? original : undefined,
      ),
    ).find((bet) => bet.id === id);
    if (!saved) {
      setMessage(
        "The bet was removed in another tab or the list is full. Save a new bet after making room.",
      );
      return;
    }
    setSelectedId(id);
    setOriginal(saved);
    const { preset, impact, confidence, effort, reversibility } = saved;
    onLoad({ preset, impact, confidence, effort, reversibility });
    setName(saved.name);
    setMessage(`Saved ${saved.name}.`);
  }
  return (
    <section className="dl-saved" aria-labelledby="dl-saved-heading">
      <h2 id="dl-saved-heading">Compare your bets</h2>
      <p>
        Save up to 20 bets in this browser. The score uses the same four inputs
        for each bet.
      </p>
      <form
        className="dl-save-form"
        onSubmit={(event) => {
          event.preventDefault();
          save(false);
        }}
      >
        <label>
          Bet name
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="dl-link">
          Save as new bet
        </button>
        {selected ? (
          <button type="button" className="dl-link" onClick={() => save(true)}>
            Update {selected.name}
          </button>
        ) : null}
      </form>
      <p role="status">
        {status === "memory-only"
          ? "Browser storage is unavailable. These edits only last in this tab."
          : message}
      </p>
      {bets.length ? (
        <div
          className="dl-compare"
          role="region"
          aria-label="Saved bet comparison"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Bet</th>
                <th scope="col">Impact</th>
                <th scope="col">Confidence</th>
                <th scope="col">Effort</th>
                <th scope="col">Reversibility</th>
                <th scope="col">Score</th>
                <th scope="col">Verdict</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ bet, result }) => {
                  return (
                    <tr key={bet.id}>
                      <th scope="row">{bet.name}</th>
                      <td>{bet.impact}</td>
                      <td>{bet.confidence}</td>
                      <td>{bet.effort}</td>
                      <td>{bet.reversibility}</td>
                      <td>{result.weightedScore}</td>
                      <td>{result.recommendation}</td>
                      <td>
                        <button
                          type="button"
                          className="dl-link"
                          aria-label={`Load ${bet.name}`}
                          onClick={() => {
                            const {
                              preset,
                              impact,
                              confidence,
                              effort,
                              reversibility,
                            } = bet;
                            onLoad({
                              preset,
                              impact,
                              confidence,
                              effort,
                              reversibility,
                            });
                            setName(bet.name);
                            setSelectedId(bet.id);
                            setOriginal(bet);
                            setMessage(`Loaded ${bet.name}.`);
                          }}
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          className="dl-link"
                          aria-label={`Remove ${bet.name}`}
                          onClick={() => {
                            update((latest) =>
                              latest.filter((entry) => entry.id !== bet.id),
                            );
                            setMessage(`Removed ${bet.name}.`);
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No saved bets yet. Set the sliders and save your first bet above.</p>
      )}
      <h3>What would change this verdict?</h3>
      <p>
        Each line changes one input and holds the other three fixed. These are
        rubric thresholds, and the inputs remain your estimates.
      </p>
      <ul>
        {changes.map((change) => (
          <li key={change.axis}>
            {change.axis[0].toUpperCase() + change.axis.slice(1)} from{" "}
            {state[change.axis]} to {change.to} changes the verdict to{" "}
            {change.verdict}.
          </li>
        ))}
      </ul>
    </section>
  );
}
