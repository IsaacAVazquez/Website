import { copyBudgetPlan, recordRecurringExpenses, calculateBudgetSummary, parseBudgetMonths } from "@/lib/budgetPlanner";
import type { BudgetMonth } from "@/types/budget";

const previous: BudgetMonth = {
  monthKey: "2026-10", income: 3000, savingsTarget: 300,
  categories: [
    { id: "food", name: "Food", budgetedAmount: 400, carryForward: true },
    { id: "fun", name: "Fun", budgetedAmount: 100, carryForward: true },
  ],
  expenses: [
    { id: "a", categoryId: "food", amount: 250, date: "2026-10-03", note: "" },
    { id: "b", categoryId: "fun", amount: 140, date: "2026-10-04", note: "" },
  ],
  recurringExpenses: [{ id: "bill", categoryId: "food", amount: 25, day: 31, note: "Delivery" }],
};

it("copies allocations and only positive selected balances without copying expenses", () => {
  const next = copyBudgetPlan(previous, "2026-11");
  expect(next.expenses).toEqual([]);
  expect(next.categories[0]).toMatchObject({ budgetedAmount: 400, carriedAmount: 150 });
  expect(next.categories[1].carriedAmount).toBe(0);
  const summary = calculateBudgetSummary(next);
  expect(summary.availableToBudget).toBe(2850);
  expect(summary.budgetedTotal).toBe(650);
  expect(summary.categorySummaries.find(c => c.id === "food")?.remaining).toBe(550);
});

it("records each recurring bill once and clamps its date to the month's last day", () => {
  const month = copyBudgetPlan(previous, "2026-02");
  const recorded = recordRecurringExpenses(month);
  expect(recorded.expenses).toHaveLength(1);
  expect(recorded.expenses[0]).toMatchObject({ recurringId: "bill", amount: 25, date: "2026-02-28" });
  expect(recordRecurringExpenses(recorded).expenses).toHaveLength(1);
});

it("restores old months and validates new stored fields", () => {
  const restored = parseBudgetMonths(JSON.stringify({ "2026-10": {
    ...previous,
    categories: [{ id: "food", name: "Food", budgetedAmount: 400, carryForward: "true", carriedAmount: -40 }],
    recurringExpenses: [{ id: "bad", categoryId: "missing", amount: 20, day: 1 }],
  } }))["2026-10"];
  expect(restored.categories[0]).toMatchObject({ carryForward: false, carriedAmount: 0 });
  expect(restored.recurringExpenses).toEqual([]);
});
