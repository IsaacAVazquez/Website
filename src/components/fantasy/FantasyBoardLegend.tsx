"use client";

import type { CSSProperties } from "react";

import { FANTASY_BOARD_LEGEND, FANTASY_CHIP_CLASS, type FantasyLegendEntry } from "@/lib/fantasyUtils";

/**
 * Chip tints for the Value / Reach legend rows. Kept in lockstep with the
 * inline chips rendered by RankingsListRow so the key visually matches the
 * board it explains.
 */
const TONE_STYLE: Record<NonNullable<FantasyLegendEntry["tone"]>, CSSProperties> = {
  value: {
    borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
    background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper))",
  },
  reach: {
    borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--home-rule))",
    background: "color-mix(in srgb, var(--color-warning) 12%, var(--home-paper))",
  },
};

interface FantasyBoardLegendProps {
  /** Anchor id, wired to the toggle's aria-controls and the heading's id. */
  id?: string;
}

/**
 * The collapsible "How to read this board" key. Presentational only: it reads
 * its entries from FANTASY_BOARD_LEGEND so the copy lives next to the logic it
 * describes and stays testable.
 */
export function FantasyBoardLegend({ id }: FantasyBoardLegendProps) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section id={id} aria-labelledby={headingId} className="home-card p-5 sm:p-6">
      <header className="mb-4">
        <p className="home-kicker mb-1">Reading the board</p>
        <h2 id={headingId} className="text-xl font-semibold">
          How to read this board
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
          A quick key to the ranks, ADP signals, tiers, and freshness cues you will see across the board.
        </p>
      </header>

      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {FANTASY_BOARD_LEGEND.map((entry) => (
          <div key={entry.term} className="min-w-0">
            <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {entry.tone && (
                <span className={FANTASY_CHIP_CLASS} style={TONE_STYLE[entry.tone]} aria-hidden="true">
                  {entry.term}
                </span>
              )}
              {entry.term}
            </dt>
            <dd className="mt-1 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
              {entry.definition}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default FantasyBoardLegend;
