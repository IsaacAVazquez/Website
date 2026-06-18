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
