import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { RecipeFinderClient } from "../recipe-finder-client";

const PANTRY_KEY = "recipe-finder:pantry:v1";

describe("RecipeFinderClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("restores only clean strings from a damaged store and picks up another tab's pantry", () => {
    window.localStorage.setItem(PANTRY_KEY, JSON.stringify(["  Egg ", 7, "", "egg", "x".repeat(80)]));
    render(<RecipeFinderClient />);

    expect(screen.getByRole("button", { name: "Remove egg" })).toBeVisible();
    expect(screen.getByRole("button", { name: `Remove ${"x".repeat(60)}` })).toBeVisible();
    expect(screen.getAllByRole("button", { name: /^Remove / })).toHaveLength(2);

    const payload = JSON.stringify(["lemon"]);
    window.localStorage.setItem(PANTRY_KEY, payload);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: PANTRY_KEY, newValue: payload }));
    });
    expect(screen.getByRole("button", { name: "Remove lemon" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Remove egg" })).not.toBeInTheDocument();
  });

  it("renders the searchable recipe workspace and default recipe count", () => {
    render(<RecipeFinderClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Recipe Finder" })).toBeVisible();
    expect(screen.getByRole("button", { name: /all recipes/i, pressed: true })).toBeVisible();
    expect(screen.getByLabelText("Matching recipes")).toBeVisible();
    expect(screen.getByText(/ingredient[s]? in pantry/i)).toBeVisible();
  });

  it("adds, persists, removes, and clears pantry ingredients", () => {
    render(<RecipeFinderClient />);

    fireEvent.change(screen.getByLabelText("Add an ingredient"), {
      target: { value: "Tomato" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));

    expect(screen.getByRole("button", { name: "Remove tomato" })).toBeVisible();
    expect(window.localStorage.getItem("recipe-finder:pantry:v1")).toBe(
      JSON.stringify(["tomato"])
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove tomato" }));
    expect(screen.queryByRole("button", { name: "Remove tomato" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^\+ chicken breast$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^\+ rice$/i }));
    expect(screen.getByLabelText("Pantry ingredients")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.queryByLabelText("Pantry ingredients")).not.toBeInTheDocument();
  });

  it("splits pasted ingredient lists and keeps input focus after pantry actions", async () => {
    const user = userEvent.setup();
    render(<RecipeFinderClient />);
    const input = screen.getByLabelText("Add an ingredient");
    fireEvent.change(input, { target: { value: "Chicken, lemon, CHICKEN, , " } });
    await user.click(screen.getByRole("button", { name: "Add ingredient" }));
    expect(window.localStorage.getItem("recipe-finder:pantry:v1")).toBe(JSON.stringify(["chicken", "lemon"]));
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "tom" } });
    await user.click(screen.getByRole("button", { name: "tomato" }));
    expect(screen.getByRole("button", { name: "Remove tomato" })).toBeVisible();
    expect(input).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Remove tomato" }));
    expect(input).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveFocus();
    expect(screen.queryByLabelText("Pantry ingredients")).not.toBeInTheDocument();
  });

  it("filters by search, view, meal, diet, and opens recipe detail", () => {
    render(<RecipeFinderClient />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search recipes" }), {
      target: { value: "chicken" },
    });
    expect(screen.getByLabelText("Matching recipes")).toHaveTextContent(/chicken/i);

    fireEvent.click(screen.getByRole("button", { name: /quick wins/i }));
    expect(screen.getByRole("button", { name: /quick wins/i, pressed: true })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /dinner/i }));
    expect(screen.getByRole("button", { name: /dinner/i, pressed: true })).toBeVisible();

    fireEvent.change(screen.getByLabelText("Filter by diet"), {
      target: { value: "high-protein" },
    });

    fireEvent.click(screen.getByRole("button", { name: /vegetarian/i }));
    expect(screen.getByLabelText("Filter by diet")).toBeDisabled();
    expect(
      screen.getByText(/Vegetarian view is active/i)
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /all recipes/i }));
    const firstRecipeButton = within(screen.getByLabelText("Matching recipes")).getAllByRole(
      "button"
    )[0];
    fireEvent.click(firstRecipeButton);
    expect(firstRecipeButton).toHaveAttribute("aria-expanded", "true");
  });

  it("prints each recipe card once, so its steps toggle controls one unique panel", () => {
    window.localStorage.setItem("recipe-finder:pantry:v1", JSON.stringify(["egg", "spinach", "tomato", "onion"]));
    const { container } = render(<RecipeFinderClient />);

    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);

    const titles = [...container.querySelectorAll("article h3")].map((node) => node.textContent);
    expect(titles.filter((title, index) => titles.indexOf(title) !== index)).toEqual([]);
  });

  // The summary line's count has to agree with the lines the opened card ticks.
  function expectFirstCardCountMatchesItsDetail() {
    const list = screen.getByLabelText("Matching recipes");
    // A compact match prints no ingredient list until it is selected.
    expect(within(list).queryByRole("list")).not.toBeInTheDocument();

    const card = within(list).getAllByRole("article")[0];
    const title = within(card).getByRole("heading", { level: 3 }).textContent;
    const summary = within(card).getByText(/^(Missing \d+ of \d+ ingredients|You have every ingredient)$/).textContent!;
    const [need, total] = summary.startsWith("Missing") ? summary.match(/\d+/g)!.map(Number) : [0, null];

    fireEvent.click(within(card).getByRole("button", { name: "Ingredients and steps" }));
    const ingredients = within(card).getByLabelText(`Ingredients for ${title}`);
    expect(ingredients.querySelectorAll('[data-have="false"]')).toHaveLength(need as number);
    if (total !== null) expect(ingredients.querySelectorAll("li")).toHaveLength(total);
    // Only the selected recipe prints its ingredients and its steps.
    expect(within(list).getAllByRole("list")).toHaveLength(2);

    fireEvent.click(within(card).getByRole("button", { name: "Hide ingredients and steps" }));
    expect(within(list).queryByRole("list")).not.toBeInTheDocument();
    return need as number;
  }

  it("lists compact matches on a first visit and opens the selected recipe in place", () => {
    render(<RecipeFinderClient />);
    expect(expectFirstCardCountMatchesItsDetail()).toBeGreaterThan(0);
  });

  it("counts missing ingredients against a saved pantry on a return visit", () => {
    window.localStorage.setItem("recipe-finder:pantry:v1", JSON.stringify(["egg", "spinach", "tomato", "onion"]));
    render(<RecipeFinderClient />);
    expect(screen.getByRole("button", { name: "Remove spinach" })).toBeVisible();
    expectFirstCardCountMatchesItsDetail();
  });

  it("prompts for pantry items when the pantry view has nothing to suggest", () => {
    render(<RecipeFinderClient />);

    fireEvent.click(screen.getByRole("button", { name: /suggested by pantry/i }));
    expect(screen.getByText(/your pantry shelf is empty/i)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Show all recipes" }));
    expect(screen.getByRole("button", { name: /all recipes/i, pressed: true })).toBeVisible();
    expect(screen.getByLabelText("Matching recipes")).toBeVisible();
  });
});
