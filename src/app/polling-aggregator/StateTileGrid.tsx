"use client";

import type { Race } from "@/types/polling";
import { raceTiles, tileTone } from "./state-tiles";
import { DEM_COLOR, REP_COLOR } from "./polling-aggregator-helpers";
import "./polling-aggregator.css";

interface StateTileGridProps {
  races: Race[];
}

function tileFill(rating: Race["rating"]): string {
  const tone = tileTone(rating);
  if (!tone.party) return `color-mix(in srgb, var(--c97-ink-2) ${Math.round(tone.strength * 100)}%, transparent)`;
  const base = tone.party === "D" ? DEM_COLOR : REP_COLOR;
  return `color-mix(in srgb, ${base} ${Math.round(tone.strength * 100)}%, transparent)`;
}

/**
 * A fixed-position cartogram of the states with a tracked race, one square
 * tile per state, filled in its rating's party colour at the strength the
 * rating implies. The grid only draws the races the snapshot actually has,
 * so it stays empty rather than guessing at a state with no rating yet.
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
          style={{ gridColumn: tile.col + 1, gridRow: tile.row + 1, background: tileFill(tile.race.rating) }}
          title={`${tile.race.state}: ${tile.race.rating}`}
        >
          <span className="c97-state-tile-abbr">{tile.abbr}</span>
          <span className="c97-state-tile-rating">{tile.race.rating}</span>
        </div>
      ))}
    </div>
  );
}
