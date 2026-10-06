import { render, screen } from "@testing-library/react";
import BudgetPlannerPage from "../page";

describe("BudgetPlannerPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the main budgeting sections", () => {
    render(<BudgetPlannerPage />);

    expect(screen.getByRole("heading", { name: "Budget Planner" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Month and income" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Categories" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Expenses ledger" })).toBeVisible();
  });
});
