import {
  calculateBudgetSummary,
  ensureBudgetMonth,
  formatBudgetMonthLabel,
  getAdjacentBudgetMonthKey,
  getCurrentBudgetMonthKey,
  getDefaultExpenseDate,
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

  it("preserves an empty category list while repairing missing or malformed lists", () => {
    const months = parseBudgetMonths(JSON.stringify({
      "2026-04": { categories: [] },
      "2026-05": {},
      "2026-06": { categories: "invalid" },
      "2026-07": { categories: [null] },
    }));

    expect(months["2026-04"].categories).toEqual([]);
    for (const monthKey of ["2026-05", "2026-06", "2026-07"]) {
      expect(months[monthKey].categories.map((category) => category.name)).toContain("Housing");
    }
  });
});

// The "current month" and "default expense day" pin to the display zone
// (America/Los_Angeles) instead of the runtime's own zone, so a UTC server
// and a visitor's browser agree on the same calendar day near midnight and
// the same calendar month near month end. These assert against explicit ISO
// instants and must pass under both TZ=UTC and TZ=Asia/Tokyo.
describe("budget month/day pinning", () => {
  it("resolves the current month key from the display zone, not the runtime zone", () => {
    // 2026-10-01T00:00:00Z is still Sep 30 in America/Los_Angeles (PDT, UTC-7).
    expect(getCurrentBudgetMonthKey(new Date("2026-10-01T00:00:00.000Z"))).toBe("2026-09");
    // 2026-10-01T08:00:00Z is Oct 1, 1am in Los Angeles.
    expect(getCurrentBudgetMonthKey(new Date("2026-10-01T08:00:00.000Z"))).toBe("2026-10");
  });

  it("resolves the default expense day from the display zone", () => {
    expect(getDefaultExpenseDate("2026-09", new Date("2026-10-01T00:00:00.000Z"))).toBe(
      "2026-09-30"
    );
    expect(getDefaultExpenseDate("2026-10", new Date("2026-10-01T00:00:00.000Z"))).toBe(
      "2026-10-01"
    );
  });

  it("steps a month key forward and backward with pure arithmetic, including year rollover", () => {
    expect(getAdjacentBudgetMonthKey("2026-04", 1)).toBe("2026-05");
    expect(getAdjacentBudgetMonthKey("2026-04", -1)).toBe("2026-03");
    expect(getAdjacentBudgetMonthKey("2026-01", -1)).toBe("2025-12");
    expect(getAdjacentBudgetMonthKey("2026-12", 1)).toBe("2027-01");
  });

  it("formats a month key's label the same regardless of runtime zone", () => {
    expect(formatBudgetMonthLabel("2026-09")).toBe("September 2026");
  });
});
