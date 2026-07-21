"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { GitCompareArrows, Info, Star } from "lucide-react";
import { Player, TeamRoster } from "@/types";
import type { FantasySnapshot } from "@/lib/fantasy";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import { useCompareTray } from "@/hooks/useCompareTray";
import {
  getReachStealThreshold,
  getRosterNeeds,
  type RosterNeed,
  type RosterNeedLevel,
} from "@/lib/draftAnalytics";
import {
  FANTASY_AVG_RANK_TOOLTIP,
  FANTASY_CHIP_CLASS,
  formatAdp,
  formatRange,
  formatRankValue,
  getPositionTone,
} from "@/lib/fantasyUtils";
import { MetricTooltip } from "@/components/investments/MetricTooltip";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy";
import { DraftTierColumns } from "./DraftTierColumns";

interface DraftBoardProps {
  players: Player[];
  snapshot: FantasySnapshot | null;
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  onOpenDetail: (player: Player) => void;
  currentPick: number;
  currentRound: number;
  currentTeamName: string;
  isUserPick: boolean;
  isDraftComplete: boolean;
  userTeam: TeamRoster | undefined;
}

type BoardFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX";
type BoardView = "list" | "columns";

/** How many rows render before the "Load more" control on the board. */
const BOARD_PAGE_SIZE = 25;

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

const EMPTY_POSITION_COUNTS: TeamRoster["positionCounts"] = {
  QB: 0,
  RB: 0,
  WR: 0,
  TE: 0,
  K: 0,
  DST: 0,
};

// A need reads as green while it is an open starting slot (starter or flex) and
// muted once it is only bench depth, so the eye lands on real lineup holes first.
function needChipStyle(level: RosterNeedLevel): CSSProperties {
  if (level === "depth") {
    return {
      borderColor: "var(--home-rule)",
      background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
      color: "var(--home-ink-muted)",
    };
  }
  return {
    borderColor: "color-mix(in srgb, var(--home-positive) 28%, var(--home-rule))",
    background: "color-mix(in srgb, var(--home-positive) 10%, var(--home-paper))",
  };
}

function needChipLabel(need: RosterNeed): string {
  return need.level === "depth" ? `${need.slot} depth` : `Need ${need.slot}`;
}

function needPressureLabel(need: RosterNeed): string {
  return need.level === "depth" ? `Add ${need.slot} depth` : `Prioritize ${need.slot}`;
}

function needTitle(need: RosterNeed): string {
  return need.level === "starter"
    ? "An open starting spot your roster still needs to fill"
    : "Bench depth worth adding once your starting lineup is set";
}

function matchesFilter(player: Player, filter: BoardFilter): boolean {
  if (filter === "ALL") {
    return true;
  }

  if (filter === "FLEX") {
    return ["RB", "WR", "TE"].includes(player.position);
  }

  return player.position === filter;
}

export function DraftBoard({
  players,
  snapshot,
  draftedPlayerIds,
  onDraftPlayer,
  onOpenDetail,
  currentPick,
  currentRound,
  currentTeamName,
  isUserPick,
  isDraftComplete,
  userTeam,
}: DraftBoardProps) {
  const [boardView, setBoardView] = useState<BoardView>("list");
  const [selectedPosition, setSelectedPosition] = useState<BoardFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(BOARD_PAGE_SIZE);
  const debouncedSearch = useDebounce(searchQuery, 200);

  const queue = usePlayerQueue();
  const compare = useCompareTray();

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

  const bestAvailable = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  const rosterNeeds = useMemo(
    () => getRosterNeeds({ positionCounts: userTeam?.positionCounts ?? EMPTY_POSITION_COUNTS }),
    [userTeam]
  );

  // Resolve each open need to the single best available player at that slot, so
  // "Priority" flags your top RB / top WR rather than every player at the
  // position. Needs are walked most-urgent first and each player is claimed once,
  // so the top RB fills the RB starter slot and the flex points at the next best.
  const priorityByPlayerId = useMemo(() => {
    const map = new Map<string, RosterNeed>();
    const claimed = new Set<string>();
    for (const need of rosterNeeds) {
      const best = availablePlayers.find(
        (candidate) => candidate.position === need.slot && !claimed.has(candidate.id)
      );
      if (best) {
        claimed.add(best.id);
        map.set(best.id, need);
      }
    }
    return map;
  }, [availablePlayers, rosterNeeds]);

  // The tier-columns view flags a position as a "Need" only for open starting and
  // flex slots; bench depth stays a softer list-view-only signal.
  const columnNeedPositions = useMemo(
    () =>
      Array.from(
        new Set(rosterNeeds.filter((need) => need.level !== "depth").map((need) => need.slot))
      ),
    [rosterNeeds]
  );

  // Watchlist players still on the board — the "is my guy still here?" glance.
  const queuedAvailable = useMemo(() => {
    const byId = new Map(availablePlayers.map((player) => [player.id, player]));
    return queue.queue.map((id) => byId.get(id)).filter((player): player is Player => Boolean(player));
  }, [availablePlayers, queue.queue]);

  return (
    <div className="home-card scroll-mt-28 p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b pb-4" style={{ borderColor: "var(--home-rule)" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="home-kicker mb-1">Draft Board</p>
            <h2 className="text-2xl font-semibold">
              Pick #{currentPick} on the clock: {currentTeamName}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <div
              className="flex max-w-full rounded-full border p-1 text-sm font-semibold"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
              }}
              role="radiogroup"
              aria-label="Draft board view"
            >
              {([
                { value: "list", label: "Best available" },
                { value: "columns", label: "Tier columns" },
              ] as const).map((option) => {
                const active = boardView === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setBoardView(option.value)}
                    className="inline-flex min-h-[44px] items-center rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200"
                    style={
                      active
                        ? { background: "var(--home-ink)", color: "var(--home-paper)" }
                        : { color: "var(--home-ink-muted)" }
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div
              className="min-h-[40px] rounded-full border px-3 py-2 text-sm font-medium"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
              }}
            >
              {isUserPick ? "Your pick is live" : "Log the room's next selection"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {rosterNeeds.slice(0, 3).map((need) => (
            <span
              key={`need-${need.slot}-${need.level}`}
              className={FANTASY_CHIP_CLASS}
              title={needTitle(need)}
              style={needChipStyle(need.level)}
            >
              {needChipLabel(need)}
            </span>
          ))}
        </div>
      </div>

      {/* Watchlist still on the board */}
      {!isDraftComplete && queuedAvailable.length > 0 && (
        <div
          className="mt-4 rounded-[var(--radius-3xl)] border px-4 py-3"
          style={{
            borderColor: "color-mix(in srgb, var(--home-signal) 40%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-signal) 12%, var(--home-paper))",
          }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <Star size={14} fill="currentColor" style={{ color: "var(--home-signal)" }} aria-hidden="true" />
            <p className="home-kicker mb-0">Your queue · still available ({queuedAvailable.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {queuedAvailable.slice(0, 8).map((player) => (
              <button
                key={`queued-${player.id}`}
                type="button"
                onClick={() => onDraftPlayer(player)}
                disabled={isDraftComplete}
                title={`Log ${player.name}`}
                className="inline-flex min-h-touch items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
              >
                <span className="font-bold tabular-nums">{formatRankValue(player.rankEcr ?? player.averageRank)}</span>
                <span className="max-w-[8rem] truncate">{player.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {boardView === "columns" ? (
        <DraftTierColumns
          snapshot={snapshot}
          draftedPlayerIds={draftedPlayerIds}
          onDraftPlayer={onDraftPlayer}
          isDraftComplete={isDraftComplete}
          rosterNeeds={columnNeedPositions}
        />
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm" htmlFor="draft-board-search">
              <span className="home-kicker mb-0">Search the board</span>
              <input
                id="draft-board-search"
                name="draftBoardSearch"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoComplete="off"
                placeholder="Search player, team, or position"
                className="min-h-[48px] rounded-[var(--radius-3xl)] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                  color: "var(--home-ink)",
                }}
              />
            </label>

            <PositionFilterBar
              ariaLabel="Position filters"
              options={POSITION_OPTIONS}
              value={selectedPosition}
              onChange={setSelectedPosition}
            />

            {!isDraftComplete && bestAvailable.length > 0 && (
              <p aria-live="polite" className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                {filteredPlayers.length} available · showing {bestAvailable.length}
              </p>
            )}

            <div className="grid gap-3">
              {isDraftComplete ? (
                <div
                  className="rounded-[var(--radius-3xl)] border px-5 py-12 text-center"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
                  <p className="text-lg font-semibold">Draft complete.</p>
                  <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    Reset the room to start a new draft board.
                  </p>
                </div>
              ) : bestAvailable.length === 0 ? (
                <div
                  className="rounded-[var(--radius-3xl)] border px-5 py-12 text-center"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
                  <p className="text-lg font-semibold">No players match that filter.</p>
                  <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    Clear the search or switch positions.
                  </p>
                </div>
              ) : (
                <>
                  {bestAvailable.map((player) => {
                    const priorityNeed = priorityByPlayerId.get(player.id);
                    const isStartingPriority = Boolean(priorityNeed) && priorityNeed!.level !== "depth";
                    const isValueAtCurrentPick =
                      Number.isFinite(player.adp) &&
                      currentPick - (player.adp as number) >= getReachStealThreshold(currentRound);
                    const isQueued = queue.isQueued(player.id);
                    const inCompare = compare.inCompare(player.id);

                    return (
                      <div
                        key={player.id}
                        className="relative overflow-hidden rounded-[var(--radius-3xl)] border"
                        style={{
                          borderColor: isStartingPriority
                            ? "color-mix(in srgb, var(--home-positive) 28%, var(--home-rule))"
                            : "var(--home-rule)",
                          background: isStartingPriority
                            ? "color-mix(in srgb, var(--home-positive) 7%, var(--home-paper))"
                            : "color-mix(in srgb, var(--home-paper-alt) 42%, var(--home-elev-mix))",
                        }}
                      >
                        {isQueued && (
                          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: "var(--home-signal)" }} />
                        )}
                        <div className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center md:gap-4">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span
                              className="shrink-0 text-2xl font-semibold tabular-nums"
                              title="Published FantasyPros overall consensus rank"
                            >
                              {formatRankValue(player.rankEcr ?? player.averageRank)}
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenDetail(player)}
                              className="min-w-0 flex-1 text-left"
                              aria-label={`Open ${player.name} detail`}
                            >
                              <span className="flex min-w-0 flex-wrap items-center gap-2">
                                <span className="min-w-0 truncate text-base font-semibold">{player.name}</span>
                                <span className={FANTASY_CHIP_CLASS} style={getPositionTone(player.position)}>
                                  {player.position}
                                </span>
                                {priorityNeed && (
                                  <span
                                    className={FANTASY_CHIP_CLASS}
                                    title={
                                      priorityNeed.level === "depth"
                                        ? "Best available at a position where you still want bench depth"
                                        : "Best available player at a starting spot your roster still needs"
                                    }
                                    style={needChipStyle(priorityNeed.level)}
                                  >
                                    {priorityNeed.level === "depth" ? "Depth" : "Priority"}
                                  </span>
                                )}
                                {isValueAtCurrentPick && (
                                  <span
                                    className={FANTASY_CHIP_CLASS}
                                    title={`Mock drafters usually take this player around pick ${formatAdp(player.adp)}, well before pick ${currentPick}`}
                                    style={{
                                      borderColor: "color-mix(in srgb, var(--home-signal) 38%, var(--home-rule))",
                                      background: "color-mix(in srgb, var(--home-signal) 18%, var(--home-paper))",
                                    }}
                                  >
                                    Value at #{currentPick}
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-sm" style={{ color: "var(--home-ink-muted)" }}>
                                {player.team}
                                {Number.isFinite(player.rankAverage) ? (
                                  <span className="inline-flex items-center">
                                    {" • Avg "}
                                    {Number(player.rankAverage).toFixed(2)}
                                    <MetricTooltip term="Average rank" definition={FANTASY_AVG_RANK_TOOLTIP} />
                                  </span>
                                ) : null}
                                {player.positionRank ? ` • ${player.position}${player.positionRank}` : ""}
                                {player.tier ? ` • Tier ${player.tier}` : ""}
                                {Number.isFinite(player.adp) ? ` • ADP ${formatAdp(player.adp)}` : ""}
                                {` • Range ${formatRange(player)}`}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => queue.toggle(player.id)}
                              aria-pressed={isQueued}
                              aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                              style={
                                isQueued
                                  ? {
                                      borderColor: "color-mix(in srgb, var(--home-signal) 55%, var(--home-rule))",
                                      background: "color-mix(in srgb, var(--home-signal) 28%, var(--home-paper))",
                                      color: "var(--home-ink)",
                                    }
                                  : { borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }
                              }
                            >
                              <Star size={15} fill={isQueued ? "currentColor" : "none"} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => compare.toggle(player.id)}
                              aria-pressed={inCompare}
                              disabled={!inCompare && compare.isFull}
                              aria-label={inCompare ? `Remove ${player.name} from compare` : `Add ${player.name} to compare`}
                              className="hidden h-9 w-9 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-45 sm:inline-flex"
                              style={
                                inCompare
                                  ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                                  : { borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }
                              }
                            >
                              <GitCompareArrows size={15} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenDetail(player)}
                              aria-label={`Details for ${player.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border sm:hidden"
                              style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
                            >
                              <Info size={15} aria-hidden="true" />
                            </button>
                          </div>
                          {/* Log pick sits as a direct child of the row so its details
                              (rank, tier, range) read as one labeled group. */}
                          <button
                            type="button"
                            onClick={() => onDraftPlayer(player)}
                            disabled={isDraftComplete}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                          >
                            Log pick
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => Math.min(count + BOARD_PAGE_SIZE, filteredPlayers.length))}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold"
                      style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                    >
                      Load more ({filteredPlayers.length - bestAvailable.length} left)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:self-start">
            <div
              className="rounded-[var(--radius-3xl)] border p-4"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-1">Available pool</p>
              <p className="text-3xl font-semibold">{availablePlayers.length}</p>
              <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                Players left on the board from the current snapshot.
              </p>
            </div>

            <div
              className="rounded-[var(--radius-3xl)] border p-4"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-1">Roster pressure</p>
              <div className="mt-3 grid gap-2">
                {rosterNeeds.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    You have your starters, flex, and core depth covered.
                  </p>
                ) : (
                  rosterNeeds.map((need) => (
                    <div
                      key={`pressure-${need.slot}-${need.level}`}
                      className="rounded-[var(--radius-3xl)] border px-3 py-2 text-sm font-semibold"
                      style={needChipStyle(need.level)}
                    >
                      {needPressureLabel(need)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
