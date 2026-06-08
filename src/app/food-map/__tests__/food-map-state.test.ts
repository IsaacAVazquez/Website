import {
  buildFoodMapHref,
  DEFAULT_FOOD_MAP_STATE,
  normalizeFoodMapState,
  resetFoodMapFilters,
  setCity,
  setPick,
  toggleCuisine,
  toggleCurator,
} from "../food-map-state";

describe("food-map-state", () => {
  it("returns the default state (Austin, no filters) when params are empty", () => {
    expect(normalizeFoodMapState({})).toEqual(DEFAULT_FOOD_MAP_STATE);
    expect(DEFAULT_FOOD_MAP_STATE.city).toBe("austin");
  });

  it("drops invalid city, curator, cuisine, and pick values", () => {
    expect(
      normalizeFoodMapState({
        city: "atlantis",
        curator: "bourdain,not-real,isaac",
        cuisine: "tacos,nope",
        pick: "fake-place",
      })
    ).toEqual({
      city: "austin",
      curators: ["bourdain", "isaac"],
      cuisines: ["tacos"],
      pick: null,
    });
  });

  it("dedupes repeated values inside a list parameter", () => {
    expect(
      normalizeFoodMapState({ curator: "isaac,isaac,google" }).curators
    ).toEqual(["isaac", "google"]);
  });

  it("omits the default city and empty filters when serializing the href", () => {
    expect(buildFoodMapHref(DEFAULT_FOOD_MAP_STATE)).toBe("/food-map");
    expect(
      buildFoodMapHref({
        city: "tokyo",
        curators: ["bourdain", "isaac"],
        cuisines: ["ramen"],
        pick: "rokurinsha",
      })
    ).toBe(
      "/food-map?city=tokyo&curator=bourdain%2Cisaac&cuisine=ramen&pick=rokurinsha"
    );
  });

  it("toggles curator and cuisine selections cleanly and clears the pick", () => {
    const curatorAdded = toggleCurator(DEFAULT_FOOD_MAP_STATE, "bourdain");
    expect(curatorAdded.curators).toEqual(["bourdain"]);
    expect(toggleCurator(curatorAdded, "bourdain").curators).toEqual([]);

    const withPick = setPick(DEFAULT_FOOD_MAP_STATE, "franklin-barbecue");
    const cuisineAdded = toggleCuisine(withPick, "tacos");
    expect(cuisineAdded.cuisines).toEqual(["tacos"]);
    expect(cuisineAdded.pick).toBeNull();
  });

  it("setCity switches city, clearing city-scoped cuisines and the pick", () => {
    const base = {
      city: "austin" as const,
      curators: ["isaac" as const],
      cuisines: ["tacos" as const],
      pick: "veracruz-all-natural",
    };

    const next = setCity(base, "tokyo");
    expect(next.city).toBe("tokyo");
    expect(next.cuisines).toEqual([]);
    expect(next.pick).toBeNull();
    // Curators are cross-city and survive a city change.
    expect(next.curators).toEqual(["isaac"]);
  });

  it("resetFoodMapFilters keeps the city and pick but clears filters", () => {
    const filtered = {
      city: "nyc" as const,
      curators: ["bourdain" as const],
      cuisines: ["deli" as const],
      pick: "katzs-deli",
    };

    expect(resetFoodMapFilters(filtered)).toEqual({
      city: "nyc",
      curators: [],
      cuisines: [],
      pick: "katzs-deli",
    });
  });
});
