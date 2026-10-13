"use client";

import { ChevronDown, GitCompareArrows, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

  return (
    <>
      {trayVisible && isCollapsed && (
        <div className="ffb-ov-tray-min ffb-enter-rise">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
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
        <div className="ffb-tray ffb-enter-rise">
          {/* The row sits on the page column (SHELL_CLASS), so the tray's ends
              land on the board's edges at every width. */}
          <div className={`${SHELL_CLASS} ffb-tray-row ffb-ov-tray-row`}>
            {showHiddenSelections ? (
              <>
                <p role="status" className="ffb-ov-tray-text">
                  {hiddenCount} {hiddenCount === 1 ? "player is" : "players are"} pinned on another fantasy board.
                </p>
                <button type="button" onClick={() => compare.clear()} className="ffb-btn">
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
                  {players.map((player) => (
                    <li key={player.id} className={`ffb-sticker ffb-sticker-sm ffb-ov-pin ${positionClass(player.position)}`}>
                      <span className="ffb-sticker-meta">
                        {player.position}
                        {player.team ? ` · ${player.team}` : ""}
                      </span>
                      {/* The title carries the full name for whatever the
                          sticker has to cut. */}
                      <span className="ffb-sticker-name" title={player.name}>
                        {player.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => compare.remove(player.id)}
                        aria-label={`Remove ${player.name} from compare`}
                        className="ffb-iconbtn ffb-ov-pin-remove"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                  {hiddenCount > 0 ? <li className="ffb-ov-pins-note">{hiddenCount} pinned elsewhere</li> : null}
                </ul>
                <button type="button" onClick={() => compare.clear()} className="ffb-btn ffb-btn-quiet">
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  disabled={!canCompare}
                  className="ffb-btn ffb-btn-primary"
                  title={canCompare ? undefined : "Pin at least two players"}
                >
                  <GitCompareArrows size={14} aria-hidden="true" />
                  Compare {players.length}
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
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
            compare.remove(id);
            if (players.length <= 2) setOpen(false);
          }}
        />
      )}
    </>
  );
}
