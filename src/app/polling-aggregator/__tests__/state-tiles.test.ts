import { STATE_TILES, raceTiles, tileTone } from "../state-tiles";
import type { Race } from "@/types/polling";

const STATE_ABBRS = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const race = (stateAbbr: string, rating: Race["rating"]) =>
  ({ id: stateAbbr, state: stateAbbr, stateAbbr, rating }) as unknown as Race;

describe("STATE_TILES", () => {
  it("places all 50 states plus DC", () => {
    for (const abbr of [...STATE_ABBRS, "DC"]) {
      expect(STATE_TILES[abbr]).toBeDefined();
    }
    expect(Object.keys(STATE_TILES)).toHaveLength(51);
  });

  it("gives every state its own cell", () => {
    const seen = new Set<string>();
    for (const { col, row } of Object.values(STATE_TILES)) {
      const key = `${col},${row}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("fits the 11-column, 8-row grid", () => {
    for (const { col, row } of Object.values(STATE_TILES)) {
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(11);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(8);
    }
  });
});

describe("raceTiles", () => {
  it("returns a tile only for races on the grid", () => {
    const tiles = raceTiles([race("TX", "Safe R"), race("CA", "Safe D")]);
    expect(tiles).toEqual([
      { abbr: "TX", col: STATE_TILES.TX.col, row: STATE_TILES.TX.row, race: expect.objectContaining({ stateAbbr: "TX" }) },
      { abbr: "CA", col: STATE_TILES.CA.col, row: STATE_TILES.CA.row, race: expect.objectContaining({ stateAbbr: "CA" }) },
    ]);
  });

  it("drops an abbreviation that isn't on the grid", () => {
    expect(raceTiles([race("ZZ", "Toss-up")])).toEqual([]);
  });

  it("returns nothing for an empty snapshot", () => {
    expect(raceTiles([])).toEqual([]);
  });
});

describe("tileTone", () => {
  it("reads stronger for Safe than Lean, on the same party", () => {
    expect(tileTone("Safe D").strength).toBeGreaterThan(tileTone("Lean D").strength);
    expect(tileTone("Safe R").strength).toBeGreaterThan(tileTone("Lean R").strength);
  });

  it("has no party lean for a toss-up", () => {
    expect(tileTone("Toss-up").party).toBeNull();
  });

  it("reads the party from the rating", () => {
    expect(tileTone("Likely D").party).toBe("D");
    expect(tileTone("Likely R").party).toBe("R");
  });
});
