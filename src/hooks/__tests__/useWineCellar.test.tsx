import { act, renderHook } from "@testing-library/react";
import { WINE_CELLAR_STORAGE_KEY } from "@/lib/wineCellar";
import { useWineCellar } from "../useWineCellar";

describe("useWineCellar", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("adds, updates, removes, filters, and summarizes stored wine entries", () => {
    const { result } = renderHook(() => useWineCellar());

    act(() => {
      result.current.addEntry({
        name: "Barolo",
        producer: "Producer A",
        vintage: 2019,
        region: "Piedmont",
        varietal: "Nebbiolo",
        type: "red",
        price: 70,
        rating: 4.5,
        notes: "Cherry",
        tastedOn: "2026-06-01",
      });
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.summary.averageRating).toBe(4.5);
    expect(window.localStorage.getItem(WINE_CELLAR_STORAGE_KEY)).toContain("Barolo");

    const id = result.current.entries[0].id;

    act(() => {
      result.current.updateFilters((current) => ({
        ...current,
        search: "barolo",
      }));
    });

    expect(result.current.visibleEntries).toHaveLength(1);

    act(() => {
      result.current.updateEntry(id, {
        name: "Chablis",
        producer: "Producer B",
        vintage: 2021,
        region: "Burgundy",
        varietal: "Chardonnay",
        type: "white",
        price: 42,
        rating: 4,
        notes: "Lemon",
        tastedOn: "2026-06-07",
      });
    });

    expect(result.current.findEntry(id)?.name).toBe("Chablis");
    expect(result.current.visibleEntries).toHaveLength(0);

    act(() => {
      result.current.resetFilters();
    });
    expect(result.current.visibleEntries).toHaveLength(1);

    act(() => {
      result.current.removeEntry(id);
    });

    expect(result.current.entries).toHaveLength(0);
  });
});
