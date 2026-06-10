"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Player, TeamRoster } from "@/types";
import type { FantasySnapshot } from "@/lib/fantasy";
import { useDebounce } from "@/hooks/useDebounce";
import { getReachStealThreshold, ROSTER_STARTER_TARGETS } from "@/lib/draftAnalytics";
import { FANTASY_AVG_RANK_TOOLTIP, FANTASY_CHIP_CLASS, formatAdp, formatRange, formatRankValue, getPositionTone } from "@/lib/fantasyUtils";
import { MetricTooltip } from "@/components/investments/MetricTooltip";
import { DraftTierColumns } from "./DraftTierColumns";

interface DraftBoardProps {
  players: Player[];
  snapshot: FantasySnapshot | null;
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  currentPick: number;
  currentRound: number;
  currentTeamNumber: number;
  isUserPick: boolean;
  isDraftComplete: boolean;
  userTeam: TeamRoster | undefined;
}

type BoardFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX";
type BoardView = "list" | "columns";

const POSITION_LABELS: { value: BoardFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "QB", label: "QB" },
  { value: "RB", label: "RB" },
  { value: "WR", label: "WR" },
  { value: "TE", label: "TE" },
  { value: "FLEX", label: "Flex" },
  { value: "K", label: "K" },
  { value: "DST", label: "DST" },
];

function getRosterNeedOrder(userTeam: TeamRoster | undefined): string[] {
  if (!userTeam) {
    return ["RB", "WR", "QB"];
  }

  const counts = userTeam.positionCounts;

  return Object.entries(ROSTER_STARTER_TARGETS)
    .map(([position, target]) => ({
      position,
      gap: target - counts[position as keyof typeof counts],
    }))
    .sort((left, right) => right.gap - left.gap)
    .filter((entry) => entry.gap > 0)
    .map((entry) => entry.position);
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

function getFilterStyle(active: boolean): CSSProperties {
  if (active) {
    return {
      borderColor: "var(--home-ink)",
      background: "var(--home-ink)",
      color: "var(--home-paper)",
    };
  }

  return {
    borderColor: "var(--home-rule)",
    background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
    color: "var(--home-ink)",
  };
}

export function DraftBoard({
  players,
  snapshot,
  draftedPlayerIds,
  onDraftPlayer,
  currentPick,
  currentRound,
  currentTeamNumber,
  isUserPick,
  isDraftComplete,
  userTeam,
}: DraftBoardProps) {
  const [boardView, setBoardView] = useState<BoardView>("list");
  const [selectedPosition, setSelectedPosition] = useState<BoardFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 200);

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

  const bestAvailable = filteredPlayers.slice(0, 30);
  const rosterNeeds = getRosterNeedOrder(userTeam);

  return (
    <div className="home-card scroll-mt-28 p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b pb-4" style={{ borderColor: "var(--home-rule)" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="home-kicker mb-1">Draft Board</p>
            <h2 className="text-2xl font-semibold">
              Pick #{currentPick} on the clock: Team {currentTeamNumber}
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
              key={`need-${need}`}
              className={FANTASY_CHIP_CLASS}
              title="Your roster still has an open starting spot at this position"
              style={{
                borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
                background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper))",
              }}
            >
              Need {need}
            </span>
          ))}
        </div>
      </div>

      {boardView === "columns" ? (
        <DraftTierColumns
          snapshot={snapshot}
          draftedPlayerIds={draftedPlayerIds}
          onDraftPlayer={onDraftPlayer}
          isDraftComplete={isDraftComplete}
          rosterNeeds={rosterNeeds}
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
                className="min-h-[48px] rounded-[1.2rem] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                  color: "var(--home-ink)",
                }}
              />
            </label>

            <div className="flex flex-wrap gap-2" aria-label="Position filters">
              {POSITION_LABELS.map((option) => {
                const active = selectedPosition === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedPosition(option.value)}
                    aria-pressed={active}
                    className="min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                    style={getFilterStyle(active)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3">
              {isDraftComplete ? (
                <div
                  className="rounded-[1.5rem] border px-5 py-12 text-center"
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
                  className="rounded-[1.5rem] border px-5 py-12 text-center"
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
                bestAvailable.map((player) => {
                  const fitsCurrentNeed = rosterNeeds.includes(player.position);
                  const isValueAtCurrentPick =
                    Number.isFinite(player.adp) &&
                    currentPick - (player.adp as number) >= getReachStealThreshold(currentRound);

                  return (
                    <div
                      key={player.id}
                      className="grid gap-4 rounded-[1.5rem] border px-4 py-4 md:grid-cols-[3.5rem_minmax(8rem,1fr)_4.5rem_6.5rem_5.5rem] md:items-center md:gap-x-3"
                      style={{
                        borderColor: fitsCurrentNeed
                          ? "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))"
                          : "var(--home-rule)",
                        background: fitsCurrentNeed
                          ? "color-mix(in srgb, var(--color-success) 7%, var(--home-paper))"
                          : "color-mix(in srgb, var(--home-paper-alt) 42%, var(--home-elev-mix))",
                      }}
                    >
                      <div className="flex min-w-0 items-start gap-3 md:contents">
                        <div className="shrink-0">
                          <p className="home-kicker mb-1">Rank</p>
                          <p
                            className="text-2xl font-semibold tabular-nums"
                            title="Published FantasyPros overall consensus rank"
                          >
                            {formatRankValue(player.rankEcr ?? player.averageRank)}
                          </p>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="min-w-0 truncate text-base font-semibold">{player.name}</p>
                            <span className={FANTASY_CHIP_CLASS} style={getPositionTone(player.position)}>
                              {player.position}
                            </span>
                            {fitsCurrentNeed && (
                              <span
                                className={FANTASY_CHIP_CLASS}
                                title="Fills a starting spot your roster still needs"
                                style={{
                                  borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
                                  background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper))",
                                }}
                              >
                                Priority
                              </span>
                            )}
                            {isValueAtCurrentPick && (
                              <span
                                className={FANTASY_CHIP_CLASS}
                                title={`Mock drafters usually take this player around pick ${formatAdp(player.adp)}, well before pick ${currentPick}`}
                                style={{
                                  borderColor: "color-mix(in srgb, var(--home-acid) 38%, var(--home-rule))",
                                  background: "color-mix(in srgb, var(--home-acid) 18%, var(--home-paper))",
                                }}
                              >
                                Value at #{currentPick}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                            {player.team}
                            {Number.isFinite(player.rankAverage) ? (
                              <span className="inline-flex items-center">
                                {" • Avg "}
                                {Number(player.rankAverage).toFixed(2)}
                                <MetricTooltip term="Average rank" definition={FANTASY_AVG_RANK_TOOLTIP} />
                              </span>
                            ) : null}
                            {player.positionRank ? ` • ${player.position}${player.positionRank}` : ""}
                            {Number.isFinite(player.adp) ? ` • ADP ${formatAdp(player.adp)}` : ""}
                          </p>
                        </div>
                      </div>

                      <div
                        className="grid grid-cols-2 gap-3 border-t pt-3 md:contents"
                        style={{ borderColor: "var(--home-rule)" }}
                      >
                        <div className="min-w-0">
                          <p className="home-kicker mb-1">Tier</p>
                          <p
                            className="truncate text-sm font-semibold"
                            title="FantasyPros consensus tier. Gaps between tiers mark value drop-offs"
                          >
                            {player.tier ? `Tier ${player.tier}` : "Not listed"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="home-kicker mb-1">Range</p>
                          <p
                            className="truncate text-sm font-semibold tabular-nums"
                            title="Best and worst rank across the experts in the consensus"
                          >
                            {formatRange(player)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDraftPlayer(player)}
                        disabled={isDraftComplete}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:justify-self-end md:px-3"
                        style={{
                          borderColor: "var(--home-ink)",
                          background: "var(--home-ink)",
                          color: "var(--home-paper)",
                        }}
                      >
                        Log pick
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:self-start">
            <div
              className="rounded-[1.5rem] border p-4"
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
              className="rounded-[1.5rem] border p-4"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-1">Roster pressure</p>
              <div className="mt-3 grid gap-2">
                {rosterNeeds.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    You have the core starting spots covered.
                  </p>
                ) : (
                  rosterNeeds.map((need) => (
                    <div
                      key={`pressure-${need}`}
                      className="rounded-[1rem] border px-3 py-2 text-sm font-semibold"
                      style={{
                        borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
                        background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper))",
                      }}
                    >
                      Prioritize {need}
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
