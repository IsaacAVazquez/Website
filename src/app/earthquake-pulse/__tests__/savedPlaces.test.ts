import { distanceKm, parsePlaces, nearbyQuakes } from "../savedPlaces";
import type { QuakeEvent } from "@/types/earthquake";

const place = {
  id: "home",
  name: "Home",
  latitude: 0,
  longitude: 179.9,
  radiusKm: 100,
  minMagnitude: 3,
};
const quake = {
  id: "one",
  latitude: 0,
  longitude: -179.9,
  magnitude: 4,
  time: "2026-10-25T00:00:00Z",
} as QuakeEvent;

it("measures across the date line and includes the center", () => {
  expect(distanceKm(place, quake)).toBeCloseTo(22.24, 1);
  expect(distanceKm(place, place)).toBe(0);
  expect(
    nearbyQuakes([quake, { ...quake, id: "low", magnitude: 2 }], place).map(
      (item) => item.quake.id,
    ),
  ).toEqual(["one"]);
});
it("rejects invalid coordinates and empty numeric strings instead of turning them into zero", () => {
  expect(
    parsePlaces(
      JSON.stringify([
        place,
        { ...place, id: "bad", latitude: 91 },
        { ...place, id: "empty", longitude: "" },
      ]),
    ),
  ).toEqual([place]);
  expect(parsePlaces("{}")).toEqual([]);
});
