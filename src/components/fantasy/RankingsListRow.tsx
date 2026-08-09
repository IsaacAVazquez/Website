"use client";

import { GitCompareArrows, Star, StickyNote } from "lucide-react";
import type { ReactNode } from "react";

import {
  FANTASY_CHIP_CLASS,
  formatAdp,
  formatOwnership,
  formatRange,
  getPositionTone,
  getTierRailTone,
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

/**
 * One stat in the row's metric strip.
 *
 * The desktop width is fixed rather than content-sized on purpose. These
 * numbers exist to be read down the page against other players, and a plain
 * flex box sized each one to its own value, so the columns wandered across 60
 * rows. Narrow rows use an auto-fitting grid instead, because the full fixed
 * strip costs 320px before the row has that much room.
 */
function Metric({
  label,
  desktopWidthClass,
  children,
}: {
  label: string;
  desktopWidthClass: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 ${desktopWidthClass}`}>
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
 * carries a signal left accent so the watchlist reads inline.
 *
 * Compare shows at every width. It used to be `hidden sm:inline-flex`, which
 * left 62 compare toggles in the DOM at 390px and none of them visible, so the
 * only way into compare on a phone was to open the drawer, tap Compare, close
 * it, find the second player, and repeat. The metric strip reflows above the
 * action cluster at that width, so the second 44px button fits.
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
  return (
    // The row measures its own width rather than the viewport's, because the
    // width it gets is not monotonic in viewport width. The board card runs the
    // full page at 768px and the list is 670px wide, then the rail appears at
    // 1024px and the same list drops to 538px. On viewport breakpoints the row
    // took its wide inline shape at 768 and kept it through 1024, where it does
    // not fit: names truncated to "Christian McCaff...", the position chip and
    // the descriptor each fell to their own line, and 54 of 60 rows rendered
    // 232px tall against 82px on a desktop. @2xl is 42rem, which is what the
    // inline shape actually costs: 44px of rank, a name column worth reading,
    // 288px of metric strip, 96px of actions, and the gaps between them.
    <li
      className="group @container relative overflow-hidden rounded-[var(--radius-3xl)] border border-[color:var(--home-rule)] transition-[border-color,box-shadow,transform] hover:border-[color:var(--home-ink)] hover:shadow-[var(--shadow-md)] motion-safe:hover:-translate-y-0.5"
      style={{ background: "color-mix(in srgb, var(--home-paper-alt) 42%, var(--home-elev-mix))" }}
    >
      {/* Graded tier rail: intensity fades with tier depth so the board reads
          "signal as data" at a glance. A second, full-signal layer sits on
          top and only shows on queue or hover, overriding the base grade
          rather than blending with it. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: `color-mix(in srgb, var(--home-signal) ${getTierRailTone(player.tier)}, transparent)` }}
      />
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[3px] bg-[var(--home-signal)] transition-opacity ${
          isQueued ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />
      {/*
        A two-column grid below md and a single flex row from md up. The action
        pair used to be a full-height sibling column at every width, which at
        390px reserved 100px of a 316px row for two icon buttons and left the
        metric strip 184px to work in. The strip wrapped to two lines, the row
        grew to 223px, and the name was capped at 105px, so "Colston Loveland"
        rendered as an ellipsis. Placing the actions at top right and giving the
        strip both columns on row two hands the metrics the full width and the
        name most of one line back.

        DOM order is unchanged, so nothing moves for keyboard or assistive
        technology: the row overlay button, then queue, then compare, in that
        order, at every width. Grid placement is inert once the container
        switches to flex at md, so the desktop row keeps its old shape.
      */}
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start @2xl:flex @2xl:items-stretch @2xl:gap-4">
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`Open ${player.name} detail, ${player.position}, rank ${publishedRank}`}
          className="absolute inset-0 z-0 rounded-[var(--radius-3xl)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--home-ink)]"
        />
        <div
          className={`col-start-1 row-start-1 flex min-w-0 flex-1 text-left ${
            compact ? "px-4 pt-2.5 @2xl:py-2.5" : "px-4 pt-3.5 @2xl:py-3.5"
          }`}
        >
          <div className="pointer-events-none relative z-10 flex min-w-0 items-center gap-3 @2xl:flex-1">
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
              {/* Only this line clears the action pair, which now floats at the
                  row's top right rather than holding a grid column. The
                  descriptor below it gets the row's full width. */}
              <div className="flex min-w-0 flex-wrap items-center gap-2 pr-20 @2xl:pr-0">
                {/* Wraps below md and truncates from md up. On a phone the name
                    had 105px and "Colston Loveland" came out "Colston Lovela...",
                    which is a worse answer than a second line. */}
                <span className="min-w-0 text-base font-semibold @2xl:truncate">{player.name}</span>
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
              {/* Not truncated: the Avg+Value pair lives here and must stay
                  visible. The Avg/Value segment is an inline-flex unit, so it
                  wraps to the next line together rather than getting clipped. */}
              <p className="mt-0.5 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                {descriptor}
              </p>
            </div>
          </div>
        </div>

        {/* Both columns of row two, auto-fitting until the full desktop strip fits. */}
        <div
          className={`pointer-events-none relative z-10 col-span-2 col-start-1 row-start-2 grid w-full grid-cols-[repeat(auto-fit,minmax(6.25rem,1fr))] items-start gap-x-4 gap-y-2 px-4 @2xl:col-auto @2xl:row-auto @2xl:flex @2xl:w-auto @2xl:shrink-0 @2xl:items-center @2xl:justify-end @2xl:px-0 ${
            compact ? "pb-2.5 @2xl:pb-0" : "pb-3.5 @2xl:pb-0"
          }`}
        >
          <Metric label="Expert range" desktopWidthClass="@2xl:w-[6.5rem] @2xl:shrink-0">
            {formatRange(player)}
          </Metric>
          {adpAvailable && (
            <Metric label="ADP" desktopWidthClass="@2xl:w-[3.25rem] @2xl:shrink-0">
              {formatAdp(player.adp)}
            </Metric>
          )}
          <Metric label="Rostered" desktopWidthClass="@2xl:w-[6.25rem] @2xl:shrink-0">
            <span>{formatOwnership(player.ownership)}</span>
            <span className="ml-2 text-2xs font-medium" style={{ color: "var(--home-ink-muted)" }}>
              {player.byeWeek ? `Bye ${player.byeWeek}` : ""}
            </span>
          </Metric>
        </div>

        {/* Floated to the top right below md rather than holding a grid column.
            As a column it cost 100px of a 316px row, which left the name 126px
            and the descriptor the same 126px, so every one of the 60 rows spent
            a second line on "CIN · WR1 · Avg 1.81" and rows came out at 172,
            193, 196 and 218px for content that is the same shape every time.
            Out of flow, the descriptor gets the full width on one line and only
            the name line pays for the buttons. z-10 keeps the pair above the
            row's absolute overlay button, which spans the whole row. */}
        <div className="absolute right-1 top-3 z-10 flex shrink-0 items-center gap-1 @2xl:static @2xl:col-auto @2xl:row-auto @2xl:pr-2 @2xl:pt-0">
          <button
            type="button"
            onClick={onToggleQueue}
            aria-pressed={isQueued}
            aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border transition-colors"
            style={
              isQueued
                ? {
                    borderColor: "color-mix(in srgb, var(--home-signal) 55%, var(--home-rule))",
                    background: "color-mix(in srgb, var(--home-signal) 28%, var(--home-paper))",
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
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45"
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
