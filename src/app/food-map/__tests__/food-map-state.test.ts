import {
  buildFoodMapHref,
  DEFAULT_FOOD_MAP_STATE,
  normalizeFoodMapState,
  resetFoodMapFilters,
  setMeal,
  setPick,
  toggleCuisine,
  toggleNeighborhood,
} from "../food-map-state";

describe("food-map-state", () => {
  it("returns the default state when params are empty", () => {
    expect(normalizeFoodMapState({})).toEqual(DEFAULT_FOOD_MAP_STATE);
  });

  it("drops invalid neighborhoods, cuisines, meal, and pick values", () => {
    expect(
      normalizeFoodMapState({
        neighborhood: "east-austin,not-real,downtown",
        cuisine: "tacos,nope",
        meal: "midnight",
        pick: "fake-place",
      })
    ).toEqual({
      neighborhoods: ["east-austin", "downtown"],
      cuisines: ["tacos"],
      meal: "all",
      pick: null,
    });
  });

  it("dedupes repeated values inside a list parameter", () => {
    expect(
      normalizeFoodMapState({
        cuisine: "tacos,tacos,coffee",
      }).cuisines
    ).toEqual(["tacos", "coffee"]);
  });

  it("omits default values when serializing the href", () => {
    expect(buildFoodMapHref(DEFAULT_FOOD_MAP_STATE)).toBe("/food-map");
    expect(
      buildFoodMapHref({
        neighborhoods: ["east-austin"],
        cuisines: ["tacos", "coffee"],
        meal: "breakfast",
        pick: "veracruz-all-natural",
      })
    ).toBe(
      "/food-map?neighborhood=east-austin&cuisine=tacos%2Ccoffee&meal=breakfast&pick=veracruz-all-natural"
    );
  });

  it("toggles neighborhood and cuisine selections cleanly", () => {
    const afterAdd = toggleNeighborhood(DEFAULT_FOOD_MAP_STATE, "east-austin");
    expect(afterAdd.neighborhoods).toEqual(["east-austin"]);

    const afterRemove = toggleNeighborhood(afterAdd, "east-austin");
    expect(afterRemove.neighborhoods).toEqual([]);

    const cuisineAdded = toggleCuisine(DEFAULT_FOOD_MAP_STATE, "tacos");
    expect(cuisineAdded.cuisines).toEqual(["tacos"]);
    expect(cuisineAdded.pick).toBeNull();
  });

  it("setMeal preserves filters and clears the pick", () => {
    const base = setPick(DEFAULT_FOOD_MAP_STATE, "franklin-barbecue");
    expect(base.pick).toBe("franklin-barbecue");

    const next = setMeal(base, "lunch");
    expect(next.meal).toBe("lunch");
    expect(next.pick).toBeNull();
  });

  it("resetFoodMapFilters keeps the current pick", () => {
    const filtered = {
      neighborhoods: ["east-austin" as const],
      cuisines: ["tacos" as const],
      meal: "breakfast" as const,
      pick: "veracruz-all-natural",
    };

    const reset = resetFoodMapFilters(filtered);
    expect(reset).toEqual({
      ...DEFAULT_FOOD_MAP_STATE,
      pick: "veracruz-all-natural",
    });
  });
});
