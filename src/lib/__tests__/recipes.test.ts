import type { Recipe } from "../recipes";
import { RECIPES } from "@/data/recipesSnapshot";
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
  it("normalizes and whole-word matches pantry ingredients", () => {
    expect(normalizeIngredient("  Cherry-Tomatoes!! ")).toBe("cherry tomatoes");
    expect(ingredientsMatch("tomato", "cherry tomato")).toBe(true);
    expect(ingredientsMatch("chicken", "chicken breast")).toBe(true);
    expect(ingredientsMatch("olive oil", "oil")).toBe(true);
    // Whole-word containment: a substring is no longer enough to match.
    expect(ingredientsMatch("rice", "rice vinegar")).toBe(false);
    expect(ingredientsMatch("egg", "eggplant")).toBe(false);
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

  it("finds every recipe by its own title, hyphens and ampersands included", () => {
    const lost = RECIPES.filter(
      (recipe) =>
        !searchRecipes(RECIPES, [], { query: recipe.title }).some((match) => match.recipe.id === recipe.id)
    ).map((recipe) => recipe.title);

    expect(lost).toEqual([]);
  });

  it("finds a recipe by a hyphenated tag", () => {
    const tagged = [{ ...recipes[0], tags: ["one-pan"] }, recipes[1]];

    expect(searchRecipes(tagged, [], { query: "one-pan" }).map((match) => match.recipe.id)).toEqual([
      "tomato-pasta",
    ]);
  });

  it("orders an empty pantry the same way whatever language the browser runs in", () => {
    const titles = RECIPES.map((recipe) => recipe.title);
    const native = String.prototype.localeCompare;
    const inEnglish = [...titles].sort((a, b) => native.call(a, b, "en"));
    // Czech files "ch" as its own letter after "h", so its order differs from the server's.
    expect([...titles].sort((a, b) => native.call(a, b, "cs"))).not.toEqual(inEnglish);

    const spy = jest
      .spyOn(String.prototype, "localeCompare")
      .mockImplementation(function (this: string, that: string, locales?: Intl.LocalesArgument) {
        return native.call(this, that, locales ?? "cs");
      });
    try {
      expect(searchRecipes(RECIPES, []).map((match) => match.recipe.title)).toEqual(inEnglish);
    } finally {
      spy.mockRestore();
    }
  });

  it("never counts an ingredient as a staple in one recipe and as missing in another", () => {
    const stapleNames = new Set(
      RECIPES.flatMap((recipe) => recipe.ingredients.filter((ingredient) => ingredient.staple)).map(
        (ingredient) => ingredient.name
      )
    );
    const mixed = RECIPES.flatMap((recipe) =>
      recipe.ingredients
        .filter((ingredient) => !ingredient.staple && stapleNames.has(ingredient.name))
        .map((ingredient) => `${recipe.id}: ${ingredient.name}`)
    );

    expect(mixed).toEqual([]);
  });

  it("does not include honey in recipes labeled vegan", () => {
    const violations = RECIPES.filter((recipe) => recipe.diet?.includes("vegan"))
      .filter((recipe) =>
        recipe.ingredients.some((ingredient) => ingredient.name === "honey")
      )
      .map((recipe) => recipe.id);

    expect(violations).toEqual([]);
  });
});
