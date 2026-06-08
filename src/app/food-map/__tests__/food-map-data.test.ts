import {
  countPlacesByCity,
  filterFoodMapPlaces,
  FOOD_MAP_CITIES,
  FOOD_MAP_PLACES,
  getCuisinesForCity,
  isFoodMapCityId,
  isFoodMapCuisineId,
  isFoodMapCuratorId,
  isFoodMapPlaceId,
} from "../food-map-data";

describe("food-map-data", () => {
  it("places sit in known cities, curators, and cuisines with valid coords", () => {
    for (const place of FOOD_MAP_PLACES) {
      expect(isFoodMapCityId(place.city)).toBe(true);
      expect(isFoodMapCuisineId(place.cuisine)).toBe(true);
      expect(place.curators.length).toBeGreaterThan(0);
      for (const curator of place.curators) {
        expect(isFoodMapCuratorId(curator)).toBe(true);
      }
      expect(isFoodMapPlaceId(place.id)).toBe(true);

      const [lat, lng] = place.coords;
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    }
  });

  it("counts places per city for every defined city", () => {
    const counts = countPlacesByCity(FOOD_MAP_PLACES);
    for (const city of FOOD_MAP_CITIES) {
      expect(counts).toHaveProperty(city.id);
    }
    const total = Object.values(counts).reduce((acc, value) => acc + value, 0);
    expect(total).toBe(FOOD_MAP_PLACES.length);
  });

  it("filterFoodMapPlaces narrows to a single city", () => {
    const result = filterFoodMapPlaces(FOOD_MAP_PLACES, {
      city: "austin",
      curators: [],
      cuisines: [],
    });
    expect(result.length).toBeGreaterThan(0);
    for (const place of result) {
      expect(place.city).toBe("austin");
    }
  });

  it("filterFoodMapPlaces narrows by curator and city together", () => {
    const result = filterFoodMapPlaces(FOOD_MAP_PLACES, {
      city: "nyc",
      curators: ["bourdain"],
      cuisines: [],
    });
    expect(result.length).toBeGreaterThan(0);
    for (const place of result) {
      expect(place.city).toBe("nyc");
      expect(place.curators).toContain("bourdain");
    }
  });

  it("getCuisinesForCity returns only cuisines present in that city", () => {
    const tokyoCuisineIds = getCuisinesForCity("tokyo").map((c) => c.id);
    expect(tokyoCuisineIds.length).toBeGreaterThan(0);

    const actual = new Set(
      FOOD_MAP_PLACES.filter((p) => p.city === "tokyo").map((p) => p.cuisine)
    );
    expect(new Set(tokyoCuisineIds)).toEqual(actual);
  });

  it("plots Tokyo spots east of the meridian (positive longitude)", () => {
    // Regression: the ported source data had negative Tokyo longitudes, which
    // would drop pins in the Pacific.
    const tokyo = FOOD_MAP_PLACES.filter((p) => p.city === "tokyo");
    expect(tokyo.length).toBeGreaterThan(0);
    for (const place of tokyo) {
      expect(place.coords[1]).toBeGreaterThan(0);
    }
  });
});
