import { parseWineInventory, openInventoryBottle, saveWineInventory, WINE_INVENTORY_KEY } from "@/lib/wineInventory";
import { loadWineEntries, WINE_CELLAR_STORAGE_KEY } from "@/lib/wineCellar";

beforeEach(() => localStorage.clear());
const bottle = { id: "stock", name: "Chianti", producer: "", region: "Tuscany", varietal: "Sangiovese", vintage: 2020, type: "red" as const, price: 20, quantity: 2, wishlist: false };
const tasting = { ...bottle, rating: 4, notes: "Cherry", tastedOn: "2026-10-23" };

it("opens an owned bottle into the existing journal and leaves older tastings intact", () => {
  localStorage.setItem(WINE_CELLAR_STORAGE_KEY, JSON.stringify([{ ...tasting, id: "old", createdAt: "2026-10-01T00:00:00Z" }]));
  saveWineInventory([bottle]);
  expect(openInventoryBottle("stock", tasting)).toBe(true);
  expect(loadWineEntries()).toHaveLength(2);
  expect(parseWineInventory(localStorage.getItem(WINE_INVENTORY_KEY))[0].quantity).toBe(1);
});

it("does not log a tasting when the last bottle was already opened in another view", () => {
  saveWineInventory([{ ...bottle, quantity: 1 }]);
  expect(openInventoryBottle("stock", tasting)).toBe(true);
  expect(openInventoryBottle("stock", tasting)).toBe(false);
  expect(loadWineEntries()).toHaveLength(1);
});

it("rejects malformed restored inventory and never opens a wishlist bottle", () => {
  expect(parseWineInventory(JSON.stringify([{ ...bottle, quantity: -1 }, { ...bottle, type: "bad" }, null]))).toEqual([]);
  saveWineInventory([{ ...bottle, wishlist: true, quantity: 0 }]);
  expect(openInventoryBottle("stock", tasting)).toBe(false);
});
