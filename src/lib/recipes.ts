/**
 * Recipe Finder — utilities and types.
 *
 * The recipe corpus lives in `src/data/recipesSnapshot.ts` as a curated,
 * hand-tuned snapshot. This module exposes the shared types, an ingredient
 * normalizer, and a scoring function so the client UI and any future server
 * routes share one source of truth.
 */

export type RecipeCategory =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "dessert"
  | "snack"
  | "side"
  | "drink";

export type RecipeDifficulty = "easy" | "medium" | "hard";

export type DietTag =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "high-protein"
  | "low-carb";

export interface RecipeIngredient {
  /** Canonical ingredient key, lowercase singular noun (e.g. "olive oil"). */
  name: string;
  /** Human-readable line as it appears in the recipe (e.g. "2 tbsp olive oil"). */
  display: string;
  /**
   * Common pantry items (salt, pepper, oil, water) that most kitchens have.
   * Staples don't count against a "missing ingredients" score so users aren't
   * forced to add salt to their pantry list.
   */
  staple?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  category: RecipeCategory;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
  diet?: DietTag[];
}

export interface RecipeMatch {
  recipe: Recipe;
  /** Non-staple ingredients the user has on hand. */
  matched: RecipeIngredient[];
  /** Non-staple ingredients the user is missing. */
  missing: RecipeIngredient[];
  /** Pantry staples this recipe assumes you have. */
  staples: RecipeIngredient[];
  /** matched.length / (matched.length + missing.length) — 0..1. */
  matchScore: number;
}

/**
 * Lowercases, trims, collapses whitespace, and strips a few cosmetic suffixes
 * so "Olive Oil ", "olive  oil", and "olive oil" all collapse to one key.
 */
export function normalizeIngredient(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Loose contains-match so "tomato" matches "cherry tomato" and "tomatoes"
 * matches "tomato". Returns true when either side substring-includes the
 * other after normalization.
 */
export function ingredientsMatch(a: string, b: string): boolean {
  const left = normalizeIngredient(a);
  const right = normalizeIngredient(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

export interface ScoreOptions {
  /** Optional case-insensitive title/tag/cuisine filter. */
  query?: string;
  /** Restrict to a category, or "all". */
  category?: RecipeCategory | "all";
  /** Restrict to a single diet tag, or "all". */
  diet?: DietTag | "all";
}

export function scoreRecipe(
  recipe: Recipe,
  pantry: string[],
): RecipeMatch {
  const normalizedPantry = pantry.map(normalizeIngredient).filter(Boolean);
  const matched: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];
  const staples: RecipeIngredient[] = [];

  for (const ingredient of recipe.ingredients) {
    if (ingredient.staple) {
      staples.push(ingredient);
      continue;
    }
    const hit = normalizedPantry.some((item) =>
      ingredientsMatch(item, ingredient.name),
    );
    if (hit) matched.push(ingredient);
    else missing.push(ingredient);
  }

  const denom = matched.length + missing.length;
  const matchScore = denom === 0 ? 1 : matched.length / denom;

  return { recipe, matched, missing, staples, matchScore };
}

/**
 * Score every recipe against the pantry, then sort by match quality. When the
 * pantry is empty we fall back to alphabetical order so the page is browsable
 * before the user adds anything.
 */
export function searchRecipes(
  recipes: Recipe[],
  pantry: string[],
  options: ScoreOptions = {},
): RecipeMatch[] {
  const { query, category = "all", diet = "all" } = options;
  const normalizedQuery = query ? normalizeIngredient(query) : "";
  const hasPantry = pantry.some((item) => normalizeIngredient(item).length > 0);

  const filtered = recipes.filter((recipe) => {
    if (category !== "all" && recipe.category !== category) return false;
    if (diet !== "all" && !(recipe.diet ?? []).includes(diet)) return false;
    if (!normalizedQuery) return true;
    const haystack = [
      recipe.title,
      recipe.cuisine,
      ...recipe.tags,
      ...recipe.ingredients.map((i) => i.name),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const scored = filtered.map((recipe) => scoreRecipe(recipe, pantry));

  scored.sort((a, b) => {
    if (hasPantry) {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (b.matched.length !== a.matched.length) {
        return b.matched.length - a.matched.length;
      }
      return a.missing.length - b.missing.length;
    }
    return a.recipe.title.localeCompare(b.recipe.title);
  });

  return scored;
}

/**
 * Pull every unique non-staple ingredient name out of the corpus so we can
 * power autocomplete suggestions in the pantry input.
 */
export function getIngredientCatalog(recipes: Recipe[]): string[] {
  const set = new Set<string>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      if (!ingredient.staple) set.add(ingredient.name);
    }
  }
  return Array.from(set).sort();
}

export function formatTotalTime(recipe: Recipe): string {
  const total = recipe.prepMinutes + recipe.cookMinutes;
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
