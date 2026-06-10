import type { Recipe } from "../recipes";
import {
  formatTotalTime,
  getIngredientCatalog,
  ingredientsMatch,
  normalizeIngredient,
  scoreRecipe,
  searchRecipes,
} from "../recipes";

const recipes: Recipe[] = [
  {
    id: "tomato-pasta",
    title: "Tomato Pasta",
    cuisine: "Italian",
    category: "dinner",
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 2,
    difficulty: "easy",
    ingredients: [
      { name: "pasta", display: "8 oz pasta" },
      { name: "tomato", display: "1 cup tomato sauce" },
      { name: "olive oil", display: "1 tbsp olive oil", staple: true },
    ],
    instructions: ["Cook pasta.", "Sauce and serve."],
    tags: ["quick"],
    diet: ["vegetarian"],
  },
  {
    id: "chicken-rice",
    title: "Chicken Rice Bowl",
    cuisine: "American",
    category: "lunch",
    prepMinutes: 20,
    cookMinutes: 45,
    servings: 4,
    difficulty: "medium",
    ingredients: [
      { name: "chicken breast", display: "1 lb chicken breast" },
      { name: "rice", display: "2 cups rice" },
    ],
    instructions: ["Cook chicken.", "Serve over rice."],
    tags: ["protein"],
    diet: ["high-protein"],
  },
];

describe("recipes", () => {
  it("normalizes and loosely matches pantry ingredients", () => {
    expect(normalizeIngredient("  Cherry-Tomatoes!! ")).toBe("cherry tomatoes");
    expect(ingredientsMatch("tomatoes", "tomato")).toBe(true);
    expect(ingredientsMatch("olive oil", "oil")).toBe(true);
    expect(ingredientsMatch("", "tomato")).toBe(false);
  });

  it("scores recipes without counting pantry staples as missing", () => {
    const match = scoreRecipe(recipes[0], ["tomato"]);

    expect(match.matched.map((ingredient) => ingredient.name)).toEqual(["tomato"]);
    expect(match.missing.map((ingredient) => ingredient.name)).toEqual(["pasta"]);
    expect(match.staples.map((ingredient) => ingredient.name)).toEqual(["olive oil"]);
    expect(match.matchScore).toBe(0.5);
  });

  it("searches, filters, and ranks by pantry match quality", () => {
    expect(searchRecipes(recipes, [], {}).map((match) => match.recipe.id)).toEqual([
      "chicken-rice",
      "tomato-pasta",
    ]);
    expect(
      searchRecipes(recipes, ["rice", "chicken"], { diet: "high-protein" }).map(
        (match) => match.recipe.id
      )
    ).toEqual(["chicken-rice"]);
    expect(
      searchRecipes(recipes, ["tomato"], { query: "italian", category: "dinner" }).map(
        (match) => match.recipe.id
      )
    ).toEqual(["tomato-pasta"]);
  });

  it("builds a sorted non-staple ingredient catalog and formats total time", () => {
    expect(getIngredientCatalog(recipes)).toEqual([
      "chicken breast",
      "pasta",
      "rice",
      "tomato",
    ]);
    expect(formatTotalTime(recipes[0])).toBe("25 min");
    expect(formatTotalTime(recipes[1])).toBe("1 hr 5 min");
  });
});
