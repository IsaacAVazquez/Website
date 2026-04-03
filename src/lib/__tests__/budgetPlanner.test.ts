import {
  calculateBudgetSummary,
  ensureBudgetMonth,
  parseBudgetMonths,
} from "@/lib/budgetPlanner";
import type { BudgetMonth } from "@/types/budget";

describe("budgetPlanner helpers", () => {
  it("computes totals, remaining budget, and category rollups", () => {
    const month: BudgetMonth = {
      monthKey: "2026-04",
      income: 6200,
      savingsTarget: 1200,
      categories: [
        { id: "housing", name: "Housing", budgetedAmount: 1800 },
        { id: "groceries", name: "Groceries", budgetedAmount: 500 },
        { id: "fun", name: "Fun", budgetedAmount: 300 },
      ],
      expenses: [
        { id: "rent", categoryId: "housing", amount: 1800, date: "2026-04-01", note: "Rent" },
        {
          id: "market-1",
          categoryId: "groceries",
          amount: 125.35,
          date: "2026-04-05",
          note: "Groceries",
        },
        {
          id: "market-2",
          categoryId: "groceries",
          amount: 74.65,
          date: "2026-04-18",
          note: "Restock",
        },
      ],
    };

    const summary = calculateBudgetSummary(month);

    expect(summary.availableToBudget).toBe(5000);
    expect(summary.budgetedTotal).toBe(2600);
    expect(summary.remainingToBudget).toBe(2400);
    expect(summary.spentTotal).toBe(2000);
    expect(summary.remainingToSpend).toBe(3000);

    const groceries = summary.categorySummaries.find((category) => category.id === "groceries");
    expect(groceries).toMatchObject({
      spent: 200,
      remaining: 300,
      overBudget: false,
      expenseCount: 2,
    });
    expect(summary.recentExpenses[0]).toMatchObject({
      note: "Restock",
      categoryName: "Groceries",
      amount: 74.65,
    });
  });

  it("flags over-budget categories and seeds missing months from storage", () => {
    const stored = JSON.stringify({
      "2026-04": {
        monthKey: "2026-04",
        income: 4000,
        savingsTarget: 500,
        categories: [
          { id: "travel", name: "Travel", budgetedAmount: 200 },
        ],
        expenses: [
          { id: "flight", categoryId: "travel", amount: 450, date: "2026-04-22", note: "Flight" },
        ],
      },
      broken: {
        nope: true,
      },
    });

    const months = ensureBudgetMonth(parseBudgetMonths(stored), "2026-05");
    const aprilSummary = calculateBudgetSummary(months["2026-04"]);

    expect(aprilSummary.categorySummaries[0]).toMatchObject({
      id: "travel",
      spent: 450,
      remaining: -250,
      overBudget: true,
    });
    expect(months["2026-05"]).toBeDefined();
    expect(months["2026-05"].categories.length).toBeGreaterThan(1);
  });
});
