"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy/PositionFilterBar";
import { positionClass } from "@/components/fantasy/positionClass";
import { useDebounce } from "@/hooks/useDebounce";
import type { RankedBestBallPlayer } from "@/lib/bestBall/types";
import { formatRankValue } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE";

const POSITION_OPTIONS: PositionFilterOption<PositionFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "QB", label: "QB", position: "QB" },
  { value: "RB", label: "RB", position: "RB" },
  { value: "WR", label: "WR", position: "WR" },
  { value: "TE", label: "TE", position: "TE" },
];

function formatBoardAdp(player: RankedBestBallPlayer, missingLabel: string): string {
  if (player.isUndraftedAtContestFloor) return "Undrafted";
  return player.adp?.toFixed(1) ?? missingLabel;
}

export function BestBallDraftBoard({
  players,
  currentPick,
  turnPick = null,
  pinnedTop = 0,
  isComplete,
  adpAvailable,
  onDraftPlayer,
  onOpenDetail,
}: {
  players: readonly RankedBestBallPlayer[];
  currentPick: number;
  /**
   * The user's turn the board marks: the next one, or the one after it while
   * the user is on the clock. The line sits where that pick lands if the room
   * drafts down this board.
   */
  turnPick?: number | null;
  /** The height of what is pinned above the board (the scorebug), so a search can bring the board back under it. */
  pinnedTop?: number;
  isComplete: boolean;
  adpAvailable: boolean;
  onDraftPlayer: (player: Player) => void;
  onOpenDetail: (player: RankedBestBallPlayer) => void;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [visibleCount, setVisibleCount] = useState(120);
  // On a phone the bar is one row, so the search starts as an icon and opens
  // in place over the position switch. From 768px the field is always shown.
  const [searchOpen, setSearchOpen] = useState(false);
  const searchId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const rowsRef = useRef<HTMLOListElement>(null);
  const boardRef = useRef<HTMLElement>(null);
  // Index of the row whose Draft button was pressed. The button leaves the DOM
  // with the pick, so once the list re-renders focus moves to the Draft button
  // of the row that slid into its place, without scrolling, because scroll
  // anchoring already holds the rows where they were. Picks that come from a
  // fit or the drawer are the room's to place.
  const pendingFocusIndexRef = useRef<number | null>(null);
  // Same 200ms the redraft board uses, so typing does not refilter per keystroke.
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    const index = pendingFocusIndexRef.current;
    if (index === null) return;
    pendingFocusIndexRef.current = null;
    const buttons = rowsRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[data-testid="best-ball-board-draft"]:not(:disabled)'
    );
    if (!buttons || buttons.length === 0) return;
    buttons[Math.min(index, buttons.length - 1)].focus({ preventScroll: true });
  }, [players]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
    searchToggleRef.current?.focus();
  }

  // "Clear search" leaves with the empty state it sits in, so the search takes
  // the focus: the field where it shows, and its button on a phone, where the
  // field is folded away.
  function clearSearch() {
    setQuery("");
    setPosition("ALL");
    const input = searchInputRef.current;
    const field = input?.parentElement;
    if (input && field && getComputedStyle(field).display !== "none") input.focus();
    else searchToggleRef.current?.focus();
  }

  // "Show 100 more" leaves once every match is on screen, so the first row it
  // added takes the focus, without a scroll, since the row lands where the
  // button was.
  const pendingMoreIndexRef = useRef<number | null>(null);
  useEffect(() => {
    const index = pendingMoreIndexRef.current;
    if (index === null) return;
    pendingMoreIndexRef.current = null;
    const names = rowsRef.current?.querySelectorAll<HTMLButtonElement>(
      'button[data-testid="best-ball-board-player-name"]'
    );
    names?.[index]?.focus({ preventScroll: true });
  }, [visibleCount]);

  const filteredPlayers = useMemo(() => {
    const tokens = debouncedQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return players.filter((player) => {
      if (position !== "ALL" && player.position !== position) return false;
      if (tokens.length === 0) return true;
      const searchable = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return tokens.every((token) => searchable.includes(token));
    });
  }, [players, position, debouncedQuery]);

  // A search or a position change shortens the list. With the page scrolled
  // past the board's start, the list would end above the screen and take the
  // pinned search with it, so the board's start comes back under the scorebug.
  // Focus stays where it is, in the field or on the switch.
  const filterKey = `${position}|${debouncedQuery.trim().toLowerCase()}`;
  const appliedFilterRef = useRef(filterKey);
  useEffect(() => {
    if (appliedFilterRef.current === filterKey) return;
    appliedFilterRef.current = filterKey;
    const board = boardRef.current;
    if (!board) return;
    const start = Math.max(0, board.getBoundingClientRect().top + window.scrollY - pinnedTop);
    if (window.scrollY > start + 1) window.scrollTo({ top: start, behavior: "instant" });
  }, [filterKey, pinnedTop]);

  const shownPlayers = filteredPlayers.slice(0, visibleCount);
  // Where the board stands when the user's turn comes back, if every pick until
  // then follows this board. A filter or a search breaks that reading, so the
  // line shows on the whole board only, as it does in the redraft room.
  const picksBeforeTurn =
    turnPick !== null && position === "ALL" && debouncedQuery.trim() === ""
      ? turnPick - currentPick
      : 0;
  const turnPlayerId = picksBeforeTurn > 0 ? shownPlayers[picksBeforeTurn]?.id : undefined;

  return (
    <section
      ref={boardRef}
      className={`ffb-board ffb-board-room ffb-board-log ffb-board-ruled ffb-board-tight ffb-br-board${adpAvailable ? "" : " ffb-br-no-adp"}`}
      aria-labelledby="best-ball-player-board-heading"
    >
      {/* The section's name. The pinned toolbar under it carries the count. */}
      <h2 id="best-ball-player-board-heading" className="ffb-vh">
        Log the player selected
      </h2>

      {/*
        The board runs 120 to 300 rows against a pick clock, so search, the
        position switch, and the column labels hold their place under the
        scorebug at every width. The block is a kit sticky bar, which reads
        the scorebug's measured height from --ffb-sticky-top.
      */}
      <div data-testid="best-ball-board-controls" className="ffb-sticky ffb-sticky-ruled">
        <div className={searchOpen ? "ffb-toolbar ffb-br-tools ffb-br-searching" : "ffb-toolbar ffb-br-tools"}>
          <button
            ref={searchToggleRef}
            type="button"
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            aria-expanded={searchOpen}
            aria-controls={searchId}
            aria-label={searchOpen ? "Close search" : "Search available players"}
            className="ffb-iconbtn ffb-iconbtn-edge ffb-only-phone"
          >
            {searchOpen ? <X size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
          </button>
          <PositionFilterBar
            ariaLabel="Filter by position"
            options={POSITION_OPTIONS}
            value={position}
            onChange={setPosition}
          />
          <label className="ffb-search">
            <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M12.8 12.8L17 17" />
            </svg>
            <span className="ffb-vh">Search available players</span>
            <input
              id={searchId}
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query === "" && searchOpen) {
                  event.preventDefault();
                  closeSearch();
                }
              }}
              autoComplete="off"
              placeholder="Search name or team"
              className="ffb-search-input"
            />
          </label>
          {/* The board's one live region, and the feedback that a search or a filter landed, where the field is. */}
          <p className="ffb-count" aria-live="polite">
            {filteredPlayers.length} of {players.length} available
          </p>
        </div>

        {shownPlayers.length > 0 ? (
          <div
            data-testid="best-ball-board-column-labels"
            aria-hidden="true"
            className="ffb-colhead ffb-not-phone"
          >
            {/* With no room ADP the board has one number, the source's own rank. */}
            <span className="ffb-h-num ffb-is-sorted">{adpAvailable ? "Rk" : "Source rank"}</span>
            <span className="ffb-h-pos">Pos</span>
            <span>Player</span>
            <span>Team</span>
            <span className="ffb-h-num">Bye</span>
            {adpAvailable ? (
              <>
                <span className="ffb-h-num">UD ADP</span>
                <span className="ffb-h-num">PPR ECR</span>
              </>
            ) : null}
            <span />
          </div>
        ) : null}
      </div>

      {shownPlayers.length > 0 ? (
        <ol className="ffb-rows" ref={rowsRef}>
          {shownPlayers.map((player, index) => {
            // A row the board orders off its ADP says why under the name. On
            // every other row the sentence restates the ordering column, so it
            // stays in that cell's title.
            const explainsOrder = player.isUndraftedAtContestFloor || player.consensusWithheld;
            const hasReason = player.rankAdjustment !== 0 || explainsOrder;
            const reasonProps = {
              title: hasReason ? player.rankReason : undefined,
              "data-consensus-withheld": hasReason && player.consensusWithheld ? "true" : undefined,
            };
            return (
              <Fragment key={player.id}>
              {player.id === turnPlayerId ? (
                <li className="ffb-turnline">
                  <span className="ffb-turn-tab">Your turn #{turnPick}</span>{" "}
                  <span className="ffb-turn-note">if picks follow this board</span>
                </li>
              ) : null}
              <li className="ffb-row">
                {/* With a room ADP the rank is the board's own order. Without one the
                    board has one number, the source's rank, which it orders by. */}
                {adpAvailable ? (
                  <span className="ffb-c-rank">
                    <span className="ffb-vh">Board rank </span>
                    {player.bestBallRank}
                  </span>
                ) : (
                  <span className="ffb-c-rank" {...reasonProps}>
                    <span className="ffb-vh">Source rank </span>
                    {player.adjustedRank.toFixed(0)}
                  </span>
                )}
                {/* A withheld consensus takes its position rank with it, so the chip prints the letters alone. */}
                <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
                  {player.position}
                  {player.consensusWithheld ? "" : (player.positionRank ?? "")}
                </span>
                {/* The name opens the detail drawer. Only the Draft button at the
                    end of the row logs the pick, so a stray tap cannot record a
                    player unseen. */}
                <button
                  type="button"
                  onClick={() => onOpenDetail(player)}
                  aria-label={`Open ${player.name} detail`}
                  data-testid="best-ball-board-player-name"
                  className="ffb-c-name"
                >
                  {player.name}
                </button>
                <span className="ffb-c-team">
                  <span className="ffb-vh">Team </span>
                  {player.team}
                </span>
                {/* A phone row has no room to say a bye is unknown, so it leaves the cell out. */}
                <span className={player.byeWeek == null ? "ffb-c-bye ffb-not-phone" : "ffb-c-bye"}>
                  {/* A phone row prints the word, and a desktop row has it in the column head. */}
                  <span className="ffb-vh-desk">Bye </span>
                  {player.byeWeek ?? "Unknown"}
                </span>
                {/*
                  The column heads are a sibling row, not table headers, so
                  nothing ties them to a cell. The label is inside the cell it
                  names, spoken in full because the row gives the acronym no
                  context, and it hides with the cell on a phone, where the
                  cell after this one prints the label itself.
                */}
                {adpAvailable ? (
                  <>
                    <span className="ffb-c-num ffb-is-flat" {...reasonProps}>
                      <span className="ffb-vh">Underdog average draft position </span>
                      {formatBoardAdp(player, "Not matched")}
                    </span>
                    {/* The consensus rank, which the market's order sits beside. A
                        withheld consensus prints the word and never the number. */}
                    <span
                      className="ffb-c-num ffb-is-flat"
                      title={
                        player.consensusWithheld
                          ? "The published consensus rank sits outside its own expert range, so it is withheld"
                          : "PPR best ball expert consensus rank"
                      }
                    >
                      <span className="ffb-vh">PPR expert consensus rank </span>
                      {player.consensusWithheld ? (
                        <span className="ffb-label">Withheld</span>
                      ) : (
                        formatRankValue(player.bestBallEcr)
                      )}
                    </span>
                    {/* A phone row has room for one number after the bye, and this room's number is the market's. */}
                    <span className="ffb-c-num ffb-m-meta ffb-only-phone">
                      ADP {formatBoardAdp(player, "not available")}
                    </span>
                  </>
                ) : null}
                <button
                  type="button"
                  data-testid="best-ball-board-draft"
                  onClick={() => {
                    pendingFocusIndexRef.current = index;
                    onDraftPlayer(player);
                  }}
                  disabled={isComplete}
                  aria-label={`Draft ${player.name} at pick ${currentPick}`}
                  className="ffb-log"
                >
                  Draft
                </button>
                {explainsOrder ? (
                  <span className="ffb-br-why ffb-not-phone" title={player.rankReason}>
                    {player.rankReason}
                  </span>
                ) : null}
              </li>
              </Fragment>
            );
          })}
        </ol>
      ) : (
        <div className="ffb-empty">
          <p className="ffb-empty-title">No available player matches this search.</p>
          {query || position !== "ALL" ? (
            <button
              type="button"
              onClick={clearSearch}
              className="ffb-btn"
            >
              Clear search
            </button>
          ) : null}
        </div>
      )}

      {shownPlayers.length < filteredPlayers.length ? (
        <button
          type="button"
          onClick={() => {
            pendingMoreIndexRef.current = shownPlayers.length;
            setVisibleCount((count) => count + 100);
          }}
          className="ffb-more"
        >
          Show 100 more players
        </button>
      ) : null}
    </section>
  );
}
