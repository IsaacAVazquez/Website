"use client";

import {
  describeRedraftNeed,
  describeRedraftTier,
  describeRedraftWait,
  type RedraftDraftDecisionReport,
} from "@/lib/redraftDraftDecision";
import type { Player } from "@/types";

import "./fantasy-overlays.css";
import { positionClass } from "./positionClass";

/**
 * What waiting costs at each position, as a ruled list with one row per
 * position. A row leads with the best player left there, as a button that
 * opens his detail, then the tier reading and the reading for the next turn.
 */
export function RedraftDecisionPanel({
  report,
  onOpenPlayer,
}: {
  report: RedraftDraftDecisionReport;
  onOpenPlayer: (player: Player) => void;
}) {
  if (!report.guidanceAvailable || report.positions.length === 0) return null;

  // Off the clock every position carries the same next-turn sentence, so it
  // prints once under the list. On the clock each row has its own.
  const waits = report.positions.filter((entry) => entry.bestAvailable).map((entry) => describeRedraftWait(entry.wait));
  const sharedWait = waits.length > 1 && waits.every((wait) => wait === waits[0]) ? waits[0] : null;

  return (
    <section className="ffb-stack ffb-stack-tight" aria-labelledby="redraft-position-decision-heading">
      <div className="ffb-sechead">
        <h2 id="redraft-position-decision-heading" className="ffb-h3">
          What changes if you wait
        </h2>
        <p className="ffb-sechead-note">Rank index and scarcity</p>
      </div>
      <p className="ffb-method">
        The replacement index is a 0 to 100 ordinal reading from published overall ranks and your league settings. VORP appears separately on the board because it comes from projected fantasy points. Tier counts use each position&apos;s own board, and the next-turn reading uses current ADP only while you are on the clock.
      </p>

      <ul className="ffb-ov-wait">
        {report.positions.map((entry) => {
          const best = entry.bestAvailable;
          const mostAtRisk = report.mostAtRisk?.position === entry.position;
          return (
            <li key={entry.position} className={mostAtRisk ? "ffb-ov-wait-row ffb-ov-wait-risk" : "ffb-ov-wait-row"}>
              <div className="ffb-ov-wait-who">
                {best ? (
                  <button
                    type="button"
                    onClick={() => onOpenPlayer(best.player)}
                    className="ffb-ov-wait-open"
                    aria-label={`Open ${best.player.name} detail`}
                  >
                    <span className={`ffb-chip ffb-chip-sm ${positionClass(entry.position)}`}>{entry.position}</span>
                    <span className="ffb-c-name">{best.player.name}</span>
                    <span className="ffb-ov-wait-index">Index {best.value.toFixed(1)}</span>
                  </button>
                ) : (
                  <p className="ffb-ov-wait-none">
                    <span className={`ffb-chip ffb-chip-sm ${positionClass(entry.position)}`}>{entry.position}</span>
                    No ranked player remains at this position.
                  </p>
                )}
                <p className="ffb-ov-wait-tags">
                  <span className={`ffb-label ${entry.need === "filled" ? "ffb-muted" : "ffb-good"}`}>
                    {describeRedraftNeed(entry)}
                  </span>
                  {mostAtRisk ? <span className="ffb-label ffb-warn">Most at risk</span> : null}
                </p>
                {best ? (
                  <p className="ffb-ov-wait-lines">
                    Starter line {best.starterCutoff === null ? "unavailable" : `overall #${Math.round(best.starterCutoff)}`} · Roster line {best.rosterCutoff === null ? "unavailable" : `overall #${Math.round(best.rosterCutoff)}`}{best.coverage === "limited" ? " · Limited coverage" : ""}
                  </p>
                ) : null}
              </div>
              {best ? (
                <>
                  <p className="ffb-ov-wait-tier">{describeRedraftTier(entry)}</p>
                  {sharedWait ? null : <p className="ffb-ov-wait-next">{describeRedraftWait(entry.wait)}</p>}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
      {sharedWait ? <p className="ffb-fact-foot">{sharedWait}</p> : null}
    </section>
  );
}
