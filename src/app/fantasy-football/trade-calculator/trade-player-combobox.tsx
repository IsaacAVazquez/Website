"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { normalizeAdpPlayerName, normalizeAdpTeam } from "@/lib/fantasyAdpMatcher";
import { FANTASY_CHIP_CLASS, getPositionTone } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

const RESULT_LIMIT = 8;

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
      <label className="block" htmlFor={`${listboxId}-input`}>
        <span className="sr-only">Add a player to {sideLabel}</span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c97-ink-2)]"
            aria-hidden="true"
          />
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
            className="min-h-[48px] w-full border border-[var(--c97-ink-2)] bg-[var(--c97-field)] text-sm text-[var(--c97-ink)] transition-[border-color,background-color] placeholder:text-[var(--c97-ink-2)] hover:border-[var(--c97-ink)] focus:border-[var(--c97-accent)] focus:bg-[var(--c97-surface)] disabled:cursor-not-allowed disabled:border-dashed disabled:border-[var(--c97-ink-2)] disabled:bg-transparent disabled:text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingLeft: "calc(28px + var(--c97-sp-1))", paddingRight: "var(--c97-sp-1)" }}
          />
        </span>
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
        <div
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden border border-[var(--c97-rule)] bg-[var(--c97-surface)]"
        >
          {/* The listbox stays mounted for as long as the popup is open, so
              aria-controls always resolves and aria-expanded never reports
              collapsed over a popup the visitor can see. */}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={`Players for ${sideLabel}`}
            className={results.length > 0 ? "max-h-80 overflow-y-auto py-[var(--c97-sp-0)]" : undefined}
          >
            {results.map((player, index) => {
              const excluded = excludedPlayerIds.has(player.id);
              const active = index === activeIndex;
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
                    className="flex min-h-touch w-full items-center text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:text-[var(--c97-ink-2)]"
                    style={
                      { paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)", ...(active
                        ? {
                            background:
                              "color-mix(in srgb, var(--c97-accent) 12%, var(--c97-surface))",
                          }
                        : undefined) }
                    }
                  >
                    <span className={FANTASY_CHIP_CLASS} style={getPositionTone(player.position)}>
                      {player.position}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{player.name}</span>
                    <span className="shrink-0 text-2xs text-[var(--c97-ink-2)]">
                      {excluded ? "Already added" : `${player.team} · ECR ${playerRank(player)}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {results.length === 0 ? (
            <p className="text-sm text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)" }}>{emptyMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
