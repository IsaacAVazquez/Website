import type { CSSProperties, ReactNode } from "react";

import { positionClass } from "./positionClass";
import type { SpreadRow, SpreadScale } from "./spreadScale";

/**
 * The tier break and the expert spread, shared by the draft rankings board and
 * the weekly board. Each page keeps its own row and its own area classes for
 * the head's layout, which it passes in.
 */

/** The labels of a scale, one over each of its divisions. They are a caption for the plots under them. */
export function SpreadScaleLabels({ scale, className }: { scale: SpreadScale; className: string }) {
  return (
    <span
      className={`ffb-h-rounds ${className}`}
      aria-hidden="true"
      style={{ "--ffb-rounds": scale.ticks.length } as CSSProperties}
    >
      {scale.ticks.map((tick) => (
        <span key={tick.at}>{tick.label}</span>
      ))}
    </span>
  );
}

/**
 * The kit's expert spread: a thin line from the best to the worst rank any
 * expert gave, a thicker segment one standard deviation each side of the
 * average, and an ink tick on the average. Every plot in a group shares
 * `scale`, so two rows can be compared by eye. The range rides in the
 * accessible name and the hover title, since the plot is its only print on the
 * row. The average is left out of that name, because the column beside the
 * plot prints it.
 */
export function ExpertSpread({
  player,
  avg,
  scale,
}: {
  player: SpreadRow;
  avg: number | null;
  scale: SpreadScale;
}) {
  const lo = player.minRank;
  const hi = player.maxRank;
  const guides = { "--ffb-rounds": scale.ticks.length } as CSSProperties;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return <span className="ffb-spread" aria-hidden="true" style={guides} />;
  }

  // A rank is a slot one wide: rank r runs from (r - min) to (r - min + 1) of the span, and its centre is half a slot in.
  const span = scale.max - scale.min + 1;
  const toPercent = (slots: number) => `${Math.min(100, Math.max(0, (slots / span) * 100)).toFixed(2)}%`;
  const centre = avg === null ? null : avg - scale.min + 0.5;
  const deviation =
    typeof player.standardDeviation === "number" && Number.isFinite(player.standardDeviation) && player.standardDeviation > 0
      ? player.standardDeviation
      : null;
  const label = `Expert rank range ${lo} to ${hi}`;

  return (
    <span
      className={`ffb-spread ${positionClass(player.position)}`.trimEnd()}
      role="img"
      aria-label={label}
      title={label}
      style={
        {
          ...guides,
          "--ffb-min": toPercent((lo as number) - scale.min),
          "--ffb-max": toPercent((hi as number) - scale.min + 1),
          ...(centre === null ? {} : { "--ffb-avg": toPercent(centre) }),
          ...(centre === null || deviation === null
            ? {}
            : {
                "--ffb-sd-lo": toPercent(centre - deviation),
                "--ffb-sd-hi": toPercent(centre + deviation),
              }),
        } as CSSProperties
      }
    >
      <i className="ffb-spread-range" />
      {centre !== null && deviation !== null ? <i className="ffb-spread-sd" /> : null}
      {centre !== null ? <i className="ffb-spread-avg" /> : null}
    </span>
  );
}

/**
 * One tier: the kit's break (a 2px ink rule with the tier's tab, its count,
 * its rank range, and the cliff above it) over the tier's rows. The count,
 * range, and cliff describe the whole tier, so a caller that has mounted only
 * part of one passes the tier's own figures rather than the visible rows'.
 */
export function TierSection({
  tier,
  count,
  firstRank,
  lastRank,
  cliff,
  first,
  leadClassName,
  scaleLabels,
  children,
}: {
  tier: number | null;
  count: number;
  firstRank: string;
  lastRank: string;
  /** How far the consensus average drops from the tier above, 0 for none. */
  cliff: number;
  /** The first tier on the board takes no gap above it. */
  first: boolean;
  /** The page's class for the head's left part, which holds the name and the cliff. */
  leadClassName: string;
  scaleLabels?: ReactNode;
  children: ReactNode;
}) {
  const countLabel = `${count} ${count === 1 ? "player" : "players"}`;
  // The gap above a break grows with the cliff, in 4px steps from 8 to 28px.
  const gap = Math.min(28, Math.max(8, Math.round((cliff * 6) / 4) * 4));

  /* A <section> with no accessible name is not exposed as a landmark at all, so an
     unnamed tier makes the tier structure of a tier-first board invisible to assistive
     tech. This is a literal label, not aria-labelledby, so it can also carry the cliff
     in words the heading abbreviates. */
  const tierLabel = [
    tier !== null ? `Tier ${tier}` : "No published tier",
    countLabel,
    `ranks ${firstRank} to ${lastRank}`,
    cliff > 0 ? `${cliff.toFixed(1)} average-rank cliff above` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section
      className="ffb-tier"
      aria-label={tierLabel}
      style={first ? undefined : ({ "--ffb-gap": `${gap}px` } as CSSProperties)}
    >
      <header className="ffb-tier-head">
        <div className={leadClassName}>
          <h3 className="ffb-tier-name">
            <span className="ffb-tier-tab">
              {tier !== null ? (
                <>
                  Tier <span>{String(tier).padStart(2, "0")}</span>
                </>
              ) : (
                "No tier"
              )}
            </span>{" "}
            <span className="ffb-tier-count">{countLabel}</span>{" "}
            <span className="ffb-tier-range">
              {firstRank === lastRank ? `Rank ${firstRank}` : `Ranks ${firstRank}–${lastRank}`}
            </span>
          </h3>
          {cliff > 0 && (
            <p className="ffb-tier-cliff">
              <span className="ffb-cliff-mark" aria-hidden="true" />
              <b>{cliff.toFixed(1)}</b> <span className="ffb-not-phone">avg-rank </span>cliff
            </p>
          )}
        </div>
        {scaleLabels}
      </header>
      <ol className="ffb-rows">{children}</ol>
    </section>
  );
}
