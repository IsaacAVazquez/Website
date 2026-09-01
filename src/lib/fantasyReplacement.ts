import { ADP_SIGNAL_MIN_TIMES_DRAFTED, getAdpSignalThreshold } from "@/lib/fantasyUtils";
import { getRedraftRosterTarget } from "@/lib/redraftLineup";
import { clamp } from "@/lib/utils";
import type { Player, Position, RedraftLineupSettings } from "@/types";

export const REPLACEMENT_STARTER_VALUE_WEIGHT = 0.75;
export const REPLACEMENT_DEPTH_VALUE_WEIGHT = 0.25;

export const FANTASY_REPLACEMENT_POSITIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DST",
] as const;

const FLEX_POSITIONS = ["RB", "WR", "TE"] as const;

export type FantasyReplacementPosition = Extract<
  Position,
  (typeof FANTASY_REPLACEMENT_POSITIONS)[number]
>;

export interface FantasyReplacementLeague {
  teams: number;
  rosterSize: number;
  lineup: RedraftLineupSettings;
}

export interface FantasyReplacementCutoff {
  starter: number | null;
  roster: number | null;
}

export type FantasyReplacementCutoffs = Record<
  FantasyReplacementPosition,
  FantasyReplacementCutoff
>;

export interface FantasyReplacementSourceValue {
  value: number;
  coverage: number;
}

export function isFinitePositiveReplacementValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isFantasyReplacementPosition(
  position: Position
): position is FantasyReplacementPosition {
  return FANTASY_REPLACEMENT_POSITIONS.includes(
    position as FantasyReplacementPosition
  );
}

export function getFantasyReplacementExpertRank(player: Player): number | null {
  if (isFinitePositiveReplacementValue(player.rankEcr)) return player.rankEcr;
  return isFinitePositiveReplacementValue(player.averageRank)
    ? player.averageRank
    : null;
}

export function hasReliableFantasyReplacementMarket(player: Player): boolean {
  // Stricter than the shared display predicate on purpose. The wait reading
  // and the trade calculator's verdicts lean on this, and the model doc
  // promises at least 20 observed selections behind any market they call
  // reliable. A source that stops publishing per-player counts loses these
  // surfaces rather than silently passing, which is the failure the display
  // signals are allowed to tolerate and a verdict is not.
  return (
    isFinitePositiveReplacementValue(player.adp) &&
    typeof player.adpTimesDrafted === "number" &&
    Number.isFinite(player.adpTimesDrafted) &&
    player.adpTimesDrafted >= ADP_SIGNAL_MIN_TIMES_DRAFTED
  );
}

function emptyCutoffs(): FantasyReplacementCutoffs {
  return Object.fromEntries(
    FANTASY_REPLACEMENT_POSITIONS.map((position) => [
      position,
      { starter: null, roster: null },
    ])
  ) as FantasyReplacementCutoffs;
}

/**
 * Builds fixed league replacement lines from a complete pre-draft player board.
 * Dedicated starters are filled first, FLEX is allocated from the remaining
 * RB/WR/TE pool, and the roster line uses the same final target as Draft Outlook.
 */
export function buildFantasyReplacementCutoffs(
  players: readonly Player[],
  league: FantasyReplacementLeague,
  rankFor: (player: Player) => number | null
): FantasyReplacementCutoffs {
  const cutoffs = emptyCutoffs();
  const rankedPlayers = players
    .map((player) => ({ player, rank: rankFor(player) }))
    .filter(
      (entry): entry is { player: Player; rank: number } =>
        entry.rank !== null && isFantasyReplacementPosition(entry.player.position)
    )
    .sort(
      (left, right) =>
        left.rank - right.rank || left.player.id.localeCompare(right.player.id)
    );

  const selectedStarterIds = new Set<string>();
  const starterRanks: Record<FantasyReplacementPosition, number[]> = {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    K: [],
    DST: [],
  };
  const mandatoryComplete: Record<FantasyReplacementPosition, boolean> = {
    QB: true,
    RB: true,
    WR: true,
    TE: true,
    K: true,
    DST: true,
  };

  for (const position of FANTASY_REPLACEMENT_POSITIONS) {
    const required = league.teams * league.lineup[position];
    if (required === 0) continue;
    const candidates = rankedPlayers.filter(
      (entry) => entry.player.position === position
    );
    if (candidates.length < required) mandatoryComplete[position] = false;
    for (const entry of candidates.slice(0, required)) {
      selectedStarterIds.add(entry.player.id);
      starterRanks[position].push(entry.rank);
    }
  }

  const flexRequired = league.teams * league.lineup.FLEX;
  const flexCandidates = rankedPlayers.filter(
    (entry) =>
      FLEX_POSITIONS.includes(
        entry.player.position as (typeof FLEX_POSITIONS)[number]
      ) && !selectedStarterIds.has(entry.player.id)
  );
  const flexComplete = flexCandidates.length >= flexRequired;
  for (const entry of flexCandidates.slice(0, flexRequired)) {
    const position = entry.player.position as (typeof FLEX_POSITIONS)[number];
    selectedStarterIds.add(entry.player.id);
    starterRanks[position].push(entry.rank);
  }

  const target = getRedraftRosterTarget(league.lineup, league.rosterSize);
  const rosterCounts = Object.fromEntries(
    FANTASY_REPLACEMENT_POSITIONS.map((position) => [
      position,
      Math.max(league.teams * target[position], starterRanks[position].length),
    ])
  ) as Record<FantasyReplacementPosition, number>;
  const rosterCapacity = league.teams * league.rosterSize;
  let rosterExcess = Math.max(
    0,
    Object.values(rosterCounts).reduce((sum, count) => sum + count, 0) -
      rosterCapacity
  );

  // FLEX can allocate more starters to a position than the per-team roster
  // target planned for it, most often TE in shallow no-K/DST rooms. Keep every
  // starter inside the final roster line, then remove the lowest-ranked bench
  // slot elsewhere until the league-wide count fits the actual draft length.
  while (rosterExcess > 0) {
    const reducible = FANTASY_REPLACEMENT_POSITIONS
      .filter(
        (position) => rosterCounts[position] > starterRanks[position].length
      )
      .map((position) => {
        const candidates = rankedPlayers.filter(
          (entry) => entry.player.position === position
        );
        return {
          position,
          marginalRank:
            candidates[rosterCounts[position] - 1]?.rank ??
            Number.POSITIVE_INFINITY,
        };
      })
      .sort(
        (left, right) =>
          right.marginalRank - left.marginalRank ||
          left.position.localeCompare(right.position)
      );
    const position = reducible[0]?.position;
    if (!position) break;
    rosterCounts[position] -= 1;
    rosterExcess -= 1;
  }

  for (const position of FANTASY_REPLACEMENT_POSITIONS) {
    const starterAffectedByIncompleteFlex =
      flexRequired > 0 &&
      FLEX_POSITIONS.includes(position as (typeof FLEX_POSITIONS)[number]) &&
      !flexComplete;
    if (
      mandatoryComplete[position] &&
      !starterAffectedByIncompleteFlex &&
      starterRanks[position].length > 0
    ) {
      cutoffs[position].starter = Math.max(...starterRanks[position]);
    }

    const rostered = rosterCounts[position];
    if (rostered === 0) continue;
    const candidates = rankedPlayers.filter(
      (entry) => entry.player.position === position
    );
    if (candidates.length >= rostered) {
      cutoffs[position].roster = candidates[rostered - 1].rank;
    }
  }

  return cutoffs;
}

/**
 * Converts an ordinal rank into a bounded index above one replacement cutoff.
 * It is a rank-based comparison and is not a projected-points difference.
 */
export function calculateReplacementRelativeValue(
  rank: number,
  cutoff: number
): number {
  if (
    !isFinitePositiveReplacementValue(rank) ||
    !isFinitePositiveReplacementValue(cutoff)
  ) {
    return 0;
  }
  if (rank >= cutoff) return 0;
  if (cutoff <= 1) return rank <= 1 ? 100 : 0;

  return clamp((100 * Math.log(cutoff / rank)) / Math.log(cutoff), 0, 100);
}

/** Combines the starter and final-roster replacement readings at 75% and 25%. */
export function calculateFantasyReplacementSourceValue(
  rank: number,
  cutoff: FantasyReplacementCutoff
): FantasyReplacementSourceValue | null {
  const components: Array<{ weight: number; value: number }> = [];
  if (isFinitePositiveReplacementValue(cutoff.starter)) {
    components.push({
      weight: REPLACEMENT_STARTER_VALUE_WEIGHT,
      value: calculateReplacementRelativeValue(rank, cutoff.starter),
    });
  }
  if (isFinitePositiveReplacementValue(cutoff.roster)) {
    components.push({
      weight: REPLACEMENT_DEPTH_VALUE_WEIGHT,
      value: calculateReplacementRelativeValue(rank, cutoff.roster),
    });
  }
  if (components.length === 0) return null;

  const coverage = components.reduce(
    (sum, component) => sum + component.weight,
    0
  );
  return {
    value:
      components.reduce(
        (sum, component) => sum + component.value * component.weight,
        0
      ) / coverage,
    coverage,
  };
}

export function getFantasyReplacementMarketReliability(
  player: Player
): number | null {
  if (!hasReliableFantasyReplacementMarket(player)) return null;
  return clamp(10 / getAdpSignalThreshold(player), 0.25, 1);
}

export function blendFantasyReplacementValues(
  expertValue: number,
  marketValue: number | null,
  marketReliability: number | null
): number {
  if (marketValue === null || marketReliability === null) return expertValue;
  return (expertValue + marketValue * marketReliability) / (1 + marketReliability);
}
