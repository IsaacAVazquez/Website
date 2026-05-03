import type { CSSProperties } from "react";

import type { FantasySnapshotSliceMetadata } from "@/lib/fantasy";
import type { Player } from "@/types";

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

  return `${ownership?.toFixed(1)}% rostered`;
}

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
    case "derived_overall":
      return "Derived overall board";
    default:
      return "Unavailable";
  }
}
