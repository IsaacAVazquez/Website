"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { normalizeAdpPlayerName, normalizeAdpTeam } from "@/lib/fantasyAdpMatcher";
import type { Player } from "@/types";

const RESULT_LIMIT = 8;

/** The kit's position chip for a player: the position's colour class and its letters with the position rank. */
export function positionChip(position: string, positionRank?: number | null) {
  return {
    className: `ffb-chip ffb-pos-${position.toLowerCase()}`,
    label: `${position}${typeof positionRank === "number" && Number.isFinite(positionRank) ? positionRank : ""}`,
  };
}

function playerRank(player: Player): number {
  const rank = [player.rankEcr, player.averageRank].find(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0
  );
  return rank ?? Number.POSITIVE_INFINITY;
}

function searchPlayers(players: readonly Player[], query: string): Player[] {
  const normalizedQuery = normalizeAdpPlayerName(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  return players
    .map((player, sourceIndex) => {
      const name = normalizeAdpPlayerName(player.name);
      const haystack = `${name} ${normalizeAdpTeam(player.team).toLowerCase()} ${player.position.toLowerCase()}`;
      const matches = queryTokens.every((token) => haystack.includes(token));
      const matchOrder = name === normalizedQuery ? 0 : name.startsWith(normalizedQuery) ? 1 : 2;
      return { player, sourceIndex, matches, matchOrder };
    })
    .filter((entry) => entry.matches)
    .sort(
      (left, right) =>
        left.matchOrder - right.matchOrder ||
        playerRank(left.player) - playerRank(right.player) ||
        left.sourceIndex - right.sourceIndex
    )
    .slice(0, RESULT_LIMIT)
    .map((entry) => entry.player);
}

interface TradePlayerComboboxProps {
  sideLabel: string;
  players: readonly Player[];
  excludedPlayerIds: ReadonlySet<string>;
  disabled?: boolean;
  onSelect: (playerId: string) => void;
}

export function TradePlayerCombobox({
  sideLabel,
  players,
  excludedPlayerIds,
  disabled = false,
  onSelect,
}: TradePlayerComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const helpId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(() => searchPlayers(players, query), [players, query]);
  const selectableIndexes = useMemo(
    () => results.flatMap((player, index) => (excludedPlayerIds.has(player.id) ? [] : [index])),
    [excludedPlayerIds, results]
  );

  const emptyMessage = `No players match “${query.trim()}”.`;
  const listOpen = open && !disabled;

  const moveActive = (direction: 1 | -1) => {
    if (selectableIndexes.length === 0) {
      setActiveIndex(-1);
      return;
    }
    const currentSelectableIndex = selectableIndexes.indexOf(activeIndex);
    const nextPosition =
      currentSelectableIndex === -1
        ? direction === 1
          ? 0
          : selectableIndexes.length - 1
        : (currentSelectableIndex + direction + selectableIndexes.length) %
          selectableIndexes.length;
    setActiveIndex(selectableIndexes[nextPosition]);
  };

  const addPlayer = (player: Player) => {
    if (excludedPlayerIds.has(player.id)) return;
    onSelect(player.id);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    // A frame later, once the list has closed. If the visitor is already in
    // another field by then, the focus stays with them.
    window.requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (!focused || focused === document.body || containerRef.current?.contains(focused)) {
        inputRef.current?.focus();
      }
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <label className="ffb-search ffb-tr-search" htmlFor={`${listboxId}-input`}>
        <Search width={15} height={15} aria-hidden="true" />
        <span className="sr-only">Add a player to {sideLabel}</span>
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-describedby={helpId}
          autoComplete="off"
          disabled={disabled}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              moveActive(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              moveActive(-1);
            } else if (event.key === "Enter" && open && activeIndex >= 0) {
              event.preventDefault();
              const player = results[activeIndex];
              if (player) addPlayer(player);
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
          placeholder={disabled ? "Six-player limit reached" : "Search name, team, or position"}
          className="ffb-search-input"
        />
      </label>
      <p id={helpId} className="sr-only">
        Use the arrow keys to move through players, Enter to add one, and Escape to close the list.
      </p>
      {/* Mounted before it has anything to say, so the empty result actually
          reaches a screen reader instead of appearing silently. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {listOpen && results.length === 0 ? emptyMessage : ""}
      </p>

      {listOpen ? (
        <div className="ffb-tr-pop">
          {/* The listbox stays mounted for as long as the popup is open, so
              aria-controls always resolves and aria-expanded never reports
              collapsed over a popup the visitor can see. */}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={`Players for ${sideLabel}`}
            className={results.length > 0 ? "ffb-tr-options" : undefined}
          >
            {results.map((player, index) => {
              const excluded = excludedPlayerIds.has(player.id);
              const active = index === activeIndex;
              const chip = positionChip(player.position, player.positionRank);
              return (
                <li key={player.id} role="presentation">
                  <button
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    tabIndex={-1}
                    role="option"
                    aria-selected={active}
                    aria-disabled={excluded}
                    disabled={excluded}
                    onMouseEnter={() => !excluded && setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => addPlayer(player)}
                    className="ffb-tr-option"
                  >
                    <span className={chip.className}>{chip.label}</span>
                    <span className="ffb-c-name">{player.name}</span>
                    <span className="ffb-c-team">
                      {excluded ? "Already added" : `${player.team} · ECR ${playerRank(player)}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {results.length === 0 ? <p className="ffb-tr-nomatch">{emptyMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
