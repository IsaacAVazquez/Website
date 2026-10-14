import type { ReactNode } from "react";

/**
 * A dated note that appears on a draft-season surface once the regular season
 * is under way. Every board on /fantasy-football is a draft board, so from
 * Week 1 they describe a market that has stopped moving. Saying which season a
 * board covers, and that it is deliberately frozen, is the difference between
 * a boundary and a surface that looks broken.
 *
 * It is the kit's notice in the warning tone: text with a key rule at its left
 * edge, no border and no fill.
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
    <div role="note" className="ffb-notice ffb-notice-warn">
      <p>
        <span className="ffb-notice-title">
          Week {week} of the {season} season.
        </span>{" "}
        {children}
      </p>
    </div>
  );
}
