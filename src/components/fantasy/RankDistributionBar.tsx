"use client";

import type { CSSProperties } from "react";

import { formatRankValue } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import "./fantasy-overlays.css";
import { positionClass } from "./positionClass";

interface RankDistributionBarProps {
  player: Player;
  /** Optional shared scale so several bars line up (used by the compare modal). */
  scaleMin?: number;
  scaleMax?: number;
  /** Hide the best/avg/worst tick labels for a compact inline variant. */
  compact?: boolean;
}

/**
 * How widely the experts disagree about a player, drawn as the kit's spread
 * plot: a thin line from his best to his worst rank, one standard deviation
 * each side of the expert mean as the thicker segment, and the mean as an ink
 * tick. Without a shared scale the line runs edge to edge and the segment
 * shows where the middle of the experts sits inside it. With one (the compare
 * modal) the plots share guides at the quarters, so a longer line means more
 * disagreement.
 */
export function RankDistributionBar({ player, scaleMin, scaleMax, compact = false }: RankDistributionBarProps) {
  const min = player.minRank;
  const max = player.maxRank;
  const avg =
    typeof player.rankAverage === "number" && Number.isFinite(player.rankAverage)
      ? player.rankAverage
      : undefined;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return <p className="ffb-ov-spread-none">Expert range unavailable for this board.</p>;
  }

  const rawLo = scaleMin ?? (min as number);
  const rawHi = scaleMax ?? (max as number);
  // A scale with no width (every expert agrees) gets a rank of room each side, so the mark sits mid-plot.
  const lo = rawHi > rawLo ? rawLo : rawLo - 1;
  const hi = rawHi > rawLo ? rawHi : rawHi + 1;
  const pct = (value: number) => `${Math.max(0, Math.min(100, ((value - lo) / (hi - lo)) * 100)).toFixed(2)}%`;
  const deviation =
    avg !== undefined && typeof player.standardDeviation === "number" && player.standardDeviation > 0
      ? player.standardDeviation
      : undefined;
  const shared = scaleMin !== undefined || scaleMax !== undefined;

  return (
    <div className={compact ? "ffb-ov-spread ffb-ov-spread-compact" : "ffb-ov-spread"}>
      <span
        className={`ffb-spread ${positionClass(player.position)}`}
        role="img"
        aria-label={`Expert rank range ${formatRankValue(min)} to ${formatRankValue(max)}${
          avg !== undefined ? `, average ${formatRankValue(avg)}` : ""
        }`}
        style={
          {
            "--ffb-rounds": shared ? 4 : 1,
            "--ffb-min": pct(min as number),
            "--ffb-max": pct(max as number),
            ...(avg !== undefined ? { "--ffb-avg": pct(avg) } : null),
            ...(avg !== undefined && deviation !== undefined
              ? { "--ffb-sd-lo": pct(avg - deviation), "--ffb-sd-hi": pct(avg + deviation) }
              : null),
          } as CSSProperties
        }
      >
        <i className="ffb-spread-range" />
        {deviation !== undefined && <i className="ffb-spread-sd" />}
        {avg !== undefined && <i className="ffb-spread-avg" />}
      </span>
      {!compact && (
        <p className="ffb-ov-spread-ends">
          <span>Best {formatRankValue(min)}</span>
          {avg !== undefined && <span className="ffb-ov-spread-avg">Avg {formatRankValue(avg)}</span>}
          <span>Worst {formatRankValue(max)}</span>
        </p>
      )}
    </div>
  );
}
