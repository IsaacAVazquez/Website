import type { HTMLAttributes } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetPlannerClient } from "../budget-planner-client";
import { BUDGET_PLANNER_STORAGE_KEY } from "@/lib/budgetPlanner";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

describe("BudgetPlannerClient", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(Date.parse("2026-04-03T16:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds the current month into localStorage on first render", async () => {
    render(<BudgetPlannerClient />);

    expect(screen.getByRole("heading", { name: "Budget Planner" })).toBeVisible();
    expect(screen.getByLabelText("Budget month")).toHaveValue("2026-04");

    await waitFor(() => {
      const stored = localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY);
      expect(stored).not.toBeNull();
    });

    const months = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) || "{}");
    expect(months["2026-04"]).toBeDefined();
    expect(months["2026-04"].categories.length).toBeGreaterThan(1);
  });

  it("hydrates saved values and seeds a new month when the selector changes", async () => {
    localStorage.setItem(
      BUDGET_PLANNER_STORAGE_KEY,
      JSON.stringify({
        "2026-04": {
          monthKey: "2026-04",
          income: 7200,
          savingsTarget: 1400,
          categories: [
            { id: "housing", name: "Housing", budgetedAmount: 2200 },
            { id: "groceries", name: "Groceries", budgetedAmount: 600 },
          ],
          expenses: [],
        },
      })
    );

    render(<BudgetPlannerClient />);

    expect(screen.getByLabelText("Monthly income")).toHaveValue(7200);
    expect(screen.getByLabelText("Savings target")).toHaveValue(1400);

    fireEvent.change(screen.getByLabelText("Budget month"), {
      target: { value: "2026-05" },
    });

    await waitFor(() => {
      expect(screen.getByText("May 2026")).toBeVisible();
    });

    const months = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) || "{}");
    expect(months["2026-05"]).toBeDefined();
    expect(months["2026-05"].categories.length).toBeGreaterThan(1);
  });

  it("supports add, rename, rebudget, and delete category flows", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BudgetPlannerClient />);

    await user.type(screen.getByLabelText("New category name"), "Travel");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    const travelNameInput = screen.getByLabelText("Category name for Travel");
    expect(travelNameInput).toBeVisible();

    fireEvent.change(screen.getByLabelText("Budget amount for Travel"), {
      target: { value: "300" },
    });

    fireEvent.change(travelNameInput, {
      target: { value: "Summer Travel" },
    });
    fireEvent.blur(travelNameInput);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Summer Travel")).toBeVisible();
    });

    const monthsAfterEdit = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) || "{}");
    const travelCategory = monthsAfterEdit["2026-04"].categories.find(
      (category: { name: string }) => category.name === "Summer Travel"
    );
    expect(travelCategory?.budgetedAmount).toBe(300);

    await user.click(screen.getByLabelText("Delete Summer Travel"));

    expect(screen.queryByLabelText("Category name for Summer Travel")).not.toBeInTheDocument();
  });

  it("supports add, edit, and delete expense flows", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BudgetPlannerClient />);

    await user.selectOptions(
      screen.getByLabelText("Expense category"),
      screen.getByRole("option", { name: "Groceries" })
    );
    await user.type(screen.getByLabelText("Expense amount"), "125.45");
    fireEvent.change(screen.getByLabelText("Expense date"), {
      target: { value: "2026-04-05" },
    });
    await user.type(screen.getByLabelText("Expense note"), "Groceries run");
    await user.click(screen.getByRole("button", { name: "Add expense" }));

    expect(screen.getAllByText("Groceries run").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$125.45").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Edit Groceries run expense" }));
    expect(screen.getByRole("button", { name: "Save expense" })).toBeVisible();

    await user.clear(screen.getByLabelText("Expense amount"));
    await user.type(screen.getByLabelText("Expense amount"), "140");
    await user.click(screen.getByRole("button", { name: "Save expense" }));

    expect(screen.getAllByText("$140").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Delete Groceries run expense" }));

    expect(screen.queryAllByText("Groceries run")).toHaveLength(0);
  });
});
