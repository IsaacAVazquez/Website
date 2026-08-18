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
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div
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
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--home-ink-muted)]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id={`${listboxId}-input`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && results.length > 0}
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
            className="min-h-[48px] w-full rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] py-2 pl-10 pr-3 text-sm text-[var(--home-ink)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[var(--home-ink-muted)] hover:border-[color-mix(in_srgb,var(--home-ink)_28%,var(--home-rule))] focus:border-[var(--home-signal)] focus:bg-[var(--home-paper)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--home-signal)_22%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </span>
      </label>
      <p id={helpId} className="sr-only">
        Use the arrow keys to move through players, Enter to add one, and Escape to close the list.
      </p>

      {open && !disabled ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] shadow-[var(--shadow-lg)]"
        >
          {results.length > 0 ? (
            <ul id={listboxId} role="listbox" aria-label={`Players for ${sideLabel}`} className="max-h-80 overflow-y-auto py-1">
              {results.map((player, index) => {
                const excluded = excludedPlayerIds.has(player.id);
                const active = index === activeIndex;
                return (
                  <li key={player.id} role="presentation">
                    <button
                      id={`${listboxId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      aria-disabled={excluded}
                      disabled={excluded}
                      onMouseEnter={() => !excluded && setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addPlayer(player)}
                      className="flex min-h-touch w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-55"
                      style={
                        active
                          ? {
                              background:
                                "color-mix(in srgb, var(--home-signal) 12%, var(--home-paper))",
                            }
                          : undefined
                      }
                    >
                      <span className={FANTASY_CHIP_CLASS} style={getPositionTone(player.position)}>
                        {player.position}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{player.name}</span>
                      <span className="shrink-0 text-2xs text-[var(--home-ink-muted)]">
                        {excluded ? "Already added" : `${player.team} · ECR ${playerRank(player)}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-5 text-sm text-[var(--home-ink-muted)]">
              No players match “{query.trim()}”.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
