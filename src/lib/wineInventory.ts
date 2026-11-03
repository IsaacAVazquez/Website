import {
  readBrowserStorageString,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";
import {
  createWineEntry,
  loadWineEntries,
  saveWineEntries,
  WINE_TYPES,
  type WineDraft,
} from "@/lib/wineCellar";
import type { WineEntry } from "@/types/wine";
import { isRecord } from "@/lib/utils";

export const WINE_INVENTORY_KEY = "wine_cellar_inventory_v1";
export interface InventoryBottle extends Pick<
  WineEntry,
  | "id"
  | "name"
  | "producer"
  | "vintage"
  | "region"
  | "varietal"
  | "type"
  | "price"
> {
  quantity: number;
  wishlist: boolean;
}

export function parseWineInventory(raw: string | null): InventoryBottle[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.slice(0, 1000).flatMap((bottle): InventoryBottle[] => {
      if (
        !isRecord(bottle) ||
        typeof bottle.id !== "string" ||
        !bottle.id ||
        seen.has(bottle.id) ||
        typeof bottle.name !== "string" ||
        !bottle.name.trim() ||
        !WINE_TYPES.includes(bottle.type as InventoryBottle["type"]) ||
        typeof bottle.quantity !== "number" ||
        !Number.isInteger(bottle.quantity) ||
        bottle.quantity < 0 ||
        bottle.quantity > 999 ||
        typeof bottle.wishlist !== "boolean"
      )
        return [];
      seen.add(bottle.id);
      const text = (value: unknown) =>
        typeof value === "string" ? value.trim().slice(0, 200) : "";
      return [
        {
          id: bottle.id.slice(0, 100),
          name: text(bottle.name),
          producer: text(bottle.producer),
          region: text(bottle.region),
          varietal: text(bottle.varietal),
          type: bottle.type as InventoryBottle["type"],
          vintage:
            typeof bottle.vintage === "number" &&
            Number.isInteger(bottle.vintage) &&
            bottle.vintage >= 1800 &&
            bottle.vintage <= 2100
              ? bottle.vintage
              : null,
          price:
            typeof bottle.price === "number" &&
            Number.isFinite(bottle.price) &&
            bottle.price >= 0
              ? bottle.price
              : null,
          wishlist: bottle.wishlist,
          quantity: bottle.wishlist ? 0 : bottle.quantity,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function loadWineInventory(): InventoryBottle[] {
  return parseWineInventory(readBrowserStorageString(WINE_INVENTORY_KEY).value);
}

export function saveWineInventory(bottles: InventoryBottle[]) {
  writeBrowserStorageJson(
    WINE_INVENTORY_KEY,
    parseWineInventory(JSON.stringify(bottles)),
  );
}

export function openInventoryBottle(id: string, draft: WineDraft): boolean {
  const bottles = loadWineInventory();
  const bottle = bottles.find((item) => item.id === id);
  if (!bottle || bottle.wishlist || bottle.quantity < 1) return false;
  saveWineEntries([...loadWineEntries(), createWineEntry(draft)]);
  saveWineInventory(
    bottles.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
    ),
  );
  return true;
}
