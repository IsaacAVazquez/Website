"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Player } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import { isPlayerValueAtPick } from "@/lib/draftAnalytics";
import {
  FANTASY_ADP_TOOLTIP,
  FANTASY_VORP_TOOLTIP,
  formatAdp,
  formatRankValue,
  getConsensusAvg,
  shortName,
  withTierBreaks,
} from "@/lib/fantasyUtils";
import type {
  FantasyVorpRankingEntry,
  FantasyVorpTeamSize,
} from "@/lib/fantasyVorp";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy/PositionFilterBar";
import { positionClass } from "@/components/fantasy/positionClass";

interface DraftBoardProps {
  players: Player[];
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  onOpenDetail: (player: Player) => void;
  currentPick: number;
  currentRound: number;
  adpAvailable: boolean;
  guidanceAvailable: boolean;
  vorpValues: ReadonlyMap<string, FantasyVorpRankingEntry>;
  vorpTeamSize: FantasyVorpTeamSize | null;
  /**
   * The user's next turn, or 0 when there is none. The board marks where it
   * falls if picks follow the board.
   */
  nextUserPick?: number;
}

/**
 * The column head is hidden from assistive tech and from a phone, so each
 * value carries its own label inside its cell, where it hides when the cell
 * does. `ffb-vh-desk` is a label a phone prints and a desktop only reads
 * out, since the column head already shows it there.
 */

const STAR_PATH = "M10 2.6l2.3 4.7 5.1.7-3.7 3.6.9 5.1L10 14.3l-4.6 2.4.9-5.1L2.6 8l5.1-.7z";

type BoardFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX";

/** Rows mounted before the scroll sentinel extends the window. */
const BOARD_PAGE_SIZE = 40;

const POSITION_OPTIONS: PositionFilterOption<BoardFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "QB", label: "QB", position: "QB" },
  { value: "RB", label: "RB", position: "RB" },
  { value: "WR", label: "WR", position: "WR" },
  { value: "TE", label: "TE", position: "TE" },
  { value: "FLEX", label: "Flex" },
  { value: "K", label: "K", position: "K" },
  { value: "DST", label: "DST", position: "DST" },
];

function matchesFilter(player: Player, filter: BoardFilter): boolean {
  if (filter === "ALL") {
    return true;
  }

  if (filter === "FLEX") {
    return ["RB", "WR", "TE"].includes(player.position);
  }

  return player.position === filter;
}

interface TierGroup {
  tier: number | null;
  rows: Player[];
}

export function DraftBoard({
  players,
  draftedPlayerIds,
  onDraftPlayer,
  onOpenDetail,
  currentPick,
  currentRound,
  adpAvailable,
  guidanceAvailable,
  vorpValues,
  vorpTeamSize,
  nextUserPick = 0,
}: DraftBoardProps) {
  const [selectedPosition, setSelectedPosition] = useState<BoardFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(BOARD_PAGE_SIZE);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  // The row "Load more" hands focus to: the first one it added.
  const [focusRowAt, setFocusRowAt] = useState<number | null>(null);
  const boardRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 200);

  const queue = usePlayerQueue();

  const handleDraftPlayer = useCallback(
    (player: Player) => {
      const hadActiveSearch = searchQuery.trim().length > 0;
      onDraftPlayer(player);
      if (hadActiveSearch) {
        setSearchQuery("");
        searchInputRef.current?.focus();
      }
    },
    [onDraftPlayer, searchQuery]
  );

  const availablePlayers = useMemo(
    () => players.filter((player) => !draftedPlayerIds.has(player.id)),
    [draftedPlayerIds, players]
  );

  const filteredPlayers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return availablePlayers.filter((player) => {
      if (!matchesFilter(player, selectedPosition)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [player.name, player.team, player.position].join(" ").toLowerCase().includes(query);
    });
  }, [availablePlayers, debouncedSearch, selectedPosition]);

  // Reset the window when the filter or search changes so a narrowed board
  // doesn't open deep into a stale offset.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on filter change
    setVisibleCount(BOARD_PAGE_SIZE);
    setHighlightIndex(-1);
  }, [selectedPosition, debouncedSearch]);

  // Any change to the drafted set shifts every row under the highlight, so
  // drop it rather than let Enter log a player the user never highlighted.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when rows shift
    setHighlightIndex(-1);
  }, [draftedPlayerIds]);

  // "/" focuses the board search from anywhere on the page: slash, type,
  // arrows, Enter. Skipped while another field has the keystroke.
  useEffect(() => {
    function handleSlash(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      // The player drawer is a focus-trapped dialog; pulling focus to the
      // search field behind its scrim would let typing edit an invisible
      // input and Enter log an unseen pick.
      if (document.querySelector('[aria-modal="true"]')) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
    document.addEventListener("keydown", handleSlash);
    return () => document.removeEventListener("keydown", handleSlash);
  }, []);

  // Memoized so the tier grouping below, which is keyed on it, can be reused.
  const windowedPlayers = useMemo(
    () => filteredPlayers.slice(0, visibleCount),
    [filteredPlayers, visibleCount]
  );
  const hasMore = visibleCount < filteredPlayers.length;
  const highlightedPlayer =
    highlightIndex >= 0 ? windowedPlayers[highlightIndex] ?? null : null;

  const scrollHighlightedRow = useCallback((element: HTMLLIElement | null) => {
    element?.scrollIntoView({ block: "nearest" });
  }, []);

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (windowedPlayers.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      // From the neutral state, ArrowDown enters the list at the top and
      // ArrowUp stays neutral; the old math sent both keys to row 0.
      setHighlightIndex((index) => {
        if (index < 0) return step === 1 ? 0 : -1;
        return Math.min(windowedPlayers.length - 1, Math.max(0, index + step));
      });
      return;
    }
    if (event.key === "Enter") {
      // The visible list trails the input by the debounce, so Enter mid-window
      // could log the previous query's player. Wait for the list to settle.
      if (searchQuery.trim() !== debouncedSearch.trim()) return;
      // A lone match logs on Enter without arrowing down first; with several
      // matches the visible count makes the ambiguity plain and Enter waits.
      const highlighted =
        highlightedPlayer ??
        (windowedPlayers.length === 1 ? windowedPlayers[0] : null);
      if (highlighted) {
        event.preventDefault();
        setHighlightIndex(-1);
        handleDraftPlayer(highlighted);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (searchQuery) {
        setSearchQuery("");
        setHighlightIndex(-1);
      } else {
        event.currentTarget.blur();
      }
    }
  }

  // The pinned bar takes a second row where the list column is narrow (from 1200px to about
  // 1280px), so its height is measured. The sheet adds it to the scorebug's for the kit's
  // scroll margin, which keeps a focused row clear of both bars.
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    const board = boardRef.current;
    if (!bar || !board || typeof ResizeObserver === "undefined") return;
    const write = () => board.style.setProperty("--ffb-dt-bar", `${bar.offsetHeight}px`);
    write();
    const observer = new ResizeObserver(write);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  // From 1200px the rail sits beside the list, so the window extends by itself
  // as its end nears the viewport. Below that the roster's rail follows the
  // list, and a list that kept growing would keep it out of reach, so there
  // the list ends on its "Load more" button and waits for it.
  // ponytail: the width is read when the effect runs, not on resize. A window
  // dragged across 1200px picks the new mode up on its next row change.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    if (!window.matchMedia("(min-width: 1200px)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + BOARD_PAGE_SIZE, filteredPlayers.length));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filteredPlayers.length]);

  // "Load more" can remove itself with the last page, so focus moves to the
  // first row it added and never falls to the page.
  useEffect(() => {
    if (focusRowAt === null) return;
    const rows = boardRef.current?.querySelectorAll<HTMLElement>("li.ffb-row");
    rows?.item(focusRowAt)?.querySelector<HTMLElement>("button.ffb-c-name")?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot focus request, cleared once served
    setFocusRowAt(null);
  }, [focusRowAt]);

  const tierGroups = useMemo<TierGroup[]>(() => {
    const groups: TierGroup[] = [];
    for (const { player, tier, startsTier } of withTierBreaks(windowedPlayers)) {
      const current = groups[groups.length - 1];
      if (!current || startsTier || (tier === null) !== (current.tier === null)) {
        groups.push({ tier, rows: [player] });
      } else {
        current.rows.push(player);
      }
    }
    return groups;
  }, [windowedPlayers]);

  // Watchlist players still on the board, the "is my guy still here?" glance.
  const queuedAvailable = useMemo(() => {
    const byId = new Map(availablePlayers.map((player) => [player.id, player]));
    return queue.queue
      .map((id) => byId.get(id))
      .filter((player): player is Player => Boolean(player));
  }, [availablePlayers, queue.queue]);

  // Who is already gone from each tier, under the position filter in force.
  const goneByTier = useMemo(() => {
    const gone = new Map<number, string[]>();
    for (const player of players) {
      if (!draftedPlayerIds.has(player.id) || !matchesFilter(player, selectedPosition)) continue;
      if (typeof player.tier !== "number" || !Number.isFinite(player.tier)) continue;
      gone.set(player.tier, [...(gone.get(player.tier) ?? []), shortName(player)]);
    }
    return gone;
  }, [draftedPlayerIds, players, selectedPosition]);

  const isSearching = debouncedSearch.trim().length > 0;
  const hasVorp = vorpValues.size > 0;
  // Where the board stands when the user's turn comes back, if every pick until
  // then follows this board. A filter or a search breaks that reading, so the
  // line only shows on the whole board.
  const picksBeforeTurn =
    nextUserPick > 0 && selectedPosition === "ALL" && !isSearching ? nextUserPick - currentPick : 0;
  const turnPlayerId = picksBeforeTurn > 0 ? windowedPlayers[picksBeforeTurn]?.id : undefined;

  function describeDelta(player: Player): { text: string; isValue: boolean; title: string } | null {
    if (!adpAvailable || typeof player.adp !== "number" || !Number.isFinite(player.adp)) {
      return null;
    }
    const delta = Number((currentPick - player.adp).toFixed(1));
    const magnitude = Math.abs(delta).toFixed(1);
    const isValue = guidanceAvailable && isPlayerValueAtPick(player, currentPick, currentRound);
    if (delta >= 2) {
      return {
        text: `+${magnitude}`,
        isValue,
        title: isValue
          ? `Lasted ${magnitude} picks past his ADP, so this reads as value at pick ${currentPick}`
          : `Lasted ${magnitude} picks past his ADP, inside the noise band for this market sample`,
      };
    }
    if (delta <= -2) {
      return {
        text: `−${magnitude}`,
        isValue: false,
        title: `Mock rooms usually take him ${magnitude} picks after pick ${currentPick}`,
      };
    }
    return {
      text: `±${magnitude}`,
      isValue: false,
      title: "Priced about right at this pick",
    };
  }

  function renderRow(player: Player) {
    const isQueued = queue.isQueued(player.id);
    const isHighlighted = highlightedPlayer?.id === player.id;
    const delta = describeDelta(player);
    const vorp = vorpValues.get(player.id);
    const hasBye = typeof player.byeWeek === "number" && Number.isFinite(player.byeWeek);
    return (
      <li
        key={player.id}
        ref={isHighlighted ? scrollHighlightedRow : undefined}
        className={`ffb-row${isQueued ? " ffb-is-queued" : ""}${isHighlighted ? " ffb-is-active" : ""}`}
      >
        <span className="ffb-c-rank" title="Overall board rank">
          {formatRankValue(player.rankEcr ?? player.averageRank)}
        </span>
        <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
          {player.position}
          {player.positionRank ?? ""}
        </span>
        <button
          type="button"
          onClick={() => onOpenDetail(player)}
          aria-label={`Open ${player.name} detail`}
          // A narrow row can still cut a long name, and the title keeps it whole.
          title={player.name}
          className="ffb-c-name"
        >
          {player.name}
        </button>
        <span className="ffb-c-team">{player.team}</span>
        <span className="ffb-c-bye">
          {hasBye ? (
            <>
              <span className="ffb-vh-desk">Bye </span>
              {player.byeWeek}
            </>
          ) : null}
        </span>
        {adpAvailable ? (
          <>
            <span className="ffb-c-num ffb-is-flat" title={FANTASY_ADP_TOOLTIP}>
              <span className="sr-only">ADP </span>
              {formatAdp(player.adp)}
            </span>
            {/* A phone row has room for one number beside the bye. The gap
                against the pick on the clock is the reading the room is for,
                so in a room with ADP that number is the gap, with its label,
                its sign, and its tone. The ADP itself and the gap together
                need up to 100px there, and a 390px row has 67. */}
            <span
              className={`ffb-c-num ffb-m-meta ${delta?.isValue ? "ffb-is-strong ffb-is-good" : "ffb-is-flat"}`}
              title={delta?.title}
            >
              <span className="sr-only">versus ADP at pick {currentPick} </span>
              <span aria-hidden="true" className="ffb-only-phone">
                ±ADP{" "}
              </span>
              {delta?.text ?? "—"}
            </span>
          </>
        ) : null}
        {vorp ? (
          // VORP is a column of measured values, so it reads in ink like the rank.
          // On a phone it takes the row's one number when the room has no ADP.
          <span
            className={`ffb-c-num${vorp.value > 0 ? "" : " ffb-is-flat"}${adpAvailable ? "" : " ffb-m-meta"}`}
            title={FANTASY_VORP_TOOLTIP}
          >
            <span className="sr-only">Value over replacement player </span>
            <span aria-hidden="true" className="ffb-only-phone">
              VORP{" "}
            </span>
            {Math.round(vorp.value)}
          </span>
        ) : hasVorp ? (
          // Holds the column for a player FantasyPros publishes no VORP for.
          <span className="ffb-c-num" />
        ) : null}
        <button
          type="button"
          onClick={() => queue.toggle(player.id)}
          aria-pressed={isQueued}
          aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
          className="ffb-star"
        >
          <svg className="ffb-star-icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d={STAR_PATH} />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleDraftPlayer(player)}
          aria-label={`Log ${player.name}`}
          className="ffb-log"
        >
          Log
        </button>
      </li>
    );
  }

  function renderTierSection(group: TierGroup, index: number) {
    const firstRank = formatRankValue(group.rows[0].rankEcr ?? group.rows[0].averageRank);
    const lastRank = formatRankValue(
      group.rows[group.rows.length - 1].rankEcr ?? group.rows[group.rows.length - 1].averageRank
    );

    let cliff = 0;
    if (index > 0) {
      const previous = tierGroups[index - 1];
      const prevAvg = getConsensusAvg(previous.rows[previous.rows.length - 1]);
      const nextAvg = getConsensusAvg(group.rows[0]);
      if (prevAvg !== null && nextAvg !== null) {
        cliff = Math.max(0, Number((nextAvg - prevAvg).toFixed(1)));
      }
    }
    // The gap above a break grows with the cliff, in 4px steps from 8 to 28px.
    const gap = Math.min(28, Math.max(8, Math.round((cliff * 6) / 4) * 4));

    /* An unnamed <section> is not exposed as a landmark at all, so the tier
       structure would be invisible to assistive tech. The cliff mark in the
       head is aria-hidden, so its size rides in the label. */
    const tierLabel = [
      group.tier !== null ? `Tier ${group.tier}` : "No published tier",
      `${group.rows.length} ${group.rows.length === 1 ? "player" : "players"}`,
      `ranks ${firstRank} to ${lastRank}`,
      index > 0 && cliff > 0 ? `${cliff.toFixed(1)} average-rank cliff above` : null,
    ]
      .filter(Boolean)
      .join(", ");

    // The window can split a tier across two groups, so the line prints with the first.
    const gone =
      group.tier !== null &&
      !isSearching &&
      tierGroups.findIndex((candidate) => candidate.tier === group.tier) === index
        ? goneByTier.get(group.tier)
        : undefined;

    return (
      <section
        key={`tier-${group.tier ?? "untiered"}-${group.rows[0].id}`}
        className="ffb-tier"
        aria-label={tierLabel}
        style={{ "--ffb-gap": `${gap}px` } as CSSProperties}
      >
        <header className="ffb-tier-head">
          <h3 className="ffb-tier-name">
            {/* The spaces keep the three parts apart when the heading is read as one string. */}
            <span className="ffb-tier-tab">
              {group.tier !== null ? `Tier ${String(group.tier).padStart(2, "0")}` : "No published tier"}
            </span>{" "}
            <span className="ffb-tier-count">{group.rows.length} left</span>{" "}
            <span className="ffb-tier-range">
              Ranks {firstRank}–{lastRank}
            </span>
          </h3>
          {index > 0 && cliff > 0 ? (
            <p className="ffb-tier-cliff" aria-hidden="true">
              <span className="ffb-cliff-mark" />
              <b>{cliff.toFixed(1)}</b> <span className="ffb-not-phone">avg-rank </span>cliff
            </p>
          ) : null}
        </header>
        {gone ? (
          <p className="ffb-tier-gone">
            <span className="ffb-label">Gone</span>{" "}
            <span>{gone.join(", ")}</span>
          </p>
        ) : null}
        <ol className="ffb-rows">
          {group.rows.map((player) =>
            player.id === turnPlayerId ? (
              <Fragment key={player.id}>
                <li className="ffb-turnline">
                  <span className="ffb-turn-tab">Your turn #{nextUserPick}</span>{" "}
                  <span className="ffb-turn-note">if picks follow this board</span>
                </li>
                {renderRow(player)}
              </Fragment>
            ) : (
              renderRow(player)
            )
          )}
        </ol>
      </section>
    );
  }

  return (
    <section
      ref={boardRef}
      aria-label="Draft board"
      className={`ffb-board ffb-board-room ffb-board-star-log ffb-board-tight ffb-dt-board${adpAvailable ? " ffb-dt-has-adp" : ""}${
        hasVorp ? " ffb-dt-has-vorp" : ""
      }`}
    >
      {queuedAvailable.length > 0 && (
        <div className="ffb-cluster ffb-dt-queue ffb-noprint">
          <span className="ffb-turn-tab">★ Queue · still on the board</span>
          {queuedAvailable.slice(0, 8).map((player) => (
            <button
              key={`queued-${player.id}`}
              type="button"
              onClick={() => handleDraftPlayer(player)}
              title={`Log ${player.name}`}
              className="ffb-btn ffb-dt-queue-btn"
            >
              <span className="ffb-muted">#{formatRankValue(player.rankEcr ?? player.averageRank)}</span>{" "}
              <span className="ffb-dt-queue-name">{player.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* A phone row prints VORP only when the room has no ADP, and the note
          does not print where no row on screen shows the number it explains. */}
      {hasVorp && vorpTeamSize ? (
        <p className={adpAvailable ? "ffb-method ffb-dt-vorp ffb-not-phone" : "ffb-method ffb-dt-vorp"}>
          VORP is FantasyPros&apos; projected season points above the same-position waiver replacement for a {vorpTeamSize}-team league. FantasyPros supplies the roster baseline, while your lineup settings drive the replacement index and scarcity panel.
        </p>
      ) : null}

      {/* The board runs hundreds of rows against a pick clock, so the filter,
          search, count, and column labels hold their place under the scorebug
          while you scroll. On a phone the scorebug already pins two rows, so
          the stylesheet lets this bar scroll with the list there. */}
      <div ref={barRef} className="ffb-sticky ffb-dt-boardbar">
        <div className="ffb-toolbar">
          <PositionFilterBar
            ariaLabel="Position filter"
            options={POSITION_OPTIONS}
            value={selectedPosition}
            onChange={setSelectedPosition}
          />
          <label htmlFor="draft-board-search" className="sr-only">
            Search the board
          </label>
          <span id="draft-board-search-keys" className="sr-only">
            Press slash to focus search from anywhere. Arrow keys highlight a
            result, Enter logs the highlighted player, Escape clears.
          </span>
          <p aria-live="polite" className="sr-only">
            {highlightedPlayer
              ? `${highlightedPlayer.name}, ${highlightedPlayer.position}${
                  highlightedPlayer.team ? `, ${highlightedPlayer.team}` : ""
                }. Press Enter to log.`
              : ""}
          </p>
          {/* A label, so the icon and the field's padding focus the input too.
              It adds no text, so the field's name is still the one above. */}
          <label className="ffb-search">
            <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M12.8 12.8L17 17" />
            </svg>
            <input
              ref={searchInputRef}
              id="draft-board-search"
              name="draftBoardSearch"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              aria-describedby="draft-board-search-keys"
              autoComplete="off"
              placeholder="Search player or team"
              className="ffb-search-input"
            />
          </label>
          <span aria-live="polite" className="ffb-count">
            {filteredPlayers.length} of {availablePlayers.length} available
          </span>
        </div>

        {windowedPlayers.length > 0 ? (
          <div aria-hidden="true" className="ffb-colhead ffb-not-phone">
            <span className="ffb-h-num ffb-is-sorted">Rk</span>
            <span className="ffb-h-pos">Pos</span>
            <span>Player</span>
            <span>Team</span>
            <span className="ffb-h-num">Bye</span>
            {adpAvailable ? (
              <>
                <span className="ffb-h-num">ADP</span>
                <span className="ffb-h-num">At #{currentPick}</span>
              </>
            ) : null}
            {hasVorp ? (
              <span className="ffb-h-num" title={FANTASY_VORP_TOOLTIP}>
                VORP
              </span>
            ) : null}
            <span />
            <span />
          </div>
        ) : null}
      </div>

      {windowedPlayers.length > 0 ? (
        <>
          {tierGroups.map((group, index) => renderTierSection(group, index))}
          {hasMore ? (
            <div ref={sentinelRef} className="ffb-more-row">
              <button
                type="button"
                onClick={() => {
                  setFocusRowAt(windowedPlayers.length);
                  setVisibleCount((count) => Math.min(count + BOARD_PAGE_SIZE, filteredPlayers.length));
                }}
                className="ffb-more"
              >
                Load more ({filteredPlayers.length - windowedPlayers.length} left)
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="ffb-empty">
          <p className="ffb-empty-title">No available players match on this board.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedPosition("ALL");
            }}
            className="ffb-btn"
          >
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}
