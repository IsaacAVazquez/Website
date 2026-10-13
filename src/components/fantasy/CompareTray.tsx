"use client";

import { ChevronDown, GitCompareArrows, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCompareTray } from "@/hooks/useCompareTray";
import { SHELL_CLASS } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import { CompareModal } from "./CompareModal";
import "./fantasy-overlays.css";
import { positionClass } from "./positionClass";

interface CompareTrayProps {
  resolvePlayer: (id: string) => Player | undefined;
  /** True only after the complete player snapshot can resolve persisted IDs. */
  playerDataReady?: boolean;
  /** Remove unresolved IDs only when this surface has the complete shared player universe. */
  pruneUnresolvedIds?: boolean;
  publishedRank?: (player: Player) => string;
  /** Passed through to CompareModal, which names the rank row after it. */
  publishedRankLabel?: string;
  /** Passed through to CompareModal, which withholds the consensus rows for these players. */
  consensusWithheld?: (player: Player) => boolean;
  /** Passed through to CompareModal, see PlayerDetailDrawer for the rationale. */
  valueSignalAvailable?: boolean;
  /** Whether the current ADP source is fresh enough to display or compare. */
  adpAvailable?: boolean;
}

/**
 * Where focus goes after a control that takes itself away: the pill after
 * minimize, the Compare button after expand, the pin that moved into a removed
 * pin's place after a remove.
 */
type FocusMove = { to: "pill" } | { to: "compare" } | { to: "pin"; removedId: string; index: number };

/** Focuses the first of these that can take focus. A disabled button and a hidden pin cannot. */
function focusFirst(candidates: Array<HTMLElement | null | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    candidate.focus();
    if (document.activeElement === candidate) return;
  }
}

/**
 * A band pinned to the bottom of the screen that holds the compare selection
 * and opens the side by side modal. It renders nothing until a player is
 * pinned, so it takes no room during normal browsing.
 *
 * The band costs a phone about 60px of thumb zone, so it can be collapsed to
 * one button. Collapsing is component state and not stored state on purpose,
 * since it hides the band without touching the pinned ids, and minimizing the
 * tray and clearing it stay separate actions.
 */
export function CompareTray({
  resolvePlayer,
  playerDataReady = false,
  pruneUnresolvedIds = true,
  publishedRank,
  publishedRankLabel,
  consensusWithheld,
  valueSignalAvailable = true,
  adpAvailable = true,
}: CompareTrayProps) {
  const compare = useCompareTray();
  const compareIds = compare.compareIds;
  const replaceCompare = compare.replace;
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const bandRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const focusMove = useRef<FocusMove | null>(null);

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
  const isCollapsed = collapsed && !showHiddenSelections;

  // Minimize, expand, and remove each unmount the control that was pressed,
  // which would drop a keyboard user's focus onto the page. This runs after
  // the render that follows and hands focus to the control that took its place.
  useEffect(() => {
    const move = focusMove.current;
    if (!move) return;
    // The compare store has not dropped the pin yet, so its button is still here.
    if (move.to === "pin" && compareIds.includes(move.removedId)) return;
    focusMove.current = null;
    if (move.to === "pill") {
      pillRef.current?.focus();
      return;
    }
    const band = bandRef.current;
    if (!band) return;
    const all = (selector: string) => Array.from(band.querySelectorAll<HTMLElement>(selector));
    const clear = all("[data-compare-clear]");
    if (move.to === "compare") {
      focusFirst([...all("[data-compare-open]"), ...clear]);
      return;
    }
    const pins = all("[data-compare-remove]");
    focusFirst([pins[move.index] ?? pins[pins.length - 1], ...clear]);
  });

  return (
    <>
      {trayVisible && isCollapsed && (
        <div className="ffb-ov-tray-min ffb-enter-rise">
          <button
            ref={pillRef}
            type="button"
            onClick={() => {
              focusMove.current = { to: "compare" };
              setCollapsed(false);
            }}
            aria-expanded={false}
            aria-label={`Compare ${players.length}, show the tray`}
            className="ffb-btn ffb-ov-tray-pill"
          >
            <GitCompareArrows size={14} aria-hidden="true" />
            Compare {players.length}
          </button>
        </div>
      )}

      {trayVisible && !isCollapsed && (
        <div ref={bandRef} className="ffb-tray ffb-enter-rise" role="group" aria-label="Compare">
          {/* The row sits on the page column (SHELL_CLASS), so the tray's ends
              land on the board's edges at every width. */}
          <div className={`${SHELL_CLASS} ffb-tray-row`}>
            {showHiddenSelections ? (
              <>
                <p role="status" className="ffb-ov-tray-text">
                  {hiddenCount} {hiddenCount === 1 ? "player is" : "players are"} pinned on another fantasy board.
                </p>
                <button type="button" onClick={() => compare.clear()} className="ffb-btn" data-compare-clear>
                  Clear compare
                </button>
              </>
            ) : (
              <>
                <span className="ffb-label ffb-not-phone">Compare</span>
                {/* On a phone the stickers yield to a count. Each sticker
                    carries a 44px remove button there, and three of them do
                    not fit one row, so the band grew to cover the board.
                    Nothing is lost, since the names are in the modal this
                    band opens and each board row's own compare toggle still
                    removes a player. */}
                <p className="ffb-ov-tray-text ffb-only-phone">
                  {hiddenCount > 0
                    ? `${players.length} here, ${hiddenCount} elsewhere`
                    : `${players.length} pinned`}
                </p>
                <ul className="ffb-ov-pins ffb-not-phone">
                  {players.map((player, index) => (
                    <li key={player.id} className={`ffb-sticker ffb-sticker-sm ffb-sticker-pin ${positionClass(player.position)}`}>
                      <span className="ffb-sticker-meta">
                        {player.position}
                        {player.team ? ` · ${player.team}` : ""}
                      </span>{" "}
                      {/* The title carries the full name for whatever the
                          sticker has to cut. */}
                      <span className="ffb-sticker-name" title={player.name}>
                        {player.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          focusMove.current = { to: "pin", removedId: player.id, index };
                          compare.remove(player.id);
                        }}
                        aria-label={`Remove ${player.name} from compare`}
                        className="ffb-iconbtn ffb-sticker-remove"
                        data-compare-remove
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                  {hiddenCount > 0 ? <li className="ffb-ov-pins-note">{hiddenCount} pinned elsewhere</li> : null}
                </ul>
                <button
                  type="button"
                  onClick={() => compare.clear()}
                  aria-label="Clear compare"
                  className="ffb-btn ffb-btn-quiet"
                  data-compare-clear
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  disabled={!canCompare}
                  className="ffb-btn ffb-btn-primary"
                  data-compare-open
                  title={canCompare ? undefined : "Pin at least two players"}
                >
                  <GitCompareArrows size={14} aria-hidden="true" />
                  Compare {players.length}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    focusMove.current = { to: "pill" };
                    setCollapsed(true);
                  }}
                  aria-expanded
                  aria-label="Minimize the compare tray"
                  className="ffb-iconbtn ffb-iconbtn-edge"
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* The band is fixed, so it cannot push anything. This reserves its
          height at the end of whichever page renders the tray.
          ponytail: the kit's fixed 80px covers the one-row band at phone and
          desktop widths. Measure the band and set the value from it if it
          ever grows a second row. */}
      {trayVisible && <div aria-hidden="true" className="ffb-tray-space" />}

      {open && canCompare && (
        <CompareModal
          players={players}
          publishedRank={publishedRank}
          publishedRankLabel={publishedRankLabel}
          consensusWithheld={consensusWithheld}
          valueSignalAvailable={valueSignalAvailable}
          adpAvailable={adpAvailable}
          onClose={() => setOpen(false)}
          onRemove={(id) => {
            // At two players a remove closes the modal, and the Compare button
            // it opened from is disabled by then, so focus goes to the pin left.
            if (players.length <= 2) {
              focusMove.current = { to: "pin", removedId: id, index: 0 };
              setOpen(false);
            }
            compare.remove(id);
          }}
        />
      )}
    </>
  );
}
