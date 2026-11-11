"use client";

import { useState } from "react";
import { formatUnits, percent, type BlackjackProgress } from "@/lib/blackjack/progress";
import { ACTION_LABEL, type PlayerAction } from "@/lib/blackjack/strategy";

const CHOSE: Record<PlayerAction, string> = {
  hit: "hit",
  stand: "stood",
  double: "doubled",
  split: "split",
  surrender: "surrendered",
};

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="bj-figure">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ProgressView({ progress, onReset }: { progress: BlackjackProgress; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const accuracy = percent(progress.correct, progress.decisions);
  const countAccuracy = percent(progress.countCorrect, progress.countChecks);
  const empty = progress.decisions === 0 && progress.hands === 0 && progress.countChecks === 0;

  if (empty) {
    return (
      <div className="bj-progress">
        <p className="bj-note">
          Nothing is recorded yet. Play a hand at the table or check a count in the counting drill, and the
          record builds here, along with the plays you miss most often.
        </p>
      </div>
    );
  }

  return (
    <div className="bj-progress">
      <dl className="bj-figures">
        <Figure
          label="Decisions correct"
          value={accuracy === null ? "None graded" : `${accuracy}% of ${progress.decisions}`}
        />
        <Figure label="Hands played" value={String(progress.hands)} />
        <Figure label="Won, lost, pushed" value={`${progress.wins}, ${progress.losses}, ${progress.pushes}`} />
        <Figure label="Net units" value={formatUnits(progress.netUnits)} />
        <Figure
          label="Counts correct"
          value={countAccuracy === null ? "None checked" : `${countAccuracy}% of ${progress.countChecks}`}
        />
      </dl>

      <section aria-labelledby="bj-mistakes-heading" className="bj-mistakes">
        <h2 id="bj-mistakes-heading">Plays you miss most</h2>
        {progress.mistakes.length === 0 ? (
          <p className="bj-note">No missed plays on record.</p>
        ) : (
          <ol className="bj-mistake-list">
            {progress.mistakes.slice(0, 10).map((mistake) => (
              <li key={`${mistake.situation}-${mistake.chose}-${mistake.best}`}>
                <span className="bj-mistake-hand">{mistake.situation}</span>
                <span className="bj-mistake-play">
                  You {CHOSE[mistake.chose]}, and the play is {ACTION_LABEL[mistake.best].toLowerCase()}.
                </span>
                <span className="bj-mistake-count">
                  {mistake.count} {mistake.count === 1 ? "time" : "times"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="bj-reset">
        {confirming ? (
          <>
            <span>This clears the record in this browser and keeps the table you chose.</span>
            <button
              type="button"
              className="c97-btn"
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
            >
              Clear the record
            </button>
            <button type="button" className="c97-btn-ghost bj-ghost" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className="c97-btn-ghost bj-ghost" onClick={() => setConfirming(true)}>
            Reset progress
          </button>
        )}
      </p>
    </div>
  );
}
