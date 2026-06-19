"use client";

import { formatRankValue, getConsensusSpread } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

interface RankDistributionBarProps {
  player: Player;
  /** Optional shared scale so several bars line up (used by the compare modal). */
  scaleMin?: number;
  scaleMax?: number;
  /** Hide the best/avg/worst tick labels for a compact inline variant. */
  compact?: boolean;
}

const SPREAD_FILL: Record<string, string> = {
  tight: "color-mix(in srgb, var(--color-success) 34%, var(--home-paper))",
  mixed: "color-mix(in srgb, var(--home-acid) 46%, var(--home-paper))",
  volatile: "color-mix(in srgb, var(--color-warning) 38%, var(--home-paper))",
};

/**
 * Visualizes how widely the experts disagree about a player by plotting his
 * best→worst rank span as a filled track with the consensus average marked.
 * A wide fill = lots of disagreement; the fill color encodes the same
 * `standardDeviation`-derived consensus-spread bucket shown elsewhere. This is
 * the headline use of the otherwise-unsurfaced `standardDeviation` field.
 */
export function RankDistributionBar({ player, scaleMin, scaleMax, compact = false }: RankDistributionBarProps) {
  const min = player.minRank;
  const max = player.maxRank;
  const avg =
    typeof player.averageRank === "number" && Number.isFinite(player.averageRank)
      ? player.averageRank
      : typeof player.rankEcr === "number" && Number.isFinite(player.rankEcr)
        ? player.rankEcr
        : undefined;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return (
      <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
        Expert range unavailable for this board.
      </p>
    );
  }

  const lo = scaleMin ?? (min as number);
  const hi = scaleMax ?? (max as number);
  const span = hi - lo || 1;
  const pct = (value: number) => Math.max(0, Math.min(100, ((value - lo) / span) * 100));

  const left = pct(min as number);
  const right = pct(max as number);
  const spread = getConsensusSpread(player);
  const fill = SPREAD_FILL[spread?.level ?? "mixed"] ?? SPREAD_FILL.mixed;

  return (
    <div className="w-full">
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "color-mix(in srgb, var(--home-ink) 8%, var(--home-paper))" }}
        role="img"
        aria-label={`Expert rank range ${formatRankValue(min)} to ${formatRankValue(max)}${
          avg !== undefined ? `, average ${formatRankValue(avg)}` : ""
        }`}
      >
        <span
          className="absolute inset-y-0 rounded-full"
          style={{ left: `${left}%`, width: `${Math.max(right - left, 2)}%`, background: fill }}
        />
        {avg !== undefined && (
          <span
            className="absolute inset-y-0 w-[2px] rounded-full"
            style={{ left: `calc(${pct(avg)}% - 1px)`, background: "var(--home-ink)" }}
          />
        )}
      </div>
      {!compact && (
        <div
          className="mt-1 flex items-center justify-between text-2xs font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--home-ink-muted)" }}
        >
          <span>Best {formatRankValue(min)}</span>
          {avg !== undefined && <span style={{ color: "var(--home-ink)" }}>Avg {formatRankValue(avg)}</span>}
          <span>Worst {formatRankValue(max)}</span>
        </div>
      )}
    </div>
  );
}
