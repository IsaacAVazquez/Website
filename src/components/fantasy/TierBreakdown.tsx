"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";

import { FANTASY_POSITION_LABELS, type FantasyRoutePosition } from "@/lib/fantasy";
import { formatAdp, formatRankValue, getPositionTone, getTierGap } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

interface TierBreakdownProps {
  players: Player[];
  position: FantasyRoutePosition;
  getPublishedRank: (player: Player) => string;
  onSelectPlayer?: (player: Player) => void;
  isQueued?: (id: string) => boolean;
  onToggleQueue?: (id: string) => void;
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

export function TierBreakdown({
  players,
  position,
  getPublishedRank,
  onSelectPlayer,
  isQueued,
  onToggleQueue,
}: TierBreakdownProps) {
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

  // Numeric published rank for the first/last player in a group, used to surface
  // the "cliff" between tiers.
  const numericRank = (player: Player): number => Number.parseFloat(getPublishedRank(player));

  return (
    <div className="grid scroll-mt-28 gap-4" aria-label={`${positionLabel} tier breakdown`}>
      {groups.map((group, index) => {
        const isUntiered = group.tier === "untiered";
        const accent = isUntiered ? "6%" : tierAccent(index, Math.max(tieredGroups.length, 1));
        const label = isUntiered ? "Untiered" : `Tier ${group.tier}`;
        const description = isUntiered
          ? "Players without an assigned tier"
          : `${group.players.length} ${group.players.length === 1 ? "player" : "players"}`;

        // Cliff to the previous tier: ranks dropped from the last player of the
        // prior group to the first player of this one.
        const previousGroup = index > 0 ? groups[index - 1] : null;
        const cliff =
          !isUntiered && previousGroup && previousGroup.tier !== "untiered"
            ? getTierGap(
                numericRank(previousGroup.players[previousGroup.players.length - 1]),
                numericRank(group.players[0])
              )
            : 0;

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
            <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="flex flex-wrap items-baseline gap-3">
                <p className="home-kicker mb-0">{label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                  {description}
                </p>
                {cliff > 0 && (
                  <span
                    className="text-2xs font-semibold uppercase tracking-[0.12em]"
                    title="Rank cliff from the previous tier"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    ↓ {cliff} {cliff === 1 ? "rank" : "ranks"} from prior tier
                  </span>
                )}
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
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.12em]"
                    title="Published consensus ranks covered by this tier"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Ranks {formatRankValue(rankedPlayers[0].rank)}–
                    {formatRankValue(rankedPlayers[rankedPlayers.length - 1].rank)}
                  </p>
                );
              })()}
            </header>

            <ul role="list" className="mt-4 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]">
              {group.players.map((player) => {
                const queued = isQueued?.(player.id) ?? false;
                const interactive = Boolean(onSelectPlayer);
                const Pill = interactive ? "button" : "span";

                return (
                  <li key={player.id} className="min-w-0">
                    <div
                      className="flex items-center gap-1.5 rounded-full border pr-1.5"
                      style={{
                        borderColor: queued
                          ? "color-mix(in srgb, var(--home-acid) 55%, var(--home-rule))"
                          : "var(--home-rule)",
                        background: "var(--home-paper-raised)",
                      }}
                    >
                      <Pill
                        {...(interactive
                          ? { type: "button" as const, onClick: () => onSelectPlayer?.(player), "aria-label": `Open ${player.name} detail` }
                          : {})}
                        className={`grid min-h-[38px] min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                          interactive ? "text-left" : ""
                        }`}
                        style={{ color: "var(--home-ink)" }}
                      >
                        <span
                          className="inline-flex min-w-[2rem] items-center justify-center rounded-full border px-2 py-0.5 text-2xs font-semibold tabular-nums"
                          style={getPositionTone(player.position)}
                          aria-hidden="true"
                        >
                          {getPublishedRank(player)}
                        </span>
                        <span className="min-w-0 truncate font-semibold">{player.name}</span>
                        {player.team && (
                          <span
                            className="shrink-0 text-xs font-medium uppercase tracking-[0.1em]"
                            style={{ color: "var(--home-ink-muted)" }}
                          >
                            {player.team}
                            {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
                          </span>
                        )}
                      </Pill>
                      {Number.isFinite(player.adp) && (
                        <span
                          className="shrink-0 text-2xs"
                          title="Average draft position from recent mock drafts"
                          style={{ color: "var(--home-ink-muted)" }}
                        >
                          ADP {formatAdp(player.adp)}
                        </span>
                      )}
                      {onToggleQueue && (
                        <button
                          type="button"
                          onClick={() => onToggleQueue(player.id)}
                          aria-pressed={queued}
                          aria-label={queued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                          style={{ color: queued ? "var(--home-ink)" : "var(--home-ink-muted)" }}
                        >
                          <Star size={14} fill={queued ? "currentColor" : "none"} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
