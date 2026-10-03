"use client";

import type { Race } from "@/types/polling";
import { raceTiles } from "./state-tiles";
import { getRatingBg, getRatingTextColor } from "./polling-aggregator-helpers";
import "./polling-aggregator.css";

interface StateTileGridProps {
  races: Race[];
}

/**
 * A fixed-position cartogram of the states with a tracked race, one square
 * tile per state, filled in the same rating colour as the race pills. The
 * grid only draws the races the snapshot actually has, so it stays empty
 * rather than guessing at a state with no rating yet.
 */
export function StateTileGrid({ races }: StateTileGridProps) {
  const tiles = raceTiles(races);
  if (tiles.length === 0) return null;

  return (
    <div
      className="c97-state-tile-grid"
      role="img"
      aria-label={`${tiles.length} tracked ${tiles.length === 1 ? "race" : "races"} by state and rating`}
    >
      {tiles.map((tile) => (
        <div
          key={tile.abbr}
          className="c97-state-tile"
          style={{ gridColumn: tile.col + 1, gridRow: tile.row + 1, background: getRatingBg(tile.race.rating), color: getRatingTextColor(tile.race.rating) }}
          title={`${tile.race.state}: ${tile.race.rating}`}
        >
          <span className="c97-state-tile-abbr">{tile.abbr}</span>
          <span className="c97-state-tile-rating">{tile.race.rating}</span>
        </div>
      ))}
    </div>
  );
}
