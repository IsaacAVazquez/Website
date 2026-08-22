"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Player } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import { isPlayerValueAtPick } from "@/lib/draftAnalytics";
import {
  FANTASY_ADP_TOOLTIP,
  formatAdp,
  formatRankValue,
  getPositionTone,
  getTierRailIntensity,
  withTierBreaks,
} from "@/lib/fantasyUtils";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy";

interface DraftBoardProps {
  players: Player[];
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  onOpenDetail: (player: Player) => void;
  currentPick: number;
  currentRound: number;
  adpAvailable: boolean;
  guidanceAvailable: boolean;
}

type BoardFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX";

/** Rows mounted before the scroll sentinel extends the window. */
const BOARD_PAGE_SIZE = 40;

const MONO_LABEL_CLASS = "font-mono text-3xs uppercase tracking-[0.12em]";

/** Square-cornered mono position chip from the template (not the shared pill chip). */
const POSITION_CHIP_CLASS =
  "inline-flex flex-none items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-2xs tracking-[0.06em]";

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

function getConsensusAvg(player: Player): number | null {
  return typeof player.rankAverage === "number" && Number.isFinite(player.rankAverage)
    ? player.rankAverage
    : null;
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
}: DraftBoardProps) {
  const [selectedPosition, setSelectedPosition] = useState<BoardFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(BOARD_PAGE_SIZE);
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
  }, [selectedPosition, debouncedSearch]);

  const windowedPlayers = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  // Auto-extend the window as the sentinel nears the viewport, matching the
  // rankings board: the tier plates flow without a "Load more" control.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
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

  // Watchlist players still on the board — the "is my guy still here?" glance.
  const queuedAvailable = useMemo(() => {
    const byId = new Map(availablePlayers.map((player) => [player.id, player]));
    return queue.queue
      .map((id) => byId.get(id))
      .filter((player): player is Player => Boolean(player));
  }, [availablePlayers, queue.queue]);

  function describeDelta(player: Player): { text: string; color: string; title: string } | null {
    if (!adpAvailable || typeof player.adp !== "number" || !Number.isFinite(player.adp)) {
      return null;
    }
    const delta = Number((currentPick - player.adp).toFixed(1));
    const magnitude = Math.abs(delta).toFixed(1);
    const isValue = guidanceAvailable && isPlayerValueAtPick(player, currentPick, currentRound);
    if (delta >= 2) {
      return {
        text: `+${magnitude}`,
        color: isValue ? "var(--home-positive)" : "var(--home-ink-muted)",
        title: isValue
          ? `Lasted ${magnitude} picks past his ADP, so this reads as value at pick ${currentPick}`
          : `Lasted ${magnitude} picks past his ADP, inside the noise band for this market sample`,
      };
    }
    if (delta <= -2) {
      return {
        text: `−${magnitude}`,
        color: "var(--home-ink-muted)",
        title: `Mock rooms usually take him ${magnitude} picks after pick ${currentPick}`,
      };
    }
    return {
      text: `±${magnitude}`,
      color: "var(--home-ink-muted)",
      title: "Priced about right at this pick",
    };
  }

  function renderTierSection(group: TierGroup, index: number) {
    const firstRank = formatRankValue(group.rows[0].rankEcr ?? group.rows[0].averageRank);
    const lastRank = formatRankValue(
      group.rows[group.rows.length - 1].rankEcr ?? group.rows[group.rows.length - 1].averageRank
    );
    const railTone =
      group.tier !== null
        ? `color-mix(in srgb, var(--home-signal) ${getTierRailIntensity(group.tier)}%, var(--home-rule))`
        : "var(--home-rule)";

    let cliff = 0;
    if (index > 0) {
      const previous = tierGroups[index - 1];
      const prevAvg = getConsensusAvg(previous.rows[previous.rows.length - 1]);
      const nextAvg = getConsensusAvg(group.rows[0]);
      if (prevAvg !== null && nextAvg !== null) {
        cliff = Math.max(0, Number((nextAvg - prevAvg).toFixed(1)));
      }
    }
    const marginTop = index === 0 ? 0 : Math.round(Math.min(48, Math.max(14, cliff * 9))) || 18;

    return (
      <section key={`tier-${group.tier ?? "untiered"}-${group.rows[0].id}`} style={{ marginTop }}>
        {index > 0 && cliff > 0 && (
          <div aria-hidden="true" className="flex items-center gap-3 px-0.5 pb-2.5">
            <span
              className="flex-1 border-t border-dashed"
              style={{ borderColor: "color-mix(in srgb, var(--home-ink) 24%, transparent)" }}
            />
            <span
              className="whitespace-nowrap font-mono text-3xs uppercase tracking-[0.12em]"
              style={{ color: "var(--home-signal)" }}
            >
              ↓ {cliff.toFixed(1)} avg-rank cliff
            </span>
            <span
              className="flex-1 border-t border-dashed"
              style={{ borderColor: "color-mix(in srgb, var(--home-ink) 24%, transparent)" }}
            />
          </div>
        )}
        <div
          className="overflow-hidden rounded-lg border border-l-[3px]"
          style={{
            borderColor: "var(--home-rule)",
            borderLeftColor: railTone,
            background: "var(--home-paper-raised)",
          }}
        >
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 px-3.5 pb-2 pt-2.5">
            <span className="text-2xl font-bold leading-none tracking-tight tabular-nums">
              {group.tier !== null ? String(group.tier).padStart(2, "0") : "—"}
            </span>
            <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
              {group.tier !== null ? "Tier" : "No published tier"}
            </span>
            <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              {group.rows.length} left
            </span>
            <span className="ml-auto font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              R{firstRank}–R{lastRank}
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {group.rows.map((player) => {
              const isQueued = queue.isQueued(player.id);
              const delta = describeDelta(player);
              return (
                <li
                  key={player.id}
                  className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-l-[3px] py-1 pl-2 pr-3 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--home-paper-alt)_55%,transparent)]"
                  style={{
                    borderTopColor: "color-mix(in srgb, var(--home-rule) 60%, transparent)",
                    borderLeftColor: isQueued ? "var(--home-signal)" : "transparent",
                  }}
                >
                  <span
                    className="w-8 flex-none text-right font-mono text-sm"
                    title="Overall board rank"
                  >
                    {formatRankValue(player.rankEcr ?? player.averageRank)}
                  </span>
                  <div className="flex min-w-0 flex-1 basis-44 items-baseline gap-2">
                    {/* -my keeps the row dense while the button itself meets
                        the 44px touch floor. */}
                    <button
                      type="button"
                      onClick={() => onOpenDetail(player)}
                      aria-label={`Open ${player.name} detail`}
                      className="-my-2 inline-flex min-h-touch min-w-0 items-center truncate text-left text-sm font-semibold tracking-[-0.01em]"
                    >
                      {player.name}
                    </button>
                    <span className={POSITION_CHIP_CLASS} style={getPositionTone(player.position)}>
                      {player.position}
                      {player.positionRank ?? ""}
                    </span>
                    <span
                      className="flex-none font-mono text-2xs uppercase tracking-[0.06em]"
                      style={{ color: "var(--home-ink-muted)" }}
                    >
                      {player.team}
                      {typeof player.byeWeek === "number" && Number.isFinite(player.byeWeek)
                        ? ` · Bye ${player.byeWeek}`
                        : ""}
                    </span>
                  </div>
                  <div className="ml-auto flex flex-none items-center gap-2.5">
                    {adpAvailable ? (
                      <>
                        <span
                          className="w-11 text-right font-mono text-xs"
                          style={{ color: "var(--home-ink-muted)" }}
                          title={FANTASY_ADP_TOOLTIP}
                        >
                          {formatAdp(player.adp)}
                        </span>
                        <span
                          className="w-12 text-right font-mono text-xs"
                          style={{ color: delta?.color ?? "var(--home-ink-muted)" }}
                          title={delta?.title}
                        >
                          {delta?.text ?? "—"}
                        </span>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => queue.toggle(player.id)}
                      aria-pressed={isQueued}
                      aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border"
                      style={{
                        borderColor: isQueued
                          ? "color-mix(in srgb, var(--home-signal) 55%, var(--home-rule))"
                          : "var(--home-rule)",
                        color: isQueued ? "var(--home-signal)" : "var(--home-ink-muted)",
                      }}
                    >
                      {isQueued ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDraftPlayer(player)}
                      aria-label={`Log ${player.name}`}
                      className="inline-flex min-h-touch items-center justify-center rounded-full border px-3.5 font-mono text-3xs uppercase tracking-[0.06em]"
                      style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                    >
                      Log
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Draft board">
      {queuedAvailable.length > 0 && (
        <div
          className="mb-3 flex flex-wrap items-center gap-1.5 rounded border px-2.5 py-1.5"
          style={{
            borderColor: "color-mix(in srgb, var(--home-signal) 38%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-signal) 9%, var(--home-paper))",
          }}
        >
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-signal)" }}>
            ★ Queue · still on the board
          </span>
          {queuedAvailable.slice(0, 8).map((player) => (
            <button
              key={`queued-${player.id}`}
              type="button"
              onClick={() => handleDraftPlayer(player)}
              title={`Log ${player.name}`}
              className="inline-flex min-h-touch items-baseline gap-1.5 rounded-full border px-2.5 font-mono text-2xs"
              style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
            >
              <span style={{ color: "var(--home-ink-muted)" }}>
                #{formatRankValue(player.rankEcr ?? player.averageRank)}
              </span>
              <span className="max-w-[8rem] truncate font-sans text-xs font-semibold tracking-[-0.01em]">
                {player.name}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 pb-3">
        <PositionFilterBar
          ariaLabel="Position filter"
          options={POSITION_OPTIONS}
          value={selectedPosition}
          onChange={setSelectedPosition}
        />
        <label htmlFor="draft-board-search" className="sr-only">
          Search the board
        </label>
        <input
          ref={searchInputRef}
          id="draft-board-search"
          name="draftBoardSearch"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          autoComplete="off"
          placeholder="Search player or team"
          className="min-h-touch w-48 rounded border px-3 font-mono text-xs"
          style={{
            borderColor: "var(--home-rule)",
            background: "var(--home-paper-raised)",
            color: "var(--home-ink)",
          }}
        />
        <span
          aria-live="polite"
          className="ml-auto whitespace-nowrap font-mono text-2xs"
          style={{ color: "var(--home-ink-muted)" }}
        >
          {filteredPlayers.length} of {availablePlayers.length} available
        </span>
      </div>

      {windowedPlayers.length > 0 ? (
        <>
          <div
            aria-hidden="true"
            className="hidden items-center gap-x-3.5 px-3.5 pb-1.5 md:flex"
            style={{ color: "var(--home-ink-muted)" }}
          >
            <span className="w-8" />
            <span className={`${MONO_LABEL_CLASS} min-w-0 flex-1 basis-44`}>Player</span>
            <span className="ml-auto flex flex-none items-center gap-2.5">
              {adpAvailable ? (
                <>
                  <span className={`${MONO_LABEL_CLASS} w-11 text-right`}>ADP</span>
                  <span className={`${MONO_LABEL_CLASS} w-12 text-right`}>At #{currentPick}</span>
                </>
              ) : null}
              <span className="w-11" />
              <span className="w-[3.6rem]" />
            </span>
          </div>
          {tierGroups.map((group, index) => renderTierSection(group, index))}
          <div ref={sentinelRef} aria-hidden="true" />
        </>
      ) : (
        <div
          className="rounded-lg border border-dashed px-6 py-9 text-center"
          style={{ borderColor: "var(--home-rule)" }}
        >
          <p className="m-0 font-mono text-xs" style={{ color: "var(--home-ink-muted)" }}>
            No available players match on this board.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedPosition("ALL");
            }}
            className="mt-3.5 inline-flex min-h-touch items-center justify-center rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.06em]"
            style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
          >
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}
