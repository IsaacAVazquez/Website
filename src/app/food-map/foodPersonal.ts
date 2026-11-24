import { isRecord } from "@/lib/utils";
import { createActivity } from "@/lib/travelPlanner";
import { isLocalDateKey } from "@/lib/date-formatters";
import type { Trip } from "@/types/travel";
import {
  FOOD_MAP_PLACES,
  getFoodMapCity,
  mapsLink,
  type FoodMapPlace,
} from "./food-map-data";

export const FOOD_RECORDS_KEY = "food-map-records-v1";
export interface FoodRecord {
  saved: boolean;
  visited: boolean;
  note: string;
}
export const EMPTY_FOOD_RECORD: FoodRecord = {
  saved: false,
  visited: false,
  note: "",
};
const KNOWN_PLACE_IDS = new Set(FOOD_MAP_PLACES.map((place) => place.id));
// Records for places that left the catalog are kept, so a visitor's notes
// survive a delisting. Bounded so a damaged save cannot grow without limit.
const MAX_UNLISTED_RECORDS = 200;
export function parseFoodRecords(raw: string): Record<string, FoodRecord> {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return {};
    const rows = Object.entries(data).filter(
      ([id, row]) =>
        !(id in Object.prototype) && id.length <= 100 && isRecord(row),
    ) as [string, Record<string, unknown>][];
    return Object.fromEntries(
      [
        ...rows.filter(([id]) => KNOWN_PLACE_IDS.has(id)),
        ...rows
          .filter(([id]) => !KNOWN_PLACE_IDS.has(id))
          .slice(0, MAX_UNLISTED_RECORDS),
      ].map(([id, row]) => [
        id,
        {
          saved: row.saved === true,
          visited: row.visited === true,
          note: typeof row.note === "string" ? row.note.slice(0, 2000) : "",
        },
      ]),
    );
  } catch {
    return {};
  }
}
export function addFoodToTrip(
  trip: Trip,
  place: FoodMapPlace,
  date: string,
): Trip {
  const city = getFoodMapCity(place.city).name;
  if (
    !isLocalDateKey(date) ||
    date < trip.startDate ||
    date > trip.endDate ||
    trip.activities.some(
      (item) =>
        item.date === date &&
        item.title === place.name &&
        item.location === city,
    )
  )
    return trip;
  return {
    ...trip,
    activities: [
      ...trip.activities,
      createActivity({
        title: place.name,
        date,
        time: "",
        endTime: "",
        location: city,
        category: "food",
        cost: null,
        notes: `${mapsLink(place)}\nSuggested order: ${place.order}\nConfirm the location, opening hours, and price before visiting.`,
      }),
    ],
  };
}
