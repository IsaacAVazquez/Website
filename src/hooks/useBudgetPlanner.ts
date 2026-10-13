"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUDGET_PLANNER_STORAGE_KEY,
  calculateBudgetSummary,
  createBudgetCategory,
  createBudgetExpense,
  createBudgetMonth,
  ensureBudgetMonth,
  isDateInBudgetMonth,
  loadBudgetMonths,
  parseBudgetMonths,
  saveBudgetMonths,
} from "@/lib/budgetPlanner";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import { roundTo } from "@/lib/utils";
import type { BudgetExpense, BudgetMonth, BudgetMonthMap } from "@/types/budget";

interface ExpenseDraftInput {
  categoryId: string;
  amount: number;
  date: string;
  note: string;
}

function roundAmount(value: number) {
  return Number.isFinite(value) ? Math.max(0, roundTo(value, 2)) : 0;
}

/**
 * `currentMonthKey` is the visitor's own month. The page reads it after
 * mount, so it is empty on the server and during hydration. The planner opens
 * on it once it is known and then stays put until the visitor picks another
 * month, so the clock passing midnight on the 1st never moves an open page.
 */
export function useBudgetPlanner(currentMonthKey: string) {
  const [activeMonthKey, setActiveMonthKey] = useState(currentMonthKey);
  if (!activeMonthKey && currentMonthKey) setActiveMonthKey(currentMonthKey);

  const storedMonthsSnapshot = useLocalStorageString(BUDGET_PLANNER_STORAGE_KEY, "{}");
  const months = useMemo(
    () => ensureBudgetMonth(parseBudgetMonths(storedMonthsSnapshot), activeMonthKey),
    [activeMonthKey, storedMonthsSnapshot]
  );

  useEffect(() => {
    const storedMonths = loadBudgetMonths();
    const nextMonths = ensureBudgetMonth(storedMonths, activeMonthKey);

    if (nextMonths !== storedMonths) {
      saveBudgetMonths(nextMonths);
    }
  }, [activeMonthKey]);

  const activeMonth = months[activeMonthKey] ?? createBudgetMonth(activeMonthKey);
  const summary = useMemo(() => calculateBudgetSummary(activeMonth), [activeMonth]);

  function updateActiveMonth(updater: (month: BudgetMonth) => BudgetMonth) {
    const currentMonths = ensureBudgetMonth(loadBudgetMonths(), activeMonthKey);
    const baseMonth = currentMonths[activeMonthKey] ?? createBudgetMonth(activeMonthKey);
    const nextMonths: BudgetMonthMap = {
      ...currentMonths,
      [activeMonthKey]: updater(baseMonth),
    };

    saveBudgetMonths(nextMonths);
  }

  function selectMonth(monthKey: string) {
    const nextMonths = ensureBudgetMonth(loadBudgetMonths(), monthKey);
    saveBudgetMonths(nextMonths);
    setActiveMonthKey(monthKey);
  }

  function updateIncome(value: number) {
    updateActiveMonth((month) => ({
      ...month,
      income: roundAmount(value),
    }));
  }

  function updateSavingsTarget(value: number) {
    updateActiveMonth((month) => ({
      ...month,
      savingsTarget: roundAmount(value),
    }));
  }

  function addCategory(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    updateActiveMonth((month) => ({
      ...month,
      categories: [...month.categories, createBudgetCategory(trimmedName)],
    }));
  }

  function renameCategory(categoryId: string, nextName: string) {
    updateActiveMonth((month) => ({
      ...month,
      categories: month.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: nextName,
            }
          : category
      ),
    }));
  }

  function updateCategoryBudget(categoryId: string, nextBudget: number) {
    updateActiveMonth((month) => ({
      ...month,
      categories: month.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              budgetedAmount: roundAmount(nextBudget),
            }
          : category
      ),
    }));
  }

  function removeCategory(categoryId: string) {
    updateActiveMonth((month) => ({
      ...month,
      categories: month.categories.filter((category) => category.id !== categoryId),
    }));
  }

  // An expense dated outside the active month would count against this
  // month's balance and export while its own month never saw it.
  function addExpense(draft: ExpenseDraftInput) {
    if (!isDateInBudgetMonth(draft.date, activeMonthKey)) return;

    updateActiveMonth((month) => ({
      ...month,
      expenses: [...month.expenses, createBudgetExpense(draft)],
    }));
  }

  function updateExpense(expenseId: string, draft: ExpenseDraftInput) {
    if (!isDateInBudgetMonth(draft.date, activeMonthKey)) return;

    updateActiveMonth((month) => ({
      ...month,
      expenses: month.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              categoryId: draft.categoryId,
              amount: roundAmount(draft.amount),
              date: draft.date,
              note: draft.note.trim(),
            }
          : expense
      ),
    }));
  }

  function removeExpense(expenseId: string) {
    updateActiveMonth((month) => ({
      ...month,
      expenses: month.expenses.filter((expense) => expense.id !== expenseId),
    }));
  }

  function findExpense(expenseId: string): BudgetExpense | undefined {
    return activeMonth.expenses.find((expense) => expense.id === expenseId);
  }

  function clearMonth() {
    updateActiveMonth(() => createBudgetMonth(activeMonthKey));
  }

  return {
    activeMonth,
    activeMonthKey,
    summary,
    selectMonth,
    updateIncome,
    updateSavingsTarget,
    addCategory,
    renameCategory,
    updateCategoryBudget,
    removeCategory,
    addExpense,
    updateExpense,
    removeExpense,
    findExpense,
    clearMonth,
  };
}
