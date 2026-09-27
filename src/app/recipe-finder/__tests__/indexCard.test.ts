import type { Recipe } from "@/lib/recipes";
import { indexCardLines } from "../indexCard";

const recipe: Recipe = {
  id: "test-skillet",
  title: "Test Skillet",
  cuisine: "American",
  category: "dinner",
  prepMinutes: 10,
  cookMinutes: 20,
  servings: 4,
  difficulty: "easy",
  ingredients: [
    { name: "chicken breast", display: "2 chicken breasts" },
    { name: "olive oil", display: "1 tbsp olive oil", staple: true },
    { name: "salt", display: "Salt to taste", staple: true },
    { name: "rice", display: "1 cup rice" },
  ],
  instructions: ["Cook it."],
  tags: [],
};

describe("indexCardLines", () => {
  it("ticks nothing but staples on an empty pantry", () => {
    const card = indexCardLines(recipe, []);
    expect(card.lines).toEqual([
      { name: "2 chicken breasts", have: false, staple: false },
      { name: "1 tbsp olive oil", have: true, staple: true },
      { name: "Salt to taste", have: true, staple: true },
      { name: "1 cup rice", have: false, staple: false },
    ]);
    expect(card.counts).toEqual({ have: 0, need: 2 });
  });

  it("ticks everything on a full pantry", () => {
    const card = indexCardLines(recipe, ["chicken breast", "rice", "olive oil", "salt"]);
    expect(card.lines.every((line) => line.have)).toBe(true);
    expect(card.counts).toEqual({ have: 2, need: 0 });
  });

  it("exempts staples even when the pantry doesn't list them", () => {
    const card = indexCardLines(recipe, ["chicken breast", "rice"]);
    const staples = card.lines.filter((line) => line.staple);
    expect(staples).toHaveLength(2);
    expect(staples.every((line) => line.have)).toBe(true);
    expect(card.counts).toEqual({ have: 2, need: 0 });
  });

  it("ticks a fuzzy match the matcher accepts", () => {
    // Pantry has "chicken"; the recipe wants "chicken breast". The shared
    // matcher's loose whole-word rule accepts it, and this helper must not
    // re-implement that logic, only read its result.
    const card = indexCardLines(recipe, ["chicken"]);
    const chickenLine = card.lines.find((line) => line.name === "2 chicken breasts");
    expect(chickenLine?.have).toBe(true);
    expect(card.counts).toEqual({ have: 1, need: 1 });
  });

  it("preserves the recipe's ingredient order on a long list", () => {
    const long: Recipe = {
      ...recipe,
      ingredients: Array.from({ length: 12 }, (_, i) => ({
        name: `ingredient ${i}`,
        display: `item ${i}`,
      })),
    };
    const card = indexCardLines(long, ["ingredient 3", "ingredient 7"]);
    expect(card.lines.map((line) => line.name)).toEqual(
      long.ingredients.map((ingredient) => ingredient.display),
    );
    expect(card.counts).toEqual({ have: 2, need: 10 });
  });
});
