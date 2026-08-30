"use client";

import {
  MONO_LABEL_CLASS,
  POSITION_CHIP_CLASS,
  getPositionTone,
} from "@/lib/fantasyUtils";
import {
  describeRedraftNeed,
  describeRedraftTier,
  describeRedraftWait,
  type RedraftDraftDecisionReport,
} from "@/lib/redraftDraftDecision";
import type { Player } from "@/types";

export function RedraftDecisionPanel({
  report,
  onOpenPlayer,
}: {
  report: RedraftDraftDecisionReport;
  onOpenPlayer: (player: Player) => void;
}) {
  if (!report.guidanceAvailable || report.positions.length === 0) return null;

  return (
    <section aria-labelledby="redraft-position-decision-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
        <div>
          <p className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Rank index and scarcity
          </p>
          <h2
            id="redraft-position-decision-heading"
            className="mt-1 text-xl font-semibold tracking-[-0.03em]"
          >
            What changes if you wait
          </h2>
        </div>
        <p
          className="m-0 max-w-[62ch] text-xs leading-5"
          style={{ color: "var(--home-ink-muted)" }}
        >
          The replacement index is a 0 to 100 ordinal reading from published overall ranks and your league settings. VORP appears separately on the board because it comes from projected fantasy points. Tier counts use each position&apos;s own board, and the next-turn reading uses current ADP only while you are on the clock.
        </p>
      </div>

      <div
        className="grid gap-px overflow-hidden rounded-lg border"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(235px, 1fr))",
          borderColor: "var(--home-rule)",
          background: "var(--home-rule)",
        }}
      >
        {report.positions.map((entry) => {
          const best = entry.bestAvailable;
          const mostAtRisk = report.mostAtRisk?.position === entry.position;
          return (
            <article
              key={entry.position}
              className="min-w-0 px-3.5 py-3"
              style={{
                background: mostAtRisk
                  ? "color-mix(in srgb, var(--home-warning) 8%, var(--home-paper))"
                  : "var(--home-paper)",
              }}
            >
              <div className="flex min-h-6 items-center gap-2">
                <span className={POSITION_CHIP_CLASS} style={getPositionTone(entry.position)}>
                  {entry.position}
                </span>
                <span
                  className="font-mono text-3xs uppercase tracking-[0.08em]"
                  style={{ color: entry.need === "filled" ? "var(--home-ink-muted)" : "var(--home-positive)" }}
                >
                  {describeRedraftNeed(entry)}
                </span>
                {mostAtRisk ? (
                  <span
                    className="ml-auto font-mono text-3xs uppercase tracking-[0.08em]"
                    style={{ color: "var(--home-warning)" }}
                  >
                    Most at risk
                  </span>
                ) : null}
              </div>

              {best ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenPlayer(best.player)}
                    className="-mx-1 mt-1.5 inline-flex min-h-touch max-w-full items-center gap-2 rounded px-1 text-left"
                    aria-label={`Open ${best.player.name} detail`}
                  >
                    <span className="truncate text-sm font-semibold tracking-[-0.01em]">
                      {best.player.name}
                    </span>
                    <span
                      className="flex-none font-mono text-xs"
                      style={{ color: "var(--home-signal)" }}
                    >
                      Index {best.value.toFixed(1)}
                    </span>
                  </button>
                  <p
                    className="m-0 font-mono text-3xs leading-5"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Starter line {best.starterCutoff === null ? "unavailable" : `overall #${Math.round(best.starterCutoff)}`} · Roster line {best.rosterCutoff === null ? "unavailable" : `overall #${Math.round(best.rosterCutoff)}`}{best.coverage === "limited" ? " · Limited coverage" : ""}
                  </p>
                  <p
                    className="m-0 mt-2 text-xs leading-5"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    {describeRedraftTier(entry)}
                  </p>
                  <p
                    className="m-0 mt-2 border-t pt-2 text-xs leading-5"
                    style={{
                      color: "var(--home-ink)",
                      borderColor: "color-mix(in srgb, var(--home-rule) 70%, transparent)",
                    }}
                  >
                    {describeRedraftWait(entry.wait)}
                  </p>
                </>
              ) : (
                <p className="m-0 mt-3 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                  No ranked player remains at this position.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
