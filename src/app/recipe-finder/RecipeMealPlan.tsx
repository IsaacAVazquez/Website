"use client";

import { useState } from "react";
import { RECIPES } from "@/data/recipesSnapshot";
import { useClientNow } from "@/hooks/useClientNow";
import { toLocalDateKey } from "@/lib/date-formatters";
import { shoppingList, weekDates, type RecipePlan } from "@/lib/recipePlan";
import { downloadFile } from "@/lib/downloadFile";

export function RecipeMealPlan({
  plan,
  update,
  pantry,
  selectedId,
  onSelect,
}: {
  plan: RecipePlan;
  update: (edit: (latest: RecipePlan) => RecipePlan) => void;
  pantry: string[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const now = useClientNow();
  const today = now ? toLocalDateKey(new Date(now)) : "";
  const [startDraft, setStartDraft] = useState("");
  const [mealDate, setMealDate] = useState("");
  const [message, setMessage] = useState("");
  const start = startDraft || today;
  const days = weekDates(start);
  const meals = plan.meals
    .filter((meal) => days.includes(meal.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const list = shoppingList(meals, pantry);
  const recipes = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));
  return (
    <section
      className="rf-plan"
      id="meal-plan"
      aria-labelledby="rf-plan-heading"
    >
      <h2 id="rf-plan-heading">Your meal plan</h2>
      <p>
        Save recipes from the cards and plan a week of meals. Each recipe makes
        its listed number of servings.
      </p>
      <label>
        Week starting
        <input
          className="rf-field"
          type="date"
          value={start}
          onChange={(event) => {
            setStartDraft(event.target.value);
            setMealDate("");
          }}
        />
      </label>
      <form
        className="rf-plan-form"
        onSubmit={(event) => {
          event.preventDefault();
          const date = mealDate || start;
          if (!days.includes(date)) {
            setMessage("Choose a date in the selected week.");
            return;
          }
          if (plan.meals.length >= 366) {
            setMessage("Remove an older meal before adding another.");
            return;
          }
          update((latest) => ({
            ...latest,
            meals: [
              ...latest.meals,
              { id: crypto.randomUUID(), date, recipeId: selectedId },
            ].slice(0, 366),
          }));
          setMessage("Meal added to the plan.");
        }}
      >
        <label>
          Recipe to plan
          <select
            className="rf-field"
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
          >
            {[...RECIPES]
              .sort(
                (a, b) =>
                  Number(plan.favorites.includes(b.id)) -
                  Number(plan.favorites.includes(a.id)),
              )
              .map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title}
                  {plan.favorites.includes(recipe.id) ? " (saved)" : ""}
                </option>
              ))}
          </select>
        </label>
        <label>
          Meal date
          <input
            className="rf-field"
            type="date"
            required
            min={days[0]}
            max={days[6]}
            value={mealDate || start}
            onChange={(event) => setMealDate(event.target.value)}
          />
        </label>
        <button type="submit" className="rf-plan-button" disabled={!start}>
          Add meal
        </button>
      </form>
      <p role="status">{message}</p>
      {meals.length ? (
        <ul className="rf-plan-meals">
          {meals.map((meal) => (
            <li key={meal.id}>
              <span>
                {meal.date} · {recipes.get(meal.recipeId)?.title}
              </span>
              <button
                type="button"
                className="rf-plan-button"
                aria-label={`Remove ${recipes.get(meal.recipeId)?.title} on ${meal.date}`}
                onClick={() =>
                  update((latest) => ({
                    ...latest,
                    meals: latest.meals.filter((entry) => entry.id !== meal.id),
                  }))
                }
              >
                Remove meal
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No meals planned for this week.</p>
      )}
      <h3>Shopping list for this week</h3>
      <p>
        Ingredients already in your pantry and recipe staples are left out.
        Amounts are listed for each meal, since the recipes use different units.
      </p>
      {list.length ? (
        <>
          <ul className="rf-shopping">
            {list.map((row) => (
              <li key={row.name}>
                {row.name}
                <ul>
                  {row.uses.map((use, index) => (
                    <li key={`${use.mealId}-${index}`}>
                      {use.amount} for {use.recipe}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="rf-plan-button"
            onClick={() =>
              downloadFile(
                "shopping-list.txt",
                list
                  .map(
                    (row) =>
                      `${row.name}\n${row.uses.map((use) => `  ${use.amount} (${use.recipe})`).join("\n")}`,
                  )
                  .join("\n\n"),
              )
            }
          >
            Download shopping list
          </button>
        </>
      ) : (
        <p>
          {meals.length
            ? "Your pantry covers the ingredients for these meals."
            : "Add a meal to build your shopping list."}
        </p>
      )}
    </section>
  );
}
