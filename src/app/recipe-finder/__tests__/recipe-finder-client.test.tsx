import { fireEvent, render, screen, within } from "@testing-library/react";
import { RecipeFinderClient } from "../recipe-finder-client";

describe("RecipeFinderClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the searchable recipe workspace and default recipe count", () => {
    render(<RecipeFinderClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Recipe Finder" })).toBeVisible();
    expect(screen.getByRole("tab", { name: /all recipes/i, selected: true })).toBeVisible();
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

  it("filters by search, view, meal, diet, and opens recipe detail", () => {
    render(<RecipeFinderClient />);

    fireEvent.change(within(screen.getByLabelText("Search recipes")).getByRole("searchbox"), {
      target: { value: "chicken" },
    });
    expect(screen.getByLabelText("Matching recipes")).toHaveTextContent(/chicken/i);

    fireEvent.click(screen.getByRole("tab", { name: /quick wins/i }));
    expect(screen.getByRole("tab", { name: /quick wins/i, selected: true })).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: /dinner/i }));
    expect(screen.getByRole("tab", { name: /dinner/i, selected: true })).toBeVisible();

    fireEvent.change(screen.getByLabelText("Filter by diet"), {
      target: { value: "high-protein" },
    });

    fireEvent.click(screen.getByRole("tab", { name: /vegetarian/i }));
    expect(screen.getByLabelText("Filter by diet")).toBeDisabled();
    expect(
      screen.getByText(/Vegetarian view is active/i)
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: /all recipes/i }));
    const firstRecipeButton = within(screen.getByLabelText("Matching recipes")).getAllByRole(
      "button"
    )[0];
    fireEvent.click(firstRecipeButton);
    expect(firstRecipeButton).toHaveAttribute("aria-expanded", "true");
  });
});
