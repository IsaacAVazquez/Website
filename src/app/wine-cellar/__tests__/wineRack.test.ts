import { WINE_TYPES } from "@/lib/wineCellar";
import type { WineEntry } from "@/types/wine";
import { WINE_TYPE_MARK, wineRack } from "../wineRack";

function entry(overrides: Partial<WineEntry>): WineEntry {
  return {
    id: "wine-1",
    name: "Test",
    producer: "",
    vintage: null,
    region: "",
    varietal: "",
    type: "red",
    price: null,
    rating: 4,
    notes: "",
    tastedOn: "2026-01-01",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("wineRack", () => {
  it("returns nothing for an empty cellar", () => {
    expect(wineRack([])).toEqual([]);
  });

  it("groups by region, ranks rows by bottle count, and labels a blank region", () => {
    const rows = wineRack([
      entry({ id: "a", region: "Piedmont" }),
      entry({ id: "b", region: "Piedmont" }),
      entry({ id: "c", region: "" }),
      entry({ id: "d", region: "Burgundy" }),
    ]);
    expect(rows.map((row) => row.region)).toEqual([
      "Piedmont",
      "Burgundy",
      "Unknown region",
    ]);
    expect(rows[0].slots.map((slot) => slot.id)).toEqual(["a", "b"]);
  });

  it("keeps single-bottle regions beside a region with many bottles", () => {
    const busy = Array.from({ length: 6 }, (_, i) =>
      entry({ id: `busy-${i}`, region: "Napa" })
    );
    const rows = wineRack([
      ...busy,
      entry({ id: "solo-1", region: "Rioja" }),
      entry({ id: "solo-2", region: "Douro" }),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0].region).toBe("Napa");
    expect(rows[0].slots).toHaveLength(6);
    const regions = rows.map((row) => row.region);
    expect(regions).toContain("Rioja");
    expect(regions).toContain("Douro");
  });
});

describe("WINE_TYPE_MARK", () => {
  it("gives all seven types a pairwise-distinct (token, hollow) mark", () => {
    const pairs = WINE_TYPES.map((type) => {
      const mark = WINE_TYPE_MARK[type];
      return `${mark.token}:${mark.hollow}`;
    });
    expect(new Set(pairs).size).toBe(WINE_TYPES.length);
    expect(WINE_TYPES.length).toBe(7);
  });
});
