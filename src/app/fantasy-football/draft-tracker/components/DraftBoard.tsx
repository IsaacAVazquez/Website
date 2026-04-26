"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Player, TeamRoster } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatRange, formatRankValue, getPositionTone } from "@/lib/fantasyUtils";

interface DraftBoardProps {
  players: Player[];
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  currentPick: number;
  currentTeamNumber: number;
  isUserPick: boolean;
  isDraftComplete: boolean;
  userTeam: TeamRoster | undefined;
}

type BoardFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "FLEX";

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
  const targets: Record<keyof typeof counts, number> = {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    K: 1,
    DST: 1,
  };

  return Object.entries(targets)
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
  draftedPlayerIds,
  onDraftPlayer,
  currentPick,
  currentTeamNumber,
  isUserPick,
  isDraftComplete,
  userTeam,
}: DraftBoardProps) {
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
    <div className="home-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b pb-4" style={{ borderColor: "var(--home-rule)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="home-kicker mb-1">Best Available</p>
            <h2 className="text-2xl font-semibold">
              Pick #{currentPick} on the clock: Team {currentTeamNumber}
            </h2>
          </div>
          <div
            className="rounded-full border px-3 py-1.5 text-sm font-medium"
            style={{
              borderColor: "var(--home-rule)",
              background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
            }}
          >
            {isUserPick ? "Your pick is live" : "Log the room's next selection"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {rosterNeeds.slice(0, 3).map((need) => (
            <span
              key={`need-${need}`}
              className="inline-flex min-h-[36px] items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
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

          <div className="flex flex-wrap gap-2">
            {POSITION_LABELS.map((option) => {
              const active = selectedPosition === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedPosition(option.value)}
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
                {(() => {
                  const drafted = availablePlayers.length === 0;
                  const hasSearch = debouncedSearch.trim().length > 0;
                  const positionFilter = selectedPosition !== "ALL";
                  return (
                    <>
                      <p className="text-lg font-semibold">
                        {drafted
                          ? `Every ${positionFilter ? selectedPosition : "player"} on the board has been drafted.`
                          : hasSearch
                            ? `No matches for "${debouncedSearch.trim()}".`
                            : positionFilter
                              ? `No remaining ${selectedPosition}s in the snapshot.`
                              : "No players match that filter."}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                        {drafted
                          ? "Open another position to keep finding value."
                          : hasSearch
                            ? "Try a shorter query or clear the search."
                            : "Switch positions or reset the filter."}
                      </p>
                    </>
                  );
                })()}
              </div>
            ) : (
              bestAvailable.map((player) => {
                const fitsCurrentNeed = rosterNeeds.includes(player.position);

                return (
                  <div
                    key={player.id}
                    className="grid gap-4 rounded-[1.5rem] border px-4 py-4 sm:grid-cols-[72px_minmax(0,1.45fr)_110px_140px_auto] sm:items-center"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 42%, var(--home-elev-mix))",
                    }}
                  >
                    <div>
                      <p className="home-kicker mb-1">Rank</p>
                      <p className="text-2xl font-semibold">{formatRankValue(player.rankEcr ?? player.averageRank)}</p>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold">{player.name}</p>
                        <span
                          className="inline-flex min-h-[32px] items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                          style={getPositionTone(player.position)}
                        >
                          {player.position}
                        </span>
                        {fitsCurrentNeed && (
                          <span
                            className="inline-flex min-h-[32px] items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                            style={{
                              borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
                              background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper))",
                            }}
                          >
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                        {player.team}
                        {Number.isFinite(player.rankAverage) ? ` • Avg ${Number(player.rankAverage).toFixed(2)}` : ""}
                        {player.positionRank ? ` • ${player.position}${player.positionRank}` : ""}
                      </p>
                    </div>

                    <div>
                      <p className="home-kicker mb-1">Tier</p>
                      <p className="text-sm font-semibold">{player.tier ? `Tier ${player.tier}` : "Not listed"}</p>
                    </div>

                    <div>
                      <p className="home-kicker mb-1">Expert range</p>
                      <p className="text-sm font-semibold">{formatRange(player)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDraftPlayer(player)}
                      disabled={isDraftComplete}
                      className="min-h-[44px] rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
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

        <div className="grid gap-4">
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
    </div>
  );
}
