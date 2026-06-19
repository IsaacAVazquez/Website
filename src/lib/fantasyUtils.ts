import type { CSSProperties } from "react";

import type { FantasySnapshotSliceMetadata } from "@/lib/fantasy";
import type { Player } from "@/types";

/**
 * Plain-language explanation of the "Avg" value shown next to each player.
 * Shared by the rankings board and the draft tracker so both surfaces tell the
 * same story. The number is FantasyPros' `rank_ave` — the mean of every
 * expert's individual ranking, distinct from the consensus rank in the
 * headline.
 */
export const FANTASY_AVG_RANK_TOOLTIP =
  "The average of every expert's rank for this player. FantasyPros polls dozens of analysts, and this is the mean of their individual rankings. Lower is better, so 1.00 would mean every expert ranked the player first.";

export function formatUpdatedAt(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export type FantasySnapshotStaleness = "fresh" | "aging" | "stale";

const FANTASY_STALENESS_AGING_DAYS = 8;
const FANTASY_STALENESS_STALE_DAYS = 14;
const MS_PER_DAY = 86_400_000;

/**
 * Buckets a snapshot timestamp into a freshness band that downstream UI can
 * use to surface a soft warning. The thresholds match the weekly Wednesday
 * refresh cadence: anything <8 days is on schedule, 8–14 days is suspicious,
 * and >14 days means the automated refresh has missed at least two cycles.
 *
 * Returns "stale" for any invalid or missing date so callers default to the
 * conservative warning rather than silently treating it as fresh.
 */
export function getSnapshotStaleness(date: Date | string | null | undefined): FantasySnapshotStaleness {
  if (date === null || date === undefined) {
    return "stale";
  }

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "stale";
  }

  const ageDays = (Date.now() - parsed.getTime()) / MS_PER_DAY;
  if (ageDays < FANTASY_STALENESS_AGING_DAYS) {
    return "fresh";
  }
  if (ageDays <= FANTASY_STALENESS_STALE_DAYS) {
    return "aging";
  }
  return "stale";
}

/**
 * Short, human label for a staleness band. Kept beside getSnapshotStaleness so
 * the wording and the thresholds evolve together. Used by freshness chips that
 * annotate the "Source updated" and "Snapshot built" dates.
 */
export function getSnapshotStalenessLabel(staleness: FantasySnapshotStaleness): string {
  switch (staleness) {
    case "fresh":
      return "Current";
    case "aging":
      return "Aging";
    case "stale":
      return "Stale";
  }
}

export function formatRankValue(value: number | string | undefined): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  return value?.trim() ? value : "--";
}

export function formatRange(player: Player): string {
  if (player.minRank === undefined || player.maxRank === undefined) {
    return "--";
  }

  return `${formatRankValue(player.minRank)} to ${formatRankValue(player.maxRank)}`;
}

export function formatOwnership(ownership: number | undefined): string {
  if (!Number.isFinite(ownership)) {
    return "Not listed";
  }

  return `${ownership?.toFixed(1)}%`;
}

/**
 * Plain-language explanation of the ADP value shown on the rankings board.
 * ADP comes from a different upstream than the consensus ranks, so the copy
 * names the distinction: experts versus actual drafters.
 */
export const FANTASY_ADP_TOOLTIP =
  "Average draft position from recent 12-team mock drafts on Fantasy Football Calculator. It shows where real drafters take this player, while the consensus rank shows where experts say he should go. A big gap between the two is a value or reach signal.";

export function formatAdp(adp: number | undefined): string {
  if (!Number.isFinite(adp)) {
    return "--";
  }

  return adp!.toFixed(1);
}

/**
 * How far consensus rank and market ADP must disagree before the board flags
 * it. Ten spots is roughly a full round in a 10-team league — enough that the
 * gap is a real signal rather than ordinary week-to-week noise.
 */
export const ADP_SIGNAL_THRESHOLD = 10;

/**
 * Compares a player's consensus rank to where drafters actually take him.
 * Positive delta means the market drafts him later than the experts rank him
 * (a value), negative means earlier (a reach). Returns null when the player
 * has no ADP reading or no usable rank.
 */
export function getValueVsAdp(
  player: Player
): { delta: number; signal: "value" | "reach" | null } | null {
  const rank =
    typeof player.rankEcr === "number" && Number.isFinite(player.rankEcr)
      ? player.rankEcr
      : typeof player.averageRank === "number" && Number.isFinite(player.averageRank)
        ? player.averageRank
        : null;

  if (rank === null || !Number.isFinite(player.adp)) {
    return null;
  }

  const delta = Math.round((player.adp as number) - rank);
  const signal = delta >= ADP_SIGNAL_THRESHOLD ? "value" : delta <= -ADP_SIGNAL_THRESHOLD ? "reach" : null;

  return { delta, signal };
}

/**
 * Hover copy for the green "Value" chip. Explains the ADP-vs-consensus gap in
 * plain language so a drafter does not have to infer what the chip means. Kept
 * in sync with the "Value" entry in FANTASY_BOARD_LEGEND below.
 */
export const FANTASY_VALUE_TOOLTIP =
  "Value means drafters take this player later than the experts rank him, so you can often get him at a discount. The number is how many draft slots later than his consensus rank he goes on average.";

/** Hover copy for the amber "Reach" chip, the mirror of FANTASY_VALUE_TOOLTIP. */
export const FANTASY_REACH_TOOLTIP =
  "Reach means drafters take this player earlier than the experts rank him, so picking him here likely passes up better value. The number is how many draft slots earlier than his consensus rank he goes on average.";

export interface FantasyLegendEntry {
  /** Short label, matching the wording that appears on the board itself. */
  term: string;
  /** Plain-language definition. One or two flowing sentences, never a listicle. */
  definition: string;
  /** When set, the legend renders the matching colored board chip beside the term. */
  tone?: "value" | "reach";
}

/**
 * The full key for reading the rankings board, surfaced through the collapsible
 * "How to read this board" panel. Reuses the same tooltip strings the inline
 * hovers use so the panel and the per-row hovers never drift apart.
 */
export const FANTASY_BOARD_LEGEND: FantasyLegendEntry[] = [
  {
    term: "Published rank",
    definition:
      "The number on the left of each row. It is the FantasyPros expert consensus rank for the board you are viewing, whether that is overall, a single position, or flex.",
  },
  {
    term: "Expert range",
    definition:
      "The highest and lowest rank the experts gave this player. A wide range means the analysts disagree about where he belongs.",
  },
  {
    term: "Avg",
    definition: FANTASY_AVG_RANK_TOOLTIP,
  },
  {
    term: "ADP",
    definition: FANTASY_ADP_TOOLTIP,
  },
  {
    term: "Value",
    tone: "value",
    definition: FANTASY_VALUE_TOOLTIP,
  },
  {
    term: "Reach",
    tone: "reach",
    definition: FANTASY_REACH_TOOLTIP,
  },
  {
    term: "Tiers",
    definition:
      "FantasyPros groups players of roughly interchangeable value into tiers. The drop between one tier and the next is where waiting gets expensive, so it is often smarter to draft across a tier break than to reach within one.",
  },
  {
    term: "Rostered",
    definition:
      "The share of leagues where this player is already on a roster. A low number on a well-ranked player can flag a sleeper others have not grabbed yet.",
  },
  {
    term: "Freshness",
    definition:
      "The Current, Aging, and Stale chips show how recently the source consensus and this site's snapshot were refreshed, so you can judge how current the board is.",
  },
];

export type FantasyAdpFreshness = "current" | "prior-season";

/**
 * Mock-draft ADP for the upcoming season does not populate until late summer,
 * so through the spring the upstream feed still serves the previous season's
 * final board. That carryover lands with an as-of date in a calendar year
 * before the snapshot season, which the board should label as preseason
 * carryover rather than letting an honest gap look like a broken refresh.
 *
 * Returns "current" whenever there is nothing to flag (no as-of date, no
 * season, or an unparseable date) so callers never show a false warning.
 */
export function getFantasyAdpFreshness(
  asOf: string | null | undefined,
  season: number | null | undefined,
): FantasyAdpFreshness {
  if (!asOf || typeof season !== "number" || !Number.isFinite(season)) {
    return "current";
  }

  const parsed = new Date(asOf);
  if (Number.isNaN(parsed.getTime())) {
    return "current";
  }

  return parsed.getUTCFullYear() < season ? "prior-season" : "current";
}

/**
 * Natural-height label chip shared across fantasy surfaces (matches the /nfl
 * badge recipe). Interactive pills keep min-h-[44px] separately for touch targets.
 */
export const FANTASY_CHIP_CLASS =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]";

export function getPositionTone(position: string): CSSProperties {
  switch (position) {
    case "QB":
      return {
        background: "color-mix(in srgb, var(--home-haze) 14%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-haze) 28%, var(--home-rule))",
      };
    case "RB":
      return {
        background: "color-mix(in srgb, var(--color-success) 14%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--color-success) 24%, var(--home-rule))",
      };
    case "WR":
      return {
        background: "color-mix(in srgb, var(--home-acid) 26%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-acid) 34%, var(--home-rule))",
      };
    case "TE":
      return {
        background: "color-mix(in srgb, var(--color-warning) 18%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--color-warning) 26%, var(--home-rule))",
      };
    case "K":
      return {
        background: "color-mix(in srgb, var(--home-moss) 22%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-moss) 32%, var(--home-rule))",
      };
    case "DST":
      return {
        background: "color-mix(in srgb, var(--home-stone) 50%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-stone) 58%, var(--home-rule))",
      };
    default:
      return {
        background: "color-mix(in srgb, var(--home-paper-alt) 90%, var(--home-elev-mix))",
        borderColor: "var(--home-rule)",
      };
  }
}

export function getSourceKindLabel(
  sourceKind: FantasySnapshotSliceMetadata["sourceKind"] | undefined,
): string {
  switch (sourceKind) {
    case "overall_consensus":
      return "Overall consensus";
    case "position_consensus":
      return "Position consensus";
    case "shared_position_consensus":
      return "Shared consensus";
    case "derived_flex":
      return "Derived flex board";
    default:
      return "Unavailable";
  }
}

export type FantasyConsensusSpread = "tight" | "mixed" | "volatile";

/**
 * Expert disagreement (`standardDeviation`) naturally grows with rank — the
 * top of the board is settled, the deep pool is noisy — so a flat threshold
 * would mislabel almost every late pick as "volatile". Normalizing the spread
 * against the player's own rank (with a floor that tames the very top) yields a
 * scale-aware read on how much the experts actually agree. Thresholds were
 * tuned against the live PPR board so the labels split roughly 55/40/6.
 *
 * Returns null when there is no usable rank or spread to judge.
 */
const CONSENSUS_SPREAD_FLOOR = 12;
const CONSENSUS_SPREAD_MIXED = 0.12;
const CONSENSUS_SPREAD_VOLATILE = 0.22;

export function getConsensusSpread(
  player: Player,
): { level: FantasyConsensusSpread; label: string; ratio: number } | null {
  const rank =
    typeof player.rankEcr === "number" && Number.isFinite(player.rankEcr)
      ? player.rankEcr
      : typeof player.averageRank === "number" && Number.isFinite(player.averageRank)
        ? player.averageRank
        : null;

  if (rank === null || !Number.isFinite(player.standardDeviation)) {
    return null;
  }

  const ratio = player.standardDeviation / (rank + CONSENSUS_SPREAD_FLOOR);
  if (ratio < CONSENSUS_SPREAD_MIXED) {
    return { level: "tight", label: "Tight consensus", ratio };
  }
  if (ratio < CONSENSUS_SPREAD_VOLATILE) {
    return { level: "mixed", label: "Mixed reads", ratio };
  }
  return { level: "volatile", label: "Volatile", ratio };
}

/**
 * One ordered list row paired with whether it opens a new tier. The board
 * renders a labeled separator above any row where `startsTier` is true (the
 * caller decides whether to suppress the very first one). Players without a
 * tier never start a break, so an untiered tail flows together.
 */
export interface FantasyTierRow {
  player: Player;
  tier: number | null;
  startsTier: boolean;
}

export function withTierBreaks(players: Player[]): FantasyTierRow[] {
  let previousTier: number | null = null;
  return players.map((player) => {
    const tier = typeof player.tier === "number" && Number.isFinite(player.tier) ? player.tier : null;
    const startsTier = tier !== null && tier !== previousTier;
    if (tier !== null) {
      previousTier = tier;
    }
    return { player, tier, startsTier };
  });
}

/**
 * The "cliff" between two tiers: how many ranks drop between the last player of
 * one tier and the first of the next. A large gap is the classic signal to
 * reach for the tail of the current tier before it empties. Returns 0 when the
 * inputs don't describe a real downward step.
 */
export function getTierGap(
  lastRankInTier: number | undefined,
  firstRankInNextTier: number | undefined,
): number {
  if (!Number.isFinite(lastRankInTier) || !Number.isFinite(firstRankInNextTier)) {
    return 0;
  }
  const gap = Math.round((firstRankInNextTier as number) - (lastRankInTier as number));
  return gap > 0 ? gap : 0;
}
