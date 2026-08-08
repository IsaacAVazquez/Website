"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { RankedBestBallPlayer } from "@/lib/bestBall/types";
import type { Player } from "@/types";

type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE";

const POSITION_FILTERS: readonly PositionFilter[] = ["ALL", "QB", "RB", "WR", "TE"];

const ROW_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
} as const;

// The chip already prints the position, so hue was carrying nothing the label
// wasn't. DESIGN.md sends categorical needs to ink and stone and keeps signal,
// positive, and warning for status, so a green RB and an amber TE no longer
// read as "good" and "caution" to anyone who learned those colors elsewhere on
// the site. This also retires the last --home-moss in the fantasy tree.
const POSITION_CHIP_STYLE = {
  borderColor: "color-mix(in srgb, var(--home-ink) 24%, var(--home-rule))",
  color: "var(--home-ink)",
} as const;

export function BestBallDraftBoard({
  players,
  currentPick,
  currentTeamNumber,
  isComplete,
  adpAvailable,
  onDraftPlayer,
}: {
  players: readonly RankedBestBallPlayer[];
  currentPick: number;
  currentTeamNumber: number | null;
  isComplete: boolean;
  adpAvailable: boolean;
  onDraftPlayer: (player: Player) => void;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [visibleCount, setVisibleCount] = useState(120);

  const filteredPlayers = useMemo(() => {
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return players.filter((player) => {
      if (position !== "ALL" && player.position !== position) return false;
      if (tokens.length === 0) return true;
      const searchable = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return tokens.every((token) => searchable.includes(token));
    });
  }, [players, position, query]);

  const shownPlayers = filteredPlayers.slice(0, visibleCount);

  return (
    <section className="home-card min-w-0 overflow-hidden" aria-labelledby="best-ball-player-board-heading">
      <div className="border-b p-5 sm:p-6" style={{ borderColor: "var(--home-rule)" }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="home-kicker mb-1">Room board</p>
            <h2 id="best-ball-player-board-heading" className="text-2xl font-semibold">
              Log the player selected
            </h2>
          </div>
          <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
            {isComplete
              ? "Draft complete"
              : `Pick ${currentPick} belongs to slot ${currentTeamNumber}`}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(13rem,1fr)_auto] md:items-center">
          <label className="relative block min-w-0">
            <span className="sr-only">Search available players</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--home-ink-muted)" }}
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or team"
              className="min-h-[48px] w-full rounded-full border bg-transparent pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
              style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
            />
          </label>

          <fieldset>
            <legend className="sr-only">Filter by position</legend>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Player position">
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

      <div className="hidden grid-cols-[3rem_minmax(0,1fr)_4rem_4rem_6.5rem_4rem] gap-3 border-b px-4 py-3 text-2xs font-semibold uppercase tracking-[0.08em] sm:grid" style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}>
        <span>Board</span>
        <span>Player</span>
        <span>Pos</span>
        <span>Team</span>
        <span>{adpAvailable ? "Underdog ADP" : "Source rank"}</span>
        <span>Bye</span>
      </div>

      <div className="grid">
        {shownPlayers.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => onDraftPlayer(player)}
            disabled={isComplete}
            aria-label={`Log ${player.name} at pick ${currentPick}`}
            className="grid min-h-[60px] min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-2 text-left transition-[background-color,color,opacity] duration-150 hover:bg-[var(--home-paper-alt)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--home-signal)] disabled:cursor-not-allowed disabled:opacity-50 sm:grid-cols-[3rem_minmax(0,1fr)_4rem_4rem_6.5rem_4rem]"
            style={ROW_STYLE}
          >
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
              {player.bestBallRank}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{player.name}</span>
              <span className="mt-1 block truncate text-xs sm:hidden" style={{ color: "var(--home-ink-muted)" }}>
                {player.team} · {adpAvailable ? "ADP" : "Source rank"}{" "}
                {adpAvailable
                  ? player.adp?.toFixed(1) ?? "not available"
                  : player.adjustedRank.toFixed(0)}{" "}
                · Bye{" "}
                {player.byeWeek ?? "not available"}
              </span>
              {player.rankAdjustment !== 0 ? (
                <span className="mt-1 hidden truncate text-2xs lg:block" style={{ color: "var(--home-signal)" }}>
                  {player.rankReason}
                </span>
              ) : null}
            </span>
            <span
              className="inline-flex min-h-[28px] min-w-[38px] items-center justify-center rounded-full border px-2 text-xs font-semibold sm:min-h-0 sm:justify-start sm:border-0 sm:px-0"
              style={POSITION_CHIP_STYLE}
            >
              {player.position}
            </span>
            <span className="hidden text-xs font-medium sm:block">{player.team}</span>
            <span className="hidden text-xs tabular-nums sm:block">
              {adpAvailable
                ? player.adp?.toFixed(1) ?? "Not matched"
                : player.adjustedRank.toFixed(0)}
            </span>
            <span className="hidden text-xs tabular-nums sm:block">
              {player.byeWeek ?? "Unknown"}
            </span>
          </button>
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
