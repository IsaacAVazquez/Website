"use client";

import { useMemo } from "react";

import {
  getFantasyPlayersForPosition,
  type FantasyRoutePosition,
  type FantasySnapshot,
} from "@/lib/fantasy";
import { formatRankValue, getPositionTone } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

interface DraftTierColumnsProps {
  snapshot: FantasySnapshot | null;
  draftedPlayerIds: Set<string>;
  onDraftPlayer: (player: Player) => void;
  isDraftComplete: boolean;
  rosterNeeds: string[];
}

// Skill positions where tier scarcity actually drives draft-day decisions.
// K/DST are intentionally omitted — they come off the board late and their
// tiers carry little signal during the meaningful part of a draft.
const COLUMN_POSITIONS: { route: FantasyRoutePosition; label: string }[] = [
  { route: "qb", label: "QB" },
  { route: "rb", label: "RB" },
  { route: "wr", label: "WR" },
  { route: "te", label: "TE" },
];

// How many available players to surface per column before collapsing the rest
// into a "+N more" footer — enough to see the next tier or two without the
// column running off the screen.
const MAX_VISIBLE_PER_COLUMN = 10;

// A current tier with this many or fewer players left is a "cliff": value drops
// off after it, so the team on the clock should consider reaching now.
const TIER_CLIFF_THRESHOLD = 2;

type TierKey = number | "untiered";

interface TierGroup {
  tier: TierKey;
  players: Player[];
}

function groupAvailableByTier(players: Player[]): TierGroup[] {
  const buckets = new Map<TierKey, Player[]>();

  for (const player of players) {
    const key: TierKey =
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
    .map(([tier, tierPlayers]) => ({ tier: tier as number, players: tierPlayers }));

  const untiered = buckets.get("untiered");
  if (untiered && untiered.length > 0) {
    tiered.push({ tier: "untiered", players: untiered });
  }

  return tiered;
}

// Trim the grouped tiers down to MAX_VISIBLE_PER_COLUMN players while keeping
// the tier boundaries intact, and report how many available players were left
// out so the column can show a "+N more" footer.
function takeVisibleGroups(groups: TierGroup[]): { groups: TierGroup[]; shown: number } {
  const visible: TierGroup[] = [];
  let shown = 0;

  for (const group of groups) {
    if (shown >= MAX_VISIBLE_PER_COLUMN) {
      break;
    }
    const slice = group.players.slice(0, MAX_VISIBLE_PER_COLUMN - shown);
    visible.push({ tier: group.tier, players: slice });
    shown += slice.length;
  }

  return { groups: visible, shown };
}

export function DraftTierColumns({
  snapshot,
  draftedPlayerIds,
  onDraftPlayer,
  isDraftComplete,
  rosterNeeds,
}: DraftTierColumnsProps) {
  const columns = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return COLUMN_POSITIONS.map(({ route, label }) => {
      const available = getFantasyPlayersForPosition(snapshot, route).filter(
        (player) => !draftedPlayerIds.has(player.id)
      );
      return { route, label, available, groups: groupAvailableByTier(available) };
    });
  }, [snapshot, draftedPlayerIds]);

  if (columns.length === 0) {
    return (
      <div
        className="mt-5 rounded-[1.5rem] border px-5 py-12 text-center"
        style={{
          borderColor: "var(--home-rule)",
          background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
        }}
      >
        <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
          Loading the position boards…
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tier columns by position">
      {columns.map((column) => {
        const isNeed = rosterNeeds.includes(column.label);
        const topGroup = column.groups[0];
        const isCliff =
          Boolean(topGroup) &&
          topGroup.tier !== "untiered" &&
          topGroup.players.length <= TIER_CLIFF_THRESHOLD &&
          column.available.length > 0;
        const { groups: visibleGroups, shown } = takeVisibleGroups(column.groups);
        const hiddenCount = column.available.length - shown;

        return (
          <section
            key={column.route}
            className="flex flex-col rounded-[1.5rem] border p-4"
            style={{
              borderColor: isNeed
                ? "color-mix(in srgb, var(--color-success) 30%, var(--home-rule))"
                : "var(--home-rule)",
              background: "color-mix(in srgb, var(--home-paper-alt) 42%, var(--home-elev-mix))",
            }}
            aria-label={`${column.label} tier column`}
          >
            <header
              className="flex items-center justify-between gap-2 border-b pb-3"
              style={{ borderColor: "var(--home-rule)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex min-h-[28px] items-center rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]"
                  style={getPositionTone(column.label)}
                >
                  {column.label}
                </span>
                {isNeed && (
                  <span
                    className="inline-flex min-h-[28px] items-center rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))",
                      background: "color-mix(in srgb, var(--color-success) 10%, var(--home-paper))",
                    }}
                  >
                    Need
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
                {column.available.length} left
              </span>
            </header>

            {isCliff && topGroup.tier !== "untiered" && (
              <p
                className="mt-3 inline-flex items-center self-start rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]"
                style={{
                  borderColor: "color-mix(in srgb, var(--color-warning) 32%, var(--home-rule))",
                  background: "color-mix(in srgb, var(--color-warning) 12%, var(--home-paper))",
                  color: "var(--home-ink)",
                }}
              >
                Tier {topGroup.tier} cliff · {topGroup.players.length} left
              </p>
            )}

            {column.available.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                No {column.label} players left on the board.
              </p>
            ) : (
              <div className="mt-3 grid gap-3">
                {visibleGroups.map((group) => (
                  <div key={String(group.tier)} className="grid gap-1.5">
                    <p className="home-kicker mb-0">
                      {group.tier === "untiered" ? "Untiered" : `Tier ${group.tier}`}
                    </p>
                    {group.players.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => onDraftPlayer(player)}
                        disabled={isDraftComplete}
                        title="Log this player to the team on the clock"
                        aria-label={`Draft ${player.name}, ${column.label}${
                          player.positionRank ? ` ${player.positionRank}` : ""
                        }`}
                        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[0.9rem] border px-3 py-2 text-left text-sm transition-[background-color,border-color,color] duration-200 hover:border-[var(--home-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: "var(--home-rule)",
                          background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                          color: "var(--home-ink)",
                        }}
                      >
                        <span className="min-w-0 truncate font-semibold">{player.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
                            {player.team}
                          </span>
                          <span
                            className="tabular-nums text-xs font-semibold"
                            style={{ color: "var(--home-ink-muted)" }}
                          >
                            {column.label}
                            {formatRankValue(player.positionRank ?? player.rankEcr ?? player.averageRank)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
                    +{hiddenCount} more available
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
