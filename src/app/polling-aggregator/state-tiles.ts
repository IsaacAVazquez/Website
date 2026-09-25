import type { Party, Race, RaceRating } from "@/types/polling";

export interface StateTilePosition {
  col: number;
  row: number;
}

export interface RaceTile {
  abbr: string;
  col: number;
  row: number;
  race: Race;
}

/**
 * A square, non-overlapping tile cartogram of the 50 states plus DC on an
 * 11-column, 8-row grid (col 0 to 10, row 0 to 7), arranged so each state
 * sits roughly where it does on a map. Every real state's `stateAbbr` maps
 * here, since a race for a state that isn't on the grid gets dropped rather
 * than mis-plotted.
 */
export const STATE_TILES: Readonly<Record<string, StateTilePosition>> = {
  AK: { col: 0, row: 0 },
  ME: { col: 10, row: 0 },

  WA: { col: 1, row: 1 },
  ID: { col: 2, row: 1 },
  MT: { col: 3, row: 1 },
  ND: { col: 4, row: 1 },
  MN: { col: 5, row: 1 },
  WI: { col: 6, row: 1 },
  MI: { col: 7, row: 1 },
  NY: { col: 8, row: 1 },
  VT: { col: 9, row: 1 },
  NH: { col: 10, row: 1 },

  OR: { col: 1, row: 2 },
  NV: { col: 2, row: 2 },
  WY: { col: 3, row: 2 },
  SD: { col: 4, row: 2 },
  IA: { col: 5, row: 2 },
  IL: { col: 6, row: 2 },
  IN: { col: 7, row: 2 },
  OH: { col: 8, row: 2 },
  PA: { col: 9, row: 2 },
  MA: { col: 10, row: 2 },

  CA: { col: 0, row: 3 },
  UT: { col: 2, row: 3 },
  CO: { col: 3, row: 3 },
  NE: { col: 4, row: 3 },
  MO: { col: 5, row: 3 },
  KY: { col: 6, row: 3 },
  WV: { col: 7, row: 3 },
  VA: { col: 8, row: 3 },
  MD: { col: 9, row: 3 },
  RI: { col: 10, row: 3 },

  AZ: { col: 2, row: 4 },
  NM: { col: 3, row: 4 },
  KS: { col: 4, row: 4 },
  AR: { col: 5, row: 4 },
  TN: { col: 6, row: 4 },
  NC: { col: 7, row: 4 },
  SC: { col: 8, row: 4 },
  DE: { col: 9, row: 4 },
  CT: { col: 10, row: 4 },

  OK: { col: 4, row: 5 },
  LA: { col: 5, row: 5 },
  MS: { col: 6, row: 5 },
  AL: { col: 7, row: 5 },
  GA: { col: 8, row: 5 },
  NJ: { col: 9, row: 5 },

  HI: { col: 0, row: 6 },
  TX: { col: 3, row: 6 },
  FL: { col: 9, row: 6 },

  DC: { col: 9, row: 7 },
};

/** Only the races whose `stateAbbr` is on the grid, at their fixed tile. */
export function raceTiles(races: Race[]): RaceTile[] {
  const tiles: RaceTile[] = [];
  for (const race of races) {
    const position = STATE_TILES[race.stateAbbr];
    if (!position) continue;
    tiles.push({ abbr: race.stateAbbr, col: position.col, row: position.row, race });
  }
  return tiles;
}

export interface TileTone {
  /** null for a toss-up, which leans neither party. */
  party: Party | null;
  /** 0 to 1. How strongly the tile should read in its party's colour. */
  strength: number;
}

const STRENGTH_BY_PREFIX: Record<string, number> = {
  Safe: 0.9,
  Likely: 0.65,
  Lean: 0.4,
};

/** How strongly a rating leans, and toward which party, for the tile fill. */
export function tileTone(rating: RaceRating): TileTone {
  if (rating === "Toss-up") return { party: null, strength: 0.25 };
  const [prefix, party] = rating.split(" ") as [string, Party];
  return { party, strength: STRENGTH_BY_PREFIX[prefix] ?? 0.4 };
}
