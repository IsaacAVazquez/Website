import type { QuakeEvent } from "@/types/earthquake";
import { isFollowingId, readRecordArray } from "@/lib/personalFollowing";

export const SAVED_PLACES_KEY = "earthquake-saved-places-v1";
export interface SavedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  minMagnitude: number;
}

export function parsePlaces(raw: string): SavedPlace[] {
  const seen = new Set<string>();
  return readRecordArray(raw)
    .flatMap((row): SavedPlace[] => {
      if (
        !isFollowingId(row.id) ||
        seen.has(row.id) ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        row.name.length > 80
      )
        return [];
      for (const [field, min, max] of [
        ["latitude", -90, 90],
        ["longitude", -180, 180],
        ["radiusKm", 1, 5000],
        ["minMagnitude", 0, 10],
      ] as const) {
        if (
          typeof row[field] !== "number" ||
          !Number.isFinite(row[field]) ||
          row[field] < min ||
          row[field] > max
        )
          return [];
      }
      seen.add(row.id);
      return [
        {
          id: row.id,
          name: row.name.trim(),
          latitude: row.latitude as number,
          longitude: row.longitude as number,
          radiusKm: row.radiusKm as number,
          minMagnitude: row.minMagnitude as number,
        },
      ];
    })
    .slice(0, 20);
}

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const radians = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * radians;
  const dLon = (b.longitude - a.longitude) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(dLon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}

export function nearbyQuakes(quakes: QuakeEvent[], place: SavedPlace) {
  return quakes
    .filter(
      (quake) =>
        quake.magnitude >= place.minMagnitude &&
        Number.isFinite(quake.latitude) &&
        Number.isFinite(quake.longitude),
    )
    .map((quake) => ({ quake, distance: distanceKm(place, quake) }))
    .filter((item) => item.distance <= place.radiusKm)
    .sort((a, b) => Date.parse(b.quake.time) - Date.parse(a.quake.time));
}
