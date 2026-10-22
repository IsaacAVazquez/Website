import { RECIPES } from "@/data/recipesSnapshot";
import { isLocalDateKey } from "./date-formatters";
import { normalizeIngredient, scoreRecipe } from "./recipes";

export const RECIPE_PLAN_KEY = "recipe-finder-plan-v1";
export interface PlannedMeal {
  id: string;
  recipeId: string;
  date: string;
}
export interface RecipePlan {
  favorites: string[];
  meals: PlannedMeal[];
}
export const recipeMap = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));
export function parseRecipePlan(raw: string): RecipePlan {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object")
      return { favorites: [], meals: [] };
    const favorites = Array.isArray(value.favorites)
      ? [
          ...new Set<string>(
            value.favorites.filter(
              (id: unknown): id is string =>
                typeof id === "string" && recipeMap.has(id),
            ),
          ),
        ]
      : [];
    const seen = new Set<string>();
    const meals: PlannedMeal[] = Array.isArray(value.meals)
      ? value.meals
          .filter((meal: PlannedMeal) => {
            if (
              !meal ||
              typeof meal.id !== "string" ||
              !meal.id ||
              meal.id.length > 100 ||
              seen.has(meal.id) ||
              !recipeMap.has(meal.recipeId) ||
              !isLocalDateKey(meal.date)
            )
              return false;
            seen.add(meal.id);
            return true;
          })
          .slice(0, 366)
          .map(({ id, recipeId, date }: PlannedMeal) => ({
            id,
            recipeId,
            date,
          }))
      : [];
    return { favorites, meals };
  } catch {
    return { favorites: [], meals: [] };
  }
}
export function weekDates(start: string): string[] {
  if (!isLocalDateKey(start)) return [];
  const date = new Date(`${start}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}
export function shoppingList(meals: PlannedMeal[], pantry: string[]) {
  const grouped = new Map<
    string,
    { name: string; uses: { mealId: string; recipe: string; amount: string }[] }
  >();
  for (const meal of meals) {
    const recipe = recipeMap.get(meal.recipeId);
    if (!recipe) continue;
    for (const ingredient of scoreRecipe(recipe, pantry).missing) {
      const name = normalizeIngredient(ingredient.name);
      const row = grouped.get(name) ?? { name, uses: [] };
      row.uses.push({
        mealId: meal.id,
        recipe: recipe.title,
        amount: ingredient.display,
      });
      grouped.set(name, row);
    }
  }
  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
}
