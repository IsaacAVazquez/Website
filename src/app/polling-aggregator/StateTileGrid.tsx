"use client";

import type { Race } from "@/types/polling";
import { raceTiles, tileTone } from "./state-tiles";
import { DEM_COLOR, REP_COLOR } from "./polling-aggregator-helpers";
import "./polling-aggregator.css";

interface StateTileGridProps {
  races: Race[];
}

/*
 * Tile text is the page ink, so the fill stops at 75%. At 90% neither ink
 * clears 4.5:1 on party blue or red in light mode (4.19 and 4.00 measured);
 * at 75% the theme's own ink does in both themes.
 */
const MAX_TILE_STRENGTH = 0.75;

function tileFill(rating: Race["rating"]): string {
  const tone = tileTone(rating);
  const pct = Math.round(Math.min(tone.strength, MAX_TILE_STRENGTH) * 100);
  if (!tone.party) return `color-mix(in srgb, var(--c97-ink-2) ${pct}%, transparent)`;
  const base = tone.party === "D" ? DEM_COLOR : REP_COLOR;
  return `color-mix(in srgb, ${base} ${pct}%, transparent)`;
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
