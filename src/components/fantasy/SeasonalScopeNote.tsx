import type { ReactNode } from "react";

/**
 * A dated note that appears on a draft-season surface once the regular season
 * is under way. Every board on /fantasy-football is a draft board, so from
 * Week 1 they describe a market that has stopped moving. Saying which season a
 * board covers, and that it is deliberately frozen, is the difference between
 * a boundary and a surface that looks broken.
 *
 * Render it only when the week is 1 or higher; the caller owns that check so
 * the season and week it prints are the ones it already resolved.
 */
export function SeasonalScopeNote({
  season,
  week,
  children,
}: {
  season: number;
  week: number;
  children: ReactNode;
}) {
  return (
    <div
      role="note"
      className="border text-sm"
      style={{
        paddingInline: "var(--c97-sp-2)",
        paddingBlock: "var(--c97-sp-1)",
        borderColor: "color-mix(in srgb, var(--c97-warning) 45%, var(--c97-rule))",
        background: "color-mix(in srgb, var(--c97-warning) 8%, var(--c97-surface))",
      }}
    >
      <p className="text-[var(--c97-ink-2)]">
        <span className="font-semibold text-[var(--c97-ink)]">
          Week {week} of the {season} season.
        </span>{" "}
        {children}
      </p>
    </div>
  );
}
