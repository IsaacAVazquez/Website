"use client";

import { useMemo } from "react";

import { FANTASY_POSITION_LABELS, type FantasyRoutePosition } from "@/lib/fantasy";
import { formatRankValue, getPositionTone } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

interface TierBreakdownProps {
  players: Player[];
  position: FantasyRoutePosition;
  getPublishedRank: (player: Player) => string;
}

interface TierGroup {
  tier: number | "untiered";
  players: Player[];
}

function groupByTier(players: Player[]): TierGroup[] {
  const buckets = new Map<number | "untiered", Player[]>();

  for (const player of players) {
    const key: number | "untiered" =
      typeof player.tier === "number" && Number.isFinite(player.tier) ? player.tier : "untiered";
    const existing = buckets.get(key);
    if (existing) {
      existing.push(player);
    } else {
      buckets.set(key, [player]);
    }
  }

  const tiered: TierGroup[] = Array.from(buckets.entries())
    .filter(([tier]) => tier !== "untiered")
    .sort(([a], [b]) => (a as number) - (b as number))
    .map(([tier, tierPlayers]) => ({
      tier: tier as number,
      players: tierPlayers,
    }));

  const untiered = buckets.get("untiered");
  if (untiered && untiered.length > 0) {
    tiered.push({ tier: "untiered", players: untiered });
  }

  return tiered;
}

function tierAccent(index: number, total: number): string {
  if (total <= 1) {
    return "24%";
  }
  const topWeight = 26;
  const bottomWeight = 8;
  const progress = index / (total - 1);
  const mixed = topWeight - (topWeight - bottomWeight) * progress;
  return `${mixed.toFixed(0)}%`;
}

export function TierBreakdown({ players, position, getPublishedRank }: TierBreakdownProps) {
  const groups = useMemo(() => groupByTier(players), [players]);

  if (groups.length === 0) {
    return (
      <div
        className="rounded-[1.5rem] border px-5 py-10 text-center"
        style={{
          borderColor: "color-mix(in srgb, var(--color-warning) 32%, var(--home-rule))",
          background: "color-mix(in srgb, var(--color-warning) 10%, var(--home-paper))",
        }}
      >
        <p className="text-lg font-semibold">No tier data for this board</p>
        <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
          Tiers come from FantasyPros directly. Try list view or a different board.
        </p>
      </div>
    );
  }

  const tieredGroups = groups.filter((group) => group.tier !== "untiered");
  const positionLabel = FANTASY_POSITION_LABELS[position];

  return (
    <div className="grid gap-4" aria-label={`${positionLabel} tier breakdown`}>
      {groups.map((group, index) => {
        const isUntiered = group.tier === "untiered";
        const accent = isUntiered ? "6%" : tierAccent(index, Math.max(tieredGroups.length, 1));
        const label = isUntiered ? "Untiered" : `Tier ${group.tier}`;
        const description = isUntiered
          ? "Players without an assigned tier"
          : `${group.players.length} ${group.players.length === 1 ? "player" : "players"}`;

        return (
          <section
            key={String(group.tier)}
            className="rounded-[1.5rem] border px-5 py-5"
            style={{
              borderColor: "var(--home-rule)",
              background: `color-mix(in srgb, var(--home-acid) ${accent}, var(--home-paper))`,
            }}
            aria-label={label}
          >
            <header className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <p className="home-kicker mb-0">{label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                  {description}
                </p>
              </div>
              {!isUntiered && (() => {
                // Skip players whose published rank is "--" or otherwise
                // non-numeric — Number("--") is NaN, which formats back to "--"
                // and produced misleading "Ranks --–--" labels for partially
                // ranked tiers.
                const rankedPlayers = group.players
                  .map((player) => ({ player, rank: Number.parseFloat(getPublishedRank(player)) }))
                  .filter((entry) => Number.isFinite(entry.rank));

                if (rankedPlayers.length === 0) {
                  return (
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                      Ranks unavailable
                    </p>
                  );
                }

                return (
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                    Ranks {formatRankValue(rankedPlayers[0].rank)}–
                    {formatRankValue(rankedPlayers[rankedPlayers.length - 1].rank)}
                  </p>
                );
              })()}
            </header>

            <ul role="list" className="mt-4 flex flex-wrap gap-2">
              {group.players.map((player) => (
                <li key={player.id}>
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
                      color: "var(--home-ink)",
                    }}
                  >
                    <span
                      className="inline-flex min-w-[2rem] items-center justify-center rounded-full border px-2 py-0.5 text-2xs font-semibold"
                      style={getPositionTone(player.position)}
                      aria-hidden="true"
                    >
                      {getPublishedRank(player)}
                    </span>
                    <span className="font-semibold">{player.name}</span>
                    {player.team && (
                      <span className="text-xs font-medium uppercase tracking-[0.1em]" style={{ color: "var(--home-ink-muted)" }}>
                        {player.team}
                      </span>
                    )}
                    {player.byeWeek && (
                      <span className="text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                        Bye {player.byeWeek}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
