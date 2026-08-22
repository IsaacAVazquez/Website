"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, GitCompareArrows, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useCompareTray } from "@/hooks/useCompareTray";
import { getPositionTone } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import { CompareModal } from "./CompareModal";

interface CompareTrayProps {
  resolvePlayer: (id: string) => Player | undefined;
  /** True only after the complete player snapshot can resolve persisted IDs. */
  playerDataReady?: boolean;
  /** Remove unresolved IDs only when this surface has the complete shared player universe. */
  pruneUnresolvedIds?: boolean;
  publishedRank?: (player: Player) => string;
  /** Passed through to CompareModal — see PlayerDetailDrawer for the rationale. */
  valueSignalAvailable?: boolean;
  /** Whether the current ADP source is fresh enough to display or compare. */
  adpAvailable?: boolean;
}

/**
 * A docked bottom bar that surfaces the compare selection from anywhere on the
 * page and opens the side-by-side modal. Renders nothing until at least one
 * player is pinned, so it never steals space during normal browsing.
 *
 * Once populated it is a fixed band across the bottom of the viewport, which
 * costs a phone about 100px of thumb zone, so it can be collapsed to a single
 * pill. Collapsing is component state rather than stored state on purpose: it
 * hides the bar without touching the pinned ids, so minimizing the tray and
 * clearing it stay separate actions.
 */
export function CompareTray({
  resolvePlayer,
  playerDataReady = false,
  pruneUnresolvedIds = true,
  publishedRank,
  valueSignalAvailable = true,
  adpAvailable = true,
}: CompareTrayProps) {
  const reduceMotion = useReducedMotion();
  const compare = useCompareTray();
  const compareIds = compare.compareIds;
  const replaceCompare = compare.replace;
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const players = useMemo(
    () =>
      compareIds
        .map((id) => resolvePlayer(id))
        .filter((player): player is Player => Boolean(player)),
    [compareIds, resolvePlayer]
  );

  useEffect(() => {
    if (!playerDataReady || !pruneUnresolvedIds || players.length === compareIds.length) return;
    replaceCompare(players.map((player) => player.id));
  }, [compareIds.length, playerDataReady, players, pruneUnresolvedIds, replaceCompare]);

  const canCompare = players.length >= 2;
  const hiddenCount = compareIds.length - players.length;
  const showHiddenSelections = playerDataReady && players.length === 0 && hiddenCount > 0;
  const trayVisible = players.length > 0 || showHiddenSelections;

  return (
    <>
      <AnimatePresence>
        {trayVisible && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed inset-x-0 bottom-0 z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            {/*
              The bar aligns to the same content column as the page it floats
              over. It used to be a max-w-3xl box centred in the viewport, so at
              1440 it sat at x=336 in a page whose cards run 32 to 1408, lining
              up with nothing, and the chips wrapped to a second row with 600px
              of the bar's own width unused. home-shell-wide is what both boards
              wrap themselves in, so the tray's edges now land on the board
              card's edges at every width.
            */}
            <div className="home-shell home-shell-wide flex justify-center">
            {showHiddenSelections ? (
              <div
                className="flex w-full items-center gap-3 rounded-[var(--radius-3xl)] border px-4 py-3"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper) 94%, var(--home-elev-mix))",
                  boxShadow: "var(--shadow-lg)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <p role="status" className="flex-1 text-sm font-semibold">
                  {hiddenCount} {hiddenCount === 1 ? "player is" : "players are"} pinned on another fantasy board.
                </p>
                <button
                  type="button"
                  onClick={() => compare.clear()}
                  className="inline-flex min-h-touch items-center rounded-full border px-4 text-sm font-semibold"
                  style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
                >
                  Clear compare
                </button>
              </div>
            ) : collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-expanded={false}
                aria-label={`Compare ${players.length}, show the tray`}
                className="inline-flex min-h-touch items-center gap-2 rounded-full border px-4 text-sm font-semibold"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper) 94%, var(--home-elev-mix))",
                  boxShadow: "var(--shadow-lg)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <GitCompareArrows size={16} aria-hidden="true" />
                Compare {players.length}
              </button>
            ) : (
            <div
              className="flex w-full flex-wrap items-center gap-2 rounded-[var(--radius-3xl)] border px-3 py-2.5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 94%, var(--home-elev-mix))",
                boxShadow: "var(--shadow-lg)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="home-kicker mb-0 hidden sm:block">Compare</span>
              {/*
                Below sm the names yield and the bar states a count instead.
                Each chip is 44px tall because its remove button is, so three
                pinned stacked one per row and pushed the minimize button onto a
                fourth, measuring 236px of an 844px viewport with the board
                heading and the whole position filter underneath it. A tray that
                covers the board is not a tray. Nothing is lost, because the
                names are in the modal this bar opens and every board row's own
                compare toggle still removes a player.
              */}
              <p className="flex-1 text-sm font-semibold tabular-nums sm:hidden">
                {hiddenCount > 0
                  ? `${players.length} here, ${hiddenCount} elsewhere`
                  : `${players.length} pinned`}
              </p>
              {/*
                No min-w-0 here. With it, this flex item was allowed to shrink
                below its own content instead of pushing the actions onto the
                next line, so at 390px with three pinned the chips overflowed
                their box and "Clear" landed on top of the second chip's remove
                button, two buttons sharing one 43x44 rectangle and one of them
                destructive. Letting the min-content width hold means the outer
                flex-wrap does the work it was already there to do.
              */}
              <div className="hidden flex-1 flex-wrap items-center gap-1.5 sm:flex">
                {players.map((player) => (
                  <span
                    key={player.id}
                    /*
                      The chip is 44px tall because its remove button is. The
                      button used to claw that back with -my-3, which left a
                      30px chip carrying a 44px target that overhung 8px top and
                      bottom, so stacked chips' hit areas overlapped each other
                      by 8px. A chip that matches the height of the Clear and
                      Compare buttons beside it also gives the whole band one
                      cadence instead of two.
                    */
                    className="inline-flex items-center gap-1 rounded-full border py-0 pl-3 pr-0 text-xs font-semibold"
                    style={{ borderColor: "var(--home-rule)", ...getPositionTone(player.position) }}
                  >
                    {/* 8rem cut "Jaxon Smith-Njigba" and "Marvin Harrison Jr."
                        down to stubs that read almost the same. 12rem clears
                        the longest names on the board, and the title carries
                        the full name for whatever still overflows. */}
                    <span className="max-w-[12rem] truncate" title={player.name}>
                      {player.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => compare.remove(player.id)}
                      aria-label={`Remove ${player.name} from compare`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "color-mix(in srgb, var(--home-ink) 8%, transparent)" }}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </span>
                ))}
                {hiddenCount > 0 ? (
                  <span className="px-2 text-xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                    {hiddenCount} pinned elsewhere
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => compare.clear()}
                className="inline-flex min-h-touch items-center rounded-full px-3 text-xs font-semibold"
                style={{ color: "var(--home-ink-muted)" }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={!canCompare}
                className="inline-flex min-h-touch items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
                style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                title={canCompare ? undefined : "Pin at least two players"}
              >
                <GitCompareArrows size={16} aria-hidden="true" />
                Compare {players.length}
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-expanded
                aria-label="Minimize the compare tray"
                className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border"
                style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
              >
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        The bar is fixed, so it cannot push anything, and the page carried no
        bottom padding to compensate. With a player pinned the last 132px of the
        page sat under it permanently. This reserves that space at the end of
        whichever surface renders the tray.
        ponytail: a fixed 5rem covers the one-row bar at phone and desktop
        widths; measure the bar and set the value from it if it ever grows a
        second row at those widths.
      */}
      {trayVisible && <div aria-hidden="true" className="h-20" />}

      {open && canCompare && (
        <CompareModal
          players={players}
          publishedRank={publishedRank}
          valueSignalAvailable={valueSignalAvailable}
          adpAvailable={adpAvailable}
          onClose={() => setOpen(false)}
          onRemove={(id) => {
            compare.remove(id);
            if (players.length <= 2) setOpen(false);
          }}
        />
      )}
    </>
  );
}
