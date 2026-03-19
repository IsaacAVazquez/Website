"use client";

import { useMemo, useState } from "react";
import { Player, TeamRoster } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

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
    <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Best Available</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Pick #{currentPick} on the clock: Team {currentTeamNumber}
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
            {isUserPick ? "Your pick is live" : "Log the room's next selection"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {rosterNeeds.slice(0, 3).map((need) => (
            <span
              key={`need-${need}`}
              className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100"
            >
              Need {need}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-200">Search the board</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search player, team, or position"
              className="min-h-[48px] rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
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
                  className={`min-h-[42px] rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-slate-950"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3">
            {isDraftComplete ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.035] px-5 py-12 text-center">
                <p className="text-lg font-semibold text-white">Draft complete.</p>
                <p className="mt-2 text-sm text-slate-400">Reset the room to start a new draft board.</p>
              </div>
            ) : bestAvailable.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.035] px-5 py-12 text-center">
                <p className="text-lg font-semibold text-white">No players match that filter.</p>
                <p className="mt-2 text-sm text-slate-400">Clear the search or switch positions.</p>
              </div>
            ) : (
              bestAvailable.map((player, index) => (
                <div
                  key={player.id}
                  className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] px-4 py-4 sm:grid-cols-[72px_minmax(0,1.3fr)_110px_120px_auto] sm:items-center"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Rank</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{index + 1}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{player.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {player.team} • {player.position}
                      {player.tier ? ` • Tier ${player.tier}` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Proj. Pts
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{Math.round(player.projectedPoints ?? 0)}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">ADP</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {player.adp ? Math.round(player.adp) : "--"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDraftPlayer(player)}
                    disabled={isDraftComplete}
                    className="min-h-[44px] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Log pick
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Available pool</p>
            <p className="mt-2 text-3xl font-semibold text-white">{availablePlayers.length}</p>
            <p className="mt-2 text-sm text-slate-400">Players left on the board from the current snapshot.</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Roster pressure</p>
            <div className="mt-3 grid gap-2">
              {rosterNeeds.length === 0 ? (
                <p className="text-sm text-slate-400">You have the core starting spots covered.</p>
              ) : (
                rosterNeeds.map((need) => (
                  <div
                    key={`pressure-${need}`}
                    className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100"
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
