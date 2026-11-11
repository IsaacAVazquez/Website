"use client";

import { useEffect, useId, useState } from "react";
import { createShoe, type Card } from "@/lib/blackjack/cards";
import {
  COUNTING_SYSTEMS,
  formatCount,
  getCountingSystem,
  runningCount,
  type CountingSystem,
} from "@/lib/blackjack/counting";
import { recordCountCheck, type BlackjackProgress } from "@/lib/blackjack/progress";
import { PlayingCard } from "./PlayingCard";

const PACES: readonly { id: string; label: string; ms: number | null }[] = [
  { id: "manual", label: "One card at a time", ms: null },
  { id: "slow", label: "A card every 2 seconds", ms: 2000 },
  { id: "medium", label: "A card every second", ms: 1000 },
  { id: "fast", label: "Two cards a second", ms: 500 },
];

interface Check {
  correct: boolean;
  text: string;
}

export function CountingView({
  update,
  shuffleDeck = () => createShoe(1),
}: {
  update: (updater: (current: BlackjackProgress) => BlackjackProgress) => void;
  /** Injected by tests to deal a known deck. */
  shuffleDeck?: () => Card[];
}) {
  const ids = useId();
  const [system, setSystem] = useState<CountingSystem>(COUNTING_SYSTEMS[0]);
  const [paceId, setPaceId] = useState("manual");
  const [deck, setDeck] = useState<Card[] | null>(null);
  /** Cards shown so far, the current one included. */
  const [shown, setShown] = useState(0);
  const [guess, setGuess] = useState(0);
  const [check, setCheck] = useState<Check | null>(null);
  const [tally, setTally] = useState({ checks: 0, correct: 0 });

  const pace = PACES.find((entry) => entry.id === paceId) ?? PACES[0];
  const running = deck !== null && shown < deck.length;
  const finished = deck !== null && shown >= deck.length;
  const actual = deck ? runningCount(deck.slice(0, shown), system) : 0;

  function start() {
    setDeck(shuffleDeck());
    setShown(1);
    setGuess(0);
    setCheck(null);
    setTally({ checks: 0, correct: 0 });
  }

  function stop() {
    setDeck(null);
    setShown(0);
    setCheck(null);
  }

  function next() {
    if (!deck) return;
    setShown((count) => Math.min(count + 1, deck.length));
  }

  function checkCount() {
    if (!deck) return;
    const correct = guess === actual;
    setCheck({
      correct,
      text: correct
        ? `Correct, the running count is ${formatCount(actual)}.`
        : `The running count is ${formatCount(actual)}, and you had ${formatCount(guess)}.`,
    });
    setTally((current) => ({ checks: current.checks + 1, correct: current.correct + (correct ? 1 : 0) }));
    update((progress) => recordCountCheck(progress, correct));
    // The drill carries on from the true count, so one slip does not fail every later check.
    setGuess(actual);
  }

  useEffect(() => {
    if (!running || pace.ms === null || !deck) return;
    const timer = window.setTimeout(() => {
      setShown((count) => Math.min(count + 1, deck.length));
    }, pace.ms);
    return () => window.clearTimeout(timer);
  }, [running, pace.ms, deck, shown]);

  const card = deck && shown > 0 ? deck[Math.min(shown, deck.length) - 1] : null;

  return (
    <div className="bj-counting">
      <div className="bj-counting-setup">
        <div className="bj-control">
          <label htmlFor={`${ids}-system`}>Counting system</label>
          <select
            id={`${ids}-system`}
            className="c97-field"
            value={system.id}
            onChange={(event) => {
              setSystem(getCountingSystem(event.target.value));
              stop();
            }}
          >
            {COUNTING_SYSTEMS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>
        <div className="bj-control">
          <label htmlFor={`${ids}-pace`}>Pace</label>
          <select
            id={`${ids}-pace`}
            className="c97-field"
            value={paceId}
            onChange={(event) => setPaceId(event.target.value)}
          >
            {PACES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="bj-note">{system.description}</p>
      <ul className="bj-tags" aria-label={`${system.name} card tags`}>
        {system.groups.map((group) => (
          <li key={group.cards}>
            <span className="bj-tag-value">{formatCount(group.tag)}</span>
            {group.cards}
          </li>
        ))}
      </ul>

      <div className="bj-drill">
        <div className="bj-drill-card">
          <PlayingCard card={card} large />
          <p className="bj-seat-label" aria-live="off">
            {deck ? `Card ${Math.min(shown, deck.length)} of ${deck.length}` : "One deck, 52 cards"}
          </p>
        </div>

        <div className="bj-drill-controls">
          {deck ? (
            <>
              <div className="bj-guess">
                <label htmlFor={`${ids}-guess`}>Your running count</label>
                <div className="bj-guess-row">
                  <button
                    type="button"
                    className="c97-btn bj-step"
                    aria-label="Subtract one"
                    onClick={() => setGuess((value) => value - 1)}
                  >
                    −
                  </button>
                  <input
                    id={`${ids}-guess`}
                    className="c97-field bj-guess-input"
                    type="number"
                    inputMode="numeric"
                    step={1}
                    min={-52}
                    max={52}
                    value={guess}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setGuess(Number.isFinite(value) ? Math.max(-52, Math.min(52, Math.round(value))) : 0);
                    }}
                  />
                  <button
                    type="button"
                    className="c97-btn bj-step"
                    aria-label="Add one"
                    onClick={() => setGuess((value) => value + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="bj-actions">
                <button type="button" className="c97-btn" onClick={checkCount}>
                  Check count
                </button>
                {pace.ms === null && running ? (
                  <button type="button" className="c97-btn" onClick={next}>
                    Next card
                  </button>
                ) : null}
                <button type="button" className="c97-btn-ghost bj-ghost" onClick={start}>
                  Start over
                </button>
              </div>
            </>
          ) : (
            <div className="bj-actions">
              <button type="button" className="c97-btn" onClick={start}>
                Start counting
              </button>
            </div>
          )}

          <div className="bj-status" role="status" aria-live="polite">
            {check ? (
              <p className="bj-verdict" data-correct={check.correct ? "true" : "false"}>
                {check.text}
              </p>
            ) : null}
            {finished ? (
              <p className="bj-result">
                That is the whole deck, and the count ends at {formatCount(actual)}
                {system.balanced ? ", where a balanced count always ends." : ", four above where it started."}
              </p>
            ) : null}
            {tally.checks > 0 ? (
              <p className="bj-session">
                {tally.correct} of {tally.checks} checks correct this deck.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
