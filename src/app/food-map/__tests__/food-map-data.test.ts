import {
  countPlacesByNeighborhood,
  filterFoodMapPlaces,
  FOOD_MAP_NEIGHBORHOODS,
  FOOD_MAP_PLACES,
  isFoodMapCuisineId,
  isFoodMapMealId,
  isFoodMapNeighborhoodId,
  isFoodMapPlaceId,
} from "../food-map-data";

describe("food-map-data", () => {
  it("places sit in known neighborhoods, cuisines, and meals", () => {
    for (const place of FOOD_MAP_PLACES) {
      expect(isFoodMapNeighborhoodId(place.neighborhood)).toBe(true);
      expect(isFoodMapCuisineId(place.cuisine)).toBe(true);
      expect(place.meals.length).toBeGreaterThan(0);
      for (const meal of place.meals) {
        expect(isFoodMapMealId(meal)).toBe(true);
      }
      expect(isFoodMapPlaceId(place.id)).toBe(true);
      expect(place.x).toBeGreaterThanOrEqual(0);
      expect(place.x).toBeLessThanOrEqual(100);
      expect(place.y).toBeGreaterThanOrEqual(0);
      expect(place.y).toBeLessThanOrEqual(100);
    }
  });

  it("counts places per neighborhood for every defined neighborhood", () => {
    const counts = countPlacesByNeighborhood(FOOD_MAP_PLACES);
    for (const neighborhood of FOOD_MAP_NEIGHBORHOODS) {
      expect(counts).toHaveProperty(neighborhood.id);
    }
    const total = Object.values(counts).reduce((acc, value) => acc + value, 0);
    expect(total).toBe(FOOD_MAP_PLACES.length);
  });

  it("filterFoodMapPlaces returns the full list when filters are empty", () => {
    const result = filterFoodMapPlaces(FOOD_MAP_PLACES, {
      neighborhoods: [],
      cuisines: [],
      meal: "all",
    });
    expect(result).toHaveLength(FOOD_MAP_PLACES.length);
  });

  it("filterFoodMapPlaces narrows by meal and cuisine together", () => {
    const result = filterFoodMapPlaces(FOOD_MAP_PLACES, {
      neighborhoods: [],
      cuisines: ["tacos"],
      meal: "breakfast",
    });

    expect(result.length).toBeGreaterThan(0);
    for (const place of result) {
      expect(place.cuisine).toBe("tacos");
      expect(place.meals).toContain("breakfast");
    }
  });

  it("filterFoodMapPlaces narrows by neighborhood selection", () => {
    const result = filterFoodMapPlaces(FOOD_MAP_PLACES, {
      neighborhoods: ["south-lamar"],
      cuisines: [],
      meal: "all",
    });

    expect(result.length).toBeGreaterThan(0);
    for (const place of result) {
      expect(place.neighborhood).toBe("south-lamar");
    }
  });
});
