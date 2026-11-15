import { parseFoodRecords, addFoodToTrip } from "../foodPersonal";
import { FOOD_MAP_PLACES } from "../food-map-data";
import { createTrip } from "@/lib/travelPlanner";

it("restores only known restaurants and bounds personal notes", () => {
  expect(parseFoodRecords("null")).toEqual({});
  expect(parseFoodRecords('{"constructor":{"saved":true}}')).toEqual({});
  const result = parseFoodRecords(
    JSON.stringify({
      "franklin-barbecue": {
        saved: true,
        visited: "yes",
        note: "a".repeat(3000),
      },
    }),
  );
  expect(result["franklin-barbecue"]).toEqual({
    saved: true,
    visited: false,
    note: "a".repeat(2000),
  });
});
it("adds a restaurant once per date, preserves other stops, and rejects dates outside the trip", () => {
  const trip = createTrip({
    name: "Austin",
    destination: "Austin",
    startDate: "2026-11-01",
    endDate: "2026-11-03",
  });
  const next = addFoodToTrip(trip, FOOD_MAP_PLACES[0], "2026-11-02");
  expect(next.activities[0]).toMatchObject({
    category: "food",
    cost: null,
    date: "2026-11-02",
  });
  expect(addFoodToTrip(next, FOOD_MAP_PLACES[0], "2026-11-02")).toBe(next);
  expect(addFoodToTrip(trip, FOOD_MAP_PLACES[0], "2026-02-30")).toBe(trip);
  expect(addFoodToTrip(trip, FOOD_MAP_PLACES[0], "2026-11-04")).toBe(trip);
});

it("keeps a record for a place that is no longer in the catalog", () => {
  expect(
    parseFoodRecords('{"delisted-place":{"saved":true,"note":"go back"}}'),
  ).toEqual({ "delisted-place": { saved: true, visited: false, note: "go back" } });
});
