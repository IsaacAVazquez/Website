import type { WineEntry } from "@/types/wine";
import {
  applyWineDraft,
  calculateWineSummary,
  createWineEntry,
  filterAndSortWines,
  getTodayIsoDate,
  parseWineEntries,
} from "../wineCellar";

const now = new Date("2026-06-08T12:00:00.000Z");

const entries: WineEntry[] = [
  {
    id: "wine-1",
    name: "Barolo",
    producer: "Producer A",
    vintage: 2019,
    region: "Piedmont",
    varietal: "Nebbiolo",
    type: "red",
    price: 70,
    rating: 4.5,
    notes: "Cherry and tar.",
    tastedOn: "2026-06-01",
    createdAt: "2026-06-01T12:00:00.000Z",
  },
  {
    id: "wine-2",
    name: "Chablis",
    producer: "Producer B",
    vintage: 2021,
    region: "Burgundy",
    varietal: "Chardonnay",
    type: "white",
    price: 42.5,
    rating: 4,
    notes: "Lemon and stone.",
    tastedOn: "2026-06-07",
    createdAt: "2026-06-07T12:00:00.000Z",
  },
];

describe("wineCellar", () => {
  it("formats today in local ISO date form", () => {
    expect(getTodayIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("creates and updates sanitized wine entries", () => {
    const entry = createWineEntry(
      {
        name: "  Rioja  ",
        producer: "  Lopez  ",
        vintage: 1799,
        region: "  Rioja  ",
        varietal: " Tempranillo ",
        type: "red",
        price: -4,
        rating: 4.74,
        notes: "x".repeat(1100),
        tastedOn: "bad-date",
      },
      now
    );

    expect(entry).toMatchObject({
      name: "Rioja",
      producer: "Lopez",
      vintage: null,
      region: "Rioja",
      varietal: "Tempranillo",
      type: "red",
      price: null,
      rating: 4.5,
      tastedOn: "2026-06-08",
      createdAt: now.toISOString(),
    });
    expect(entry.notes).toHaveLength(1000);

    expect(
      applyWineDraft(entry, {
        name: " Albarino ",
        producer: "",
        vintage: 2020,
        region: "Rias Baixas",
        varietal: "Albarino",
        type: "white",
        price: "22.129" as unknown as number,
        rating: 5.1,
        notes: "salt",
        tastedOn: "2026-05-01",
      })
    ).toMatchObject({
      name: "Albarino",
      vintage: 2020,
      type: "white",
      price: 22.13,
      rating: 5,
      tastedOn: "2026-05-01",
    });
  });

  it("parses only valid stored entries", () => {
    const parsed = parseWineEntries(
      JSON.stringify([
        entries[0],
        { name: "", type: "red" },
        { name: "Broken", type: "blue" },
      ])
    );

    expect(parsed).toHaveLength(1);
  });

  it("summarizes, filters, and sorts wines", () => {
    const summary = calculateWineSummary(entries);

    expect(summary.averageRating).toBe(4.25);
    expect(summary.typeBreakdown.map(({ type, count }) => [type, count])).toEqual([
      ["red", 1],
      ["white", 1],
    ]);

    expect(
      filterAndSortWines(entries, {
        search: "stone",
        type: "all",
        minRating: 0,
        sort: "name",
        sortDirection: "asc",
      }).map((entry) => entry.id)
    ).toEqual(["wine-2"]);

    expect(
      filterAndSortWines(entries, {
        search: "",
        type: "all",
        minRating: 4,
        sort: "price",
        sortDirection: "desc",
      }).map((entry) => entry.id)
    ).toEqual(["wine-1", "wine-2"]);
  });
});
