import { act, renderHook } from "@testing-library/react";
import {
  BUDGET_PLANNER_STORAGE_KEY,
  parseBudgetMonths,
} from "@/lib/budgetPlanner";
import { useBudgetPlanner } from "../useBudgetPlanner";

const MONTH_KEY = "2026-06";
const OTHER_MONTH_KEY = "2026-07";

function readStoredMonths() {
  return parseBudgetMonths(window.localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY));
}

describe("useBudgetPlanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("seeds the active month with default categories and persists it", () => {
    const { result } = renderHook(() => useBudgetPlanner(MONTH_KEY));

    expect(result.current.activeMonthKey).toBe(MONTH_KEY);
    expect(result.current.activeMonth.monthKey).toBe(MONTH_KEY);
    expect(result.current.activeMonth.categories.length).toBeGreaterThan(0);
    expect(result.current.activeMonth.expenses).toHaveLength(0);

    const stored = readStoredMonths();
    expect(stored[MONTH_KEY]).toBeDefined();
    expect(stored[MONTH_KEY].monthKey).toBe(MONTH_KEY);
  });

  it("updates income and savings target, reflecting in summary and storage", () => {
    const { result } = renderHook(() => useBudgetPlanner(MONTH_KEY));

    act(() => {
      result.current.updateIncome(5000);
      result.current.updateSavingsTarget(1000);
    });

    expect(result.current.activeMonth.income).toBe(5000);
    expect(result.current.activeMonth.savingsTarget).toBe(1000);
    expect(result.current.summary.availableToBudget).toBe(4000);

    const stored = readStoredMonths();
    expect(stored[MONTH_KEY].income).toBe(5000);
    expect(stored[MONTH_KEY].savingsTarget).toBe(1000);
  });

  it("adds, updates the budget of, and removes a category", () => {
    const { result } = renderHook(() => useBudgetPlanner(MONTH_KEY));

    const initialCount = result.current.activeMonth.categories.length;

    act(() => {
      result.current.addCategory("Travel Fund");
    });

    expect(result.current.activeMonth.categories).toHaveLength(initialCount + 1);
    const added = result.current.activeMonth.categories.find(
      (category) => category.name === "Travel Fund"
    );
    expect(added).toBeDefined();
    const categoryId = added!.id;

    act(() => {
      result.current.updateCategoryBudget(categoryId, 250);
    });
    expect(
      result.current.activeMonth.categories.find((c) => c.id === categoryId)
        ?.budgetedAmount
    ).toBe(250);

    act(() => {
      result.current.renameCategory(categoryId, "Vacation");
    });
    expect(
      result.current.activeMonth.categories.find((c) => c.id === categoryId)?.name
    ).toBe("Vacation");

    // Budgeted total in summary should reflect the new category budget.
    expect(result.current.summary.budgetedTotal).toBeGreaterThanOrEqual(250);

    act(() => {
      result.current.removeCategory(categoryId);
    });
    expect(
      result.current.activeMonth.categories.find((c) => c.id === categoryId)
    ).toBeUndefined();

    // Ignores blank category names.
    const countBeforeBlank = result.current.activeMonth.categories.length;
    act(() => {
      result.current.addCategory("   ");
    });
    expect(result.current.activeMonth.categories).toHaveLength(countBeforeBlank);
  });

  it("adds, updates, finds, and removes expenses with derived totals", () => {
    const { result } = renderHook(() => useBudgetPlanner(MONTH_KEY));

    const categoryId = result.current.activeMonth.categories[0].id;

    act(() => {
      result.current.addExpense({
        categoryId,
        amount: 42.5,
        date: `${MONTH_KEY}-05`,
        note: "Lunch",
      });
    });

    expect(result.current.activeMonth.expenses).toHaveLength(1);
    expect(result.current.summary.spentTotal).toBe(42.5);

    const expenseId = result.current.activeMonth.expenses[0].id;
    expect(result.current.findExpense(expenseId)?.note).toBe("Lunch");

    act(() => {
      result.current.updateExpense(expenseId, {
        categoryId,
        amount: 60,
        date: `${MONTH_KEY}-06`,
        note: "  Dinner  ",
      });
    });

    expect(result.current.findExpense(expenseId)?.amount).toBe(60);
    expect(result.current.findExpense(expenseId)?.note).toBe("Dinner");
    expect(result.current.summary.spentTotal).toBe(60);

    // Persistence check.
    const stored = readStoredMonths();
    expect(stored[MONTH_KEY].expenses).toHaveLength(1);
    expect(stored[MONTH_KEY].expenses[0].amount).toBe(60);

    act(() => {
      result.current.removeExpense(expenseId);
    });

    expect(result.current.activeMonth.expenses).toHaveLength(0);
    expect(result.current.summary.spentTotal).toBe(0);
    expect(readStoredMonths()[MONTH_KEY].expenses).toHaveLength(0);
  });

  it("isolates state per month when switching months", () => {
    const { result } = renderHook(() => useBudgetPlanner(MONTH_KEY));

    act(() => {
      result.current.updateIncome(3000);
    });
    expect(result.current.activeMonth.income).toBe(3000);

    act(() => {
      result.current.selectMonth(OTHER_MONTH_KEY);
    });

    expect(result.current.activeMonthKey).toBe(OTHER_MONTH_KEY);
    expect(result.current.activeMonth.monthKey).toBe(OTHER_MONTH_KEY);
    // The new month starts fresh, not inheriting the prior month's income.
    expect(result.current.activeMonth.income).toBe(0);

    act(() => {
      result.current.updateIncome(7777);
    });
    expect(result.current.activeMonth.income).toBe(7777);

    // Switch back: the original month retained its own state.
    act(() => {
      result.current.selectMonth(MONTH_KEY);
    });
    expect(result.current.activeMonth.income).toBe(3000);

    // Both months persisted independently.
    const stored = readStoredMonths();
    expect(stored[MONTH_KEY].income).toBe(3000);
    expect(stored[OTHER_MONTH_KEY].income).toBe(7777);
  });

  it("clamps negative income to zero", () => {
    const { result } = renderHook(() => useBudgetPlanner(MONTH_KEY));

    act(() => {
      result.current.updateIncome(-500);
    });

    expect(result.current.activeMonth.income).toBe(0);
  });
});
