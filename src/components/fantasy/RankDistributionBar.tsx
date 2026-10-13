"use client";

import type { CSSProperties } from "react";

import { formatRankValue } from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import "./fantasy-overlays.css";
import { positionClass } from "./positionClass";
import { fitSpreadScale, type SpreadScale } from "./spreadScale";

interface RankDistributionBarProps {
  player: Player;
  /** Optional shared scale so several bars line up (used by the compare modal). */
  scaleMin?: number;
  scaleMax?: number;
  /**
   * A rank axis with labelled divisions. A rank is a slot one wide on it, so
   * the range runs from the left of the best rank to the right of the worst,
   * and a guide with its label marks the start of each division. Without one,
   * and off the compare modal's shared scale, the plot fits its own in rounds
   * of a 12-team draft.
   */
  scale?: SpreadScale;
  /** Hide the best/avg/worst tick labels for a compact inline variant. */
  compact?: boolean;
  /** Leave out the Best, Avg, Worst line, for a caller that prints those numbers elsewhere. */
  showEnds?: boolean;
}

/** A drawer's plot is about 330px wide on a phone, and past this many labels they would touch. */
const MAX_LABELS = 12;

const percent = (fraction: number) => `${(Math.max(0, Math.min(1, fraction)) * 100).toFixed(2)}%`;

/**
 * How widely the experts disagree about a player, drawn as the kit's spread
 * plot: a thin line from the best to the worst rank, one standard deviation
 * each side of the expert mean as the thicker segment, and the mean as an ink
 * tick. The plot sits on a rank axis in rounds, so a player the experts agree
 * on draws a short mark and a volatile one a long line. The compare modal
 * passes one shared scale instead, with guides at the quarters.
 */
export function RankDistributionBar({
  player,
  scaleMin,
  scaleMax,
  scale,
  compact = false,
  showEnds = true,
}: RankDistributionBarProps) {
  const min = player.minRank;
  const max = player.maxRank;
  const avg =
    typeof player.rankAverage === "number" && Number.isFinite(player.rankAverage)
      ? player.rankAverage
      : undefined;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return <p className="ffb-plot-none">Expert range unavailable for this board.</p>;
  }

  const best = min as number;
  const worst = max as number;
  const deviation =
    avg !== undefined && typeof player.standardDeviation === "number" && player.standardDeviation > 0
      ? player.standardDeviation
      : undefined;
  const shared = scaleMin !== undefined || scaleMax !== undefined;
  // Without a scale of its own the plot fits whole rounds of 12 around the range, with a round of room each side.
  const axis = scale ?? (shared ? null : fitSpreadScale(best, worst, { pad: 1 }));
  // The guides and labels thin to every other tick where a full set would crowd the drawer.
  const ticks = axis ? axis.ticks.filter((_, index) => axis.ticks.length <= MAX_LABELS || index % 2 === 0) : [];

  // Where a rank's left edge, its right edge, and the middle of a value fall.
  let left: (rank: number) => string;
  let right: (rank: number) => string;
  let middle: (value: number) => string;
  if (axis) {
    const slots = axis.max - axis.min + 1;
    left = (rank) => percent((rank - axis.min) / slots);
    right = (rank) => percent((rank - axis.min + 1) / slots);
    middle = (value) => percent((value - axis.min + 0.5) / slots);
  } else {
    const rawLo = scaleMin ?? best;
    const rawHi = scaleMax ?? worst;
    // A scale with no width (every expert agrees) gets a rank of room each side, so the mark sits mid-plot.
    const lo = rawHi > rawLo ? rawLo : rawLo - 1;
    const hi = rawHi > rawLo ? rawHi : rawHi + 1;
    left = right = middle = (value) => percent((value - lo) / (hi - lo));
  }

  return (
    <div className={`ffb-plot${compact ? " ffb-plot-compact" : ""}${axis ? " ffb-ov-axis" : ""}`}>
      {axis && !compact && (
        <div className="ffb-ov-axis-labels ffb-label ffb-muted" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick.at} style={{ "--ffb-ov-at": left(tick.at) } as CSSProperties}>
              {tick.label}
            </span>
          ))}
        </div>
      )}
      <span
        className={`ffb-spread ${positionClass(player.position)}`}
        role="img"
        aria-label={`Expert rank range ${formatRankValue(min)} to ${formatRankValue(max)}${
          avg !== undefined ? `, average ${formatRankValue(avg)}` : ""
        }`}
        style={
          {
            "--ffb-rounds": 4,
            "--ffb-min": left(best),
            "--ffb-max": right(worst),
            ...(avg !== undefined ? { "--ffb-avg": middle(avg) } : null),
            ...(avg !== undefined && deviation !== undefined
              ? { "--ffb-sd-lo": middle(avg - deviation), "--ffb-sd-hi": middle(avg + deviation) }
              : null),
          } as CSSProperties
        }
      >
        {ticks.map((tick) => (
          <i key={tick.at} className="ffb-ov-axis-guide" style={{ "--ffb-ov-at": left(tick.at) } as CSSProperties} />
        ))}
        <i className="ffb-spread-range" />
        {deviation !== undefined && <i className="ffb-spread-sd" />}
        {avg !== undefined && <i className="ffb-spread-avg" />}
      </span>
      {!compact && showEnds && (
        <p className="ffb-plot-ends">
          <span>Best {formatRankValue(min)}</span>{" "}
          {avg !== undefined && (
            <>
              <span className="ffb-is-avg">Avg {formatRankValue(avg)}</span>{" "}
            </>
          )}
          <span>Worst {formatRankValue(max)}</span>
        </p>
      )}
    </div>
  );
}
