import { parseRecipePlan, shoppingList, weekDates } from "../recipePlan";
import { RECIPES } from "@/data/recipesSnapshot";

it("rejects unknown recipes and impossible calendar dates", () => {
  const value = parseRecipePlan(
    JSON.stringify({
      favorites: [RECIPES[0].id, "missing"],
      meals: [{ id: "one", recipeId: RECIPES[0].id, date: "2026-02-30" }],
    }),
  );
  expect(value.favorites).toEqual([RECIPES[0].id]);
  expect(value.meals).toEqual([]);
});
it("uses seven calendar dates across year boundaries", () => {
  expect(weekDates("2026-12-28")).toEqual([
    "2026-12-28",
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
  ]);
});
it("groups each missing ingredient, retains per-meal quantities, and excludes pantry and staples", () => {
  const recipe = RECIPES[0];
  const meals = [
    { id: "a", recipeId: recipe.id, date: "2026-10-22" },
    { id: "b", recipeId: recipe.id, date: "2026-10-23" },
  ];
  const list = shoppingList(meals, ["bread"]);
  expect(list.some((row) => row.name === "bread" || row.name === "salt")).toBe(
    false,
  );
  expect(list.find((row) => row.name === "avocado")?.uses).toHaveLength(2);
});
