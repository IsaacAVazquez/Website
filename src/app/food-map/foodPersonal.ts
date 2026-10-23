import { isRecord } from "@/lib/utils";
import { isIsoDate, createActivity } from "@/lib/travelPlanner";
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
export function parseFoodRecords(raw: string): Record<string, FoodRecord> {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return {};
    return Object.fromEntries(
      FOOD_MAP_PLACES.flatMap((place) => {
        const row = Object.hasOwn(data, place.id) ? data[place.id] : null;
        return isRecord(row)
          ? [
              [
                place.id,
                {
                  saved: row.saved === true,
                  visited: row.visited === true,
                  note:
                    typeof row.note === "string" ? row.note.slice(0, 2000) : "",
                },
              ],
            ]
          : [];
      }),
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
    !isIsoDate(date) ||
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
