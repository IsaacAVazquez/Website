"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUDGET_PLANNER_STORAGE_KEY,
  calculateBudgetSummary,
  createBudgetCategory,
  createBudgetExpense,
  createBudgetMonth,
  ensureBudgetMonth,
  getCurrentBudgetMonthKey,
  loadBudgetMonths,
  parseBudgetMonths,
  saveBudgetMonths,
} from "@/lib/budgetPlanner";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import type { BudgetExpense, BudgetMonth, BudgetMonthMap } from "@/types/budget";

interface ExpenseDraftInput {
  categoryId: string;
  amount: number;
  date: string;
  note: string;
}

function roundAmount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

export function useBudgetPlanner(initialMonthKey = getCurrentBudgetMonthKey()) {
  const [activeMonthKey, setActiveMonthKey] = useState(initialMonthKey);
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

  function addExpense(draft: ExpenseDraftInput) {
    updateActiveMonth((month) => ({
      ...month,
      expenses: [...month.expenses, createBudgetExpense(draft)],
    }));
  }

  function updateExpense(expenseId: string, draft: ExpenseDraftInput) {
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
