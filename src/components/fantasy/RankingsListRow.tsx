"use client";

import { GitCompareArrows, Star, StickyNote } from "lucide-react";
import type { ReactNode } from "react";

import {
  FANTASY_CHIP_CLASS,
  formatAdp,
  formatOwnership,
  formatRange,
  getPositionTone,
  getValueVsAdp,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

interface RankingsListRowProps {
  player: Player;
  publishedRank: string;
  descriptor: ReactNode;
  adpAvailable: boolean;
  compact: boolean;
  isQueued: boolean;
  hasNote: boolean;
  inCompare: boolean;
  compareDisabled: boolean;
  onOpenDetail: () => void;
  onToggleQueue: () => void;
  onToggleCompare: () => void;
}

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{children}</p>
    </div>
  );
}

/**
 * A single rankings-board row with a clear primary line (rank + name) over a
 * muted secondary line, a reflowing metric strip, and an always-visible action
 * cluster (queue, compare, open detail). Hover lifts the row; a queued row
 * carries an acid left accent so the watchlist reads inline.
 */
export function RankingsListRow({
  player,
  publishedRank,
  descriptor,
  adpAvailable,
  compact,
  isQueued,
  hasNote,
  inCompare,
  compareDisabled,
  onOpenDetail,
  onToggleQueue,
  onToggleCompare,
}: RankingsListRowProps) {
  const valueVsAdp = adpAvailable ? getValueVsAdp(player) : null;

  return (
    <li
      className="group relative overflow-hidden rounded-[1.25rem] border border-[color:var(--home-rule)] transition-[border-color,box-shadow,transform] hover:border-[color:var(--home-ink)] hover:shadow-[var(--shadow-md)] motion-safe:hover:-translate-y-0.5"
      style={{ background: "color-mix(in srgb, var(--home-paper-alt) 42%, var(--home-elev-mix))" }}
    >
      {isQueued && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: "var(--home-acid)" }}
        />
      )}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`Open ${player.name} detail — ${player.position}, rank ${publishedRank}`}
          className={`flex min-w-0 flex-1 flex-col gap-2 text-left md:flex-row md:items-center md:gap-4 ${
            compact ? "px-4 py-2.5" : "px-4 py-3.5"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 md:flex-1">
            <span
              className={`inline-flex shrink-0 items-center justify-center tabular-nums ${
                compact ? "text-xl" : "text-2xl"
              } font-semibold`}
              style={{ minWidth: compact ? "2.25rem" : "2.75rem" }}
              title="Published FantasyPros consensus rank on this board"
            >
              {publishedRank}
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="min-w-0 truncate text-base font-semibold">{player.name}</span>
                <span className={FANTASY_CHIP_CLASS} style={getPositionTone(player.position)}>
                  {player.position}
                </span>
                {hasNote && (
                  <StickyNote
                    size={13}
                    aria-label="Has a private note"
                    style={{ color: "var(--home-ink-muted)" }}
                  />
                )}
              </div>
              <p className="mt-0.5 truncate text-sm" style={{ color: "var(--home-ink-muted)" }}>
                {descriptor}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 md:shrink-0 md:justify-end">
            <Metric label="Expert range">{formatRange(player)}</Metric>
            {adpAvailable && (
              <div className="min-w-0">
                <p className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                  ADP
                </p>
                <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                  {formatAdp(player.adp)}
                  {valueVsAdp?.signal && (
                    <span
                      className={FANTASY_CHIP_CLASS}
                      style={
                        valueVsAdp.signal === "value"
                          ? {
                              borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
                              background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper))",
                            }
                          : {
                              borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--home-rule))",
                              background: "color-mix(in srgb, var(--color-warning) 12%, var(--home-paper))",
                            }
                      }
                    >
                      {valueVsAdp.signal === "value" ? "Value" : "Reach"}{" "}
                      {valueVsAdp.delta > 0 ? `+${valueVsAdp.delta}` : valueVsAdp.delta}
                    </span>
                  )}
                </p>
              </div>
            )}
            <Metric label="Rostered">
              <span>{formatOwnership(player.ownership)}</span>
              <span className="ml-2 text-2xs font-medium" style={{ color: "var(--home-ink-muted)" }}>
                {player.byeWeek ? `Bye ${player.byeWeek}` : ""}
              </span>
            </Metric>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1 pr-2">
          <button
            type="button"
            onClick={onToggleQueue}
            aria-pressed={isQueued}
            aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            style={
              isQueued
                ? {
                    borderColor: "color-mix(in srgb, var(--home-acid) 55%, var(--home-rule))",
                    background: "color-mix(in srgb, var(--home-acid) 28%, var(--home-paper))",
                    color: "var(--home-ink)",
                  }
                : { borderColor: "var(--home-rule)", background: "transparent", color: "var(--home-ink-muted)" }
            }
          >
            <Star size={15} fill={isQueued ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onToggleCompare}
            aria-pressed={inCompare}
            disabled={compareDisabled}
            aria-label={inCompare ? `Remove ${player.name} from compare` : `Add ${player.name} to compare`}
            className="hidden h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45 sm:inline-flex"
            style={
              inCompare
                ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                : { borderColor: "var(--home-rule)", background: "transparent", color: "var(--home-ink-muted)" }
            }
          >
            <GitCompareArrows size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}
