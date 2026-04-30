import type { HTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import BudgetPlannerPage from "../page";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

describe("BudgetPlannerPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the main budgeting sections", () => {
    render(<BudgetPlannerPage />);

    expect(screen.getByRole("heading", { name: "Budget Planner" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Income" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Categories" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Expenses ledger" })).toBeVisible();
  });
});
