/**
 * Ticks for a recipe's ruled index card. Reuses the shared matcher
 * (`scoreRecipe` in `src/lib/recipes.ts`) rather than re-deriving matches, so
 * a line only ticks when the matcher itself says the pantry covers it
 * (fuzzy matching and the staples exemption included), and the counts always
 * agree with the matcher's own matched/missing split.
 */
import { scoreRecipe, type Recipe } from "@/lib/recipes";

export interface IndexCardLine {
  /** The ingredient's display line as written in the recipe (e.g. "2 tbsp olive oil"). */
  name: string;
  /** Whether the pantry, or the staples exemption, covers this line. */
  have: boolean;
  staple: boolean;
}

export interface IndexCardCounts {
  have: number;
  need: number;
}

export interface IndexCard {
  /** Every ingredient, in the recipe's own order. */
  lines: IndexCardLine[];
  counts: IndexCardCounts;
}

export function indexCardLines(recipe: Recipe, pantry: string[]): IndexCard {
  const { matched, missing } = scoreRecipe(recipe, pantry);
  const missingNames = new Set(missing.map((ingredient) => ingredient.name));

  const lines: IndexCardLine[] = recipe.ingredients.map((ingredient) => ({
    name: ingredient.display,
    have: !missingNames.has(ingredient.name),
    staple: Boolean(ingredient.staple),
  }));

  return {
    lines,
    counts: { have: matched.length, need: missing.length },
  };
}
