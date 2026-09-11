"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import type { RankedBestBallPlayer } from "@/lib/bestBall/types";
import type { Player } from "@/types";

type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE";

const POSITION_FILTERS: readonly PositionFilter[] = ["ALL", "QB", "RB", "WR", "TE"];

const ROW_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
} as const;

// The pinned control band has to be opaque so rows pass underneath it, and it
// sits inside the card, so it takes the card's own surface rather than paper.
const STICKY_BAND_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
} as const;

const ICON_BUTTON_CLASS =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-paper)]";

// The chip already prints the position, so hue was carrying nothing the label
// wasn't. DESIGN.md sends categorical needs to ink and stone and keeps signal,
// positive, and warning for status, so a green RB and an amber TE no longer
// read as "good" and "caution" to anyone who learned those colors elsewhere on
// the site. This also retires the last --home-moss in the fantasy tree.
const POSITION_CHIP_STYLE = {
  borderColor: "color-mix(in srgb, var(--home-ink) 24%, var(--home-rule))",
  color: "var(--home-ink)",
} as const;

function formatBoardAdp(player: RankedBestBallPlayer, missingLabel: string): string {
  if (player.isUndraftedAtContestFloor) return "Undrafted";
  return player.adp?.toFixed(1) ?? missingLabel;
}

export function BestBallDraftBoard({
  players,
  currentPick,
  currentTeamNumber,
  isComplete,
  adpAvailable,
  stickyTop = "4.5rem",
  onDraftPlayer,
  onOpenDetail,
}: {
  players: readonly RankedBestBallPlayer[];
  currentPick: number;
  currentTeamNumber: number | null;
  isComplete: boolean;
  adpAvailable: boolean;
  /**
   * CSS length for the control band's sticky offset. The room passes the
   * bottom edge of its live bar, which already sits on the shared fascia
   * offset, so the two never overlap.
   */
  stickyTop?: string;
  onDraftPlayer: (player: Player) => void;
  onOpenDetail: (player: RankedBestBallPlayer) => void;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [visibleCount, setVisibleCount] = useState(120);
  // Below sm the band is one row, so the search starts as an icon and expands
  // in place over the position pills. Above sm the input is always shown.
  const [searchOpen, setSearchOpen] = useState(false);
  const searchId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  // Index of the row whose Draft button was pressed. The button leaves the DOM
  // with the pick, so once the list re-renders focus moves to the Draft button
  // of the row that slid into its place, without scrolling, because scroll
  // anchoring already holds the rows where they were. Picks that come from a
  // card or the drawer are the room's to place.
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

  const filteredPlayers = useMemo(() => {
    const tokens = debouncedQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return players.filter((player) => {
      if (position !== "ALL" && player.position !== position) return false;
      if (tokens.length === 0) return true;
      const searchable = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return tokens.every((token) => searchable.includes(token));
    });
  }, [players, position, debouncedQuery]);

  const shownPlayers = filteredPlayers.slice(0, visibleCount);

  return (
    <section className="home-card min-w-0 overflow-clip" aria-labelledby="best-ball-player-board-heading">
      <div className="border-b p-5 sm:p-6" style={{ borderColor: "var(--home-rule)" }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="home-kicker mb-1">Room board</p>
            <h2 id="best-ball-player-board-heading" className="text-xl font-semibold">
              Log the player selected
            </h2>
          </div>
          <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
            {isComplete
              ? "Draft complete"
              : `Pick ${currentPick} belongs to slot ${currentTeamNumber}`}
          </p>
        </div>
      </div>

      {/*
        The board runs 120 to 300 rows against a pick clock, so search and the
        position filter hold their place under the live bar at every width,
        the way the best ball board's controls do. The card is overflow-clip
        rather than overflow-hidden because a hidden overflow makes the card
        the scroll container and the band would stick to nothing. The column
        labels ride with the band from sm, where they exist.
      */}
      <div
        data-testid="best-ball-board-controls"
        className="sticky z-20"
        style={{ top: stickyTop, ...STICKY_BAND_STYLE }}
      >
        <div className="border-b px-5 py-3 sm:px-6" style={{ borderColor: "var(--home-rule)" }}>
          <div className="flex items-center gap-2 sm:grid sm:grid-cols-[minmax(13rem,1fr)_auto] sm:gap-3">
            <button
              ref={searchToggleRef}
              type="button"
              onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
              aria-expanded={searchOpen}
              aria-controls={searchId}
              aria-label={searchOpen ? "Close search" : "Search available players"}
              className={`${ICON_BUTTON_CLASS} sm:hidden`}
              style={{
                borderColor: searchOpen ? "var(--home-ink)" : "var(--home-rule)",
                color: "var(--home-ink)",
              }}
            >
              {searchOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <label className={`relative min-w-0 ${searchOpen ? "block flex-1" : "hidden"} sm:block`}>
              <span className="sr-only">Search available players</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--home-ink-muted)" }}
                aria-hidden="true"
              />
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
                placeholder="Search name or team"
                className="min-h-[48px] w-full rounded-full border bg-transparent pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
              />
            </label>

            <fieldset className={`min-w-0 ${searchOpen ? "hidden sm:block" : ""}`}>
              <legend className="sr-only">Filter by position</legend>
              <div className="flex flex-wrap gap-1.5">
                {POSITION_FILTERS.map((filter) => (
                  <label
                    key={filter}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-semibold focus-within:ring-2 focus-within:ring-[var(--home-signal)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--home-paper)]"
                    style={{
                      borderColor: position === filter ? "var(--home-ink)" : "var(--home-rule)",
                      background: position === filter ? "var(--home-ink)" : "transparent",
                      color: position === filter ? "var(--home-paper)" : "var(--home-ink-muted)",
                    }}
                  >
                    <input
                      type="radio"
                      name="best-ball-position"
                      value={filter}
                      checked={position === filter}
                      onChange={() => setPosition(filter)}
                      className="sr-only"
                    />
                    {filter === "ALL" ? "All" : filter}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div
          data-testid="best-ball-board-column-labels"
          className="hidden grid-cols-[3rem_minmax(0,1fr)_4rem_4rem_6.5rem_4rem_4.5rem] gap-3 border-b px-4 py-3 text-2xs font-semibold uppercase tracking-[0.08em] sm:grid"
          style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
        >
          <span>Board</span>
          <span>Player</span>
          <span>Pos</span>
          <span>Team</span>
          <span>{adpAvailable ? "Underdog ADP" : "Source rank"}</span>
          <span>Bye</span>
          <span className="sr-only">Draft</span>
        </div>
      </div>

      <div className="grid" ref={rowsRef}>
        {shownPlayers.map((player, index) => (
          <div
            key={player.id}
            className="grid min-h-[60px] min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] items-center gap-3 border-b px-4 py-2 transition-[background-color] duration-150 hover:bg-[var(--home-paper-alt)] sm:grid-cols-[3rem_minmax(0,1fr)_4rem_4rem_6.5rem_4rem_4.5rem]"
            style={ROW_STYLE}
          >
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
              <span className="sr-only">{"Board rank "}</span>
              {player.bestBallRank}
            </span>
            <span className="min-w-0">
              {/* -my keeps the row dense while the button itself meets the 44px
                  touch floor. The name opens the detail drawer; only the Draft
                  button at the end of the row logs the pick, so a stray tap can
                  no longer record a player unseen. */}
              <button
                type="button"
                onClick={() => onOpenDetail(player)}
                aria-label={`Open ${player.name} detail`}
                data-testid="best-ball-board-player-name"
                className="-my-2 inline-flex min-h-touch w-full min-w-0 items-center truncate text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--home-signal)]"
              >
                {player.name}
              </button>
              <span className="mt-1 block truncate text-xs sm:hidden" style={{ color: "var(--home-ink-muted)" }}>
                {player.team} · {adpAvailable ? "ADP" : "Source rank"}{" "}
                {adpAvailable
                  ? formatBoardAdp(player, "not available")
                  : player.adjustedRank.toFixed(0)}{" "}
                · Bye{" "}
                {player.byeWeek ?? "not available"}
              </span>
              {player.rankAdjustment !== 0 ||
              player.isUndraftedAtContestFloor ||
              player.consensusWithheld ? (
                /*
                  Provenance, not an alert. Roughly a third of the snapshot sits
                  at the undrafted floor, so painting these sentences in the
                  signal accent turned the whole list into a page of warnings.
                  The sentence reads in muted ink; a single signal dot marks
                  "this rank was adjusted", which is the actual state. The title
                  carries the full sentence past the truncation.
                */
                <span
                  className="mt-1 hidden min-w-0 items-center gap-1.5 text-2xs lg:flex"
                  style={{ color: "var(--home-ink-muted)" }}
                  title={player.rankReason}
                  data-consensus-withheld={player.consensusWithheld ? "true" : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--home-signal)" }}
                  />
                  <span className="truncate">{player.rankReason}</span>
                </span>
              ) : null}
            </span>
            <span
              className="inline-flex min-h-[28px] min-w-[38px] items-center justify-center rounded-full border px-2 text-xs font-semibold sm:min-h-0 sm:justify-start sm:border-0 sm:px-0"
              style={POSITION_CHIP_STYLE}
            >
              {player.position}
            </span>
            <span className="hidden text-xs font-medium sm:block">
              <span className="sr-only">{"Team "}</span>
              <span>{player.team}</span>
            </span>
            {/*
              The column headers above are a sibling grid row, not table headers,
              so nothing associates them with a cell. Without these labels the row
              reads out as the player's name followed by two bare numbers. The
              labels live inside the sm-only cell so the phone summary line, which
              already names both values, does not say them twice. The acronym is
              spoken in full because the row gives it no surrounding context.
            */}
            <span className="hidden text-xs tabular-nums sm:block">
              <span className="sr-only">
                {adpAvailable ? "Underdog average draft position " : "Source rank "}
              </span>
              <span>
                {adpAvailable
                  ? formatBoardAdp(player, "Not matched")
                  : player.adjustedRank.toFixed(0)}
              </span>
            </span>
            <span className="hidden text-xs tabular-nums sm:block">
              <span className="sr-only">{"Bye week "}</span>
              <span>{player.byeWeek ?? "Unknown"}</span>
            </span>
            <button
              type="button"
              data-testid="best-ball-board-draft"
              onClick={() => {
                pendingFocusIndexRef.current = index;
                onDraftPlayer(player);
              }}
              disabled={isComplete}
              aria-label={`Draft ${player.name} at pick ${currentPick}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-3 text-xs font-semibold transition-[background-color,color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-paper)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
            >
              Draft
            </button>
          </div>
        ))}
      </div>

      {shownPlayers.length === 0 ? (
        <p className="p-6 text-sm" style={{ color: "var(--home-ink-muted)" }}>
          No available player matches this search.
        </p>
      ) : null}

      {shownPlayers.length < filteredPlayers.length ? (
        <div className="p-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 100)}
            className="min-h-[44px] rounded-full border px-5 text-sm font-semibold"
            style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
          >
            Show 100 more players
          </button>
        </div>
      ) : null}
    </section>
  );
}
