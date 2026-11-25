import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { RECIPES } from "@/data/recipesSnapshot";
import { downloadFile } from "@/lib/downloadFile";
import type { RecipePlan } from "@/lib/recipePlan";
import { RecipeMealPlan } from "../RecipeMealPlan";

jest.mock("@/lib/downloadFile", () => ({ downloadFile: jest.fn() }));

const RECIPE = RECIPES.find((recipe) => recipe.id === "fluffy-pancakes")!;
const TODAY = "2026-11-10";

function Harness({ initial, pantry = [] }: { initial?: RecipePlan; pantry?: string[] }) {
  const [plan, setPlan] = useState<RecipePlan>(initial ?? { favorites: [], meals: [] });
  return (
    <RecipeMealPlan
      plan={plan}
      update={(edit) => {
        const next = edit(plan);
        setPlan(next);
        return next;
      }}
      pantry={pantry}
      selectedId={RECIPE.id}
      onSelect={() => {}}
    />
  );
}

const status = () => screen.getByRole("status");

describe("RecipeMealPlan", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(`${TODAY}T12:00:00`) });
    jest.mocked(downloadFile).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("plans a meal for today, lists what to buy, and removes the meal again", () => {
    render(<Harness pantry={["flour"]} />);
    expect(screen.getByText("No meals planned for this week.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Add meal" }));
    expect(status()).toHaveTextContent("Meal added to the plan.");
    expect(screen.getByText(`${TODAY} · ${RECIPE.title}`)).toBeVisible();

    // The pantry's flour and the recipe's staples stay off the list.
    const list = document.querySelector(".rf-shopping") as HTMLElement;
    expect(within(list).getByText("buttermilk")).toBeVisible();
    expect(within(list).queryByText("flour")).toBeNull();
    expect(within(list).queryByText("salt")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Download shopping list" }));
    expect(downloadFile).toHaveBeenCalledWith(
      "shopping-list.txt",
      expect.stringContaining(`buttermilk\n  1 3/4 cups buttermilk (${RECIPE.title})`),
    );

    fireEvent.click(screen.getByRole("button", { name: `Remove ${RECIPE.title} on ${TODAY}` }));
    expect(screen.getByText("No meals planned for this week.")).toBeVisible();
    expect(screen.getByText("Add a meal to build your shopping list.")).toBeVisible();
  });

  it("refuses a date outside the selected week", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Meal date"), { target: { value: "2026-12-25" } });
    // Submitted directly, since the field's own min and max would stop a click.
    fireEvent.submit(screen.getByRole("button", { name: "Add meal" }).closest("form")!);
    expect(status()).toHaveTextContent("Choose a date in the selected week.");
    expect(screen.getByText("No meals planned for this week.")).toBeVisible();
  });

  it("refuses another meal once the plan holds 366", () => {
    const meals = Array.from({ length: 366 }, (_, index) => ({
      id: `meal-${index}`,
      recipeId: RECIPE.id,
      date: "2026-01-01",
    }));
    render(<Harness initial={{ favorites: [], meals }} />);
    fireEvent.click(screen.getByRole("button", { name: "Add meal" }));
    expect(status()).toHaveTextContent("Remove an older meal before adding another.");
  });

  it("lists saved recipes first in the recipe select", () => {
    const saved = RECIPES[RECIPES.length - 1];
    render(<Harness initial={{ favorites: [saved.id], meals: [] }} />);
    const options = within(screen.getByLabelText("Recipe to plan")).getAllByRole("option");
    expect(options[0]).toHaveTextContent(`${saved.title} (saved)`);
  });
});
