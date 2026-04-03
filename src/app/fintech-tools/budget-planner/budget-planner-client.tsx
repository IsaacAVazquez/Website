"use client";

import { type FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { WarmCard } from "@/components/ui/WarmCard";
import { getReducedMotionVariants, fadeInVariants } from "@/components/investments/animations";
import {
  formatBudgetMonthLabel,
  getAdjacentBudgetMonthKey,
  getDefaultExpenseDate,
  isBudgetMonthKey,
} from "@/lib/budgetPlanner";
import { useBudgetPlanner } from "@/hooks/useBudgetPlanner";

interface ExpenseDraft {
  categoryId: string;
  amount: string;
  date: string;
  note: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function formatSignedCurrency(value: number) {
  if (value > 0) return formatCurrency(value);
  if (value < 0) return `-${formatCurrency(Math.abs(value))}`;
  return formatCurrency(0);
}

function getBalanceTone(value: number) {
  if (value > 0) return "text-[var(--color-success)]";
  if (value < 0) return "text-[var(--color-error)]";
  return "text-[var(--text-primary)]";
}

function createEmptyExpenseDraft(monthKey: string, categoryId = ""): ExpenseDraft {
  return {
    categoryId,
    amount: "",
    date: getDefaultExpenseDate(monthKey),
    note: "",
  };
}

function parseAmountInput(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

export function BudgetPlannerClient() {
  const {
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
  } = useBudgetPlanner();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>(() =>
    createEmptyExpenseDraft(activeMonthKey)
  );
  const shouldReduceMotion = useReducedMotion();
  const motionVariants = shouldReduceMotion
    ? getReducedMotionVariants().fadeInVariants
    : fadeInVariants;
  const resolvedExpenseCategoryId = activeMonth.categories.some(
    (category) => category.id === expenseDraft.categoryId
  )
    ? expenseDraft.categoryId
    : activeMonth.categories[0]?.id ?? "";

  const topMetrics = useMemo(
    () => [
      {
        label: "Income",
        value: formatCurrency(activeMonth.income),
        tone: "text-[var(--text-primary)]",
        icon: Landmark,
      },
      {
        label: "Available to budget",
        value: formatSignedCurrency(summary.availableToBudget),
        tone: getBalanceTone(summary.availableToBudget),
        icon: Wallet,
      },
      {
        label: "Remaining to budget",
        value: formatSignedCurrency(summary.remainingToBudget),
        tone: getBalanceTone(summary.remainingToBudget),
        icon: PiggyBank,
      },
      {
        label: "Remaining to spend",
        value: formatSignedCurrency(summary.remainingToSpend),
        tone: getBalanceTone(summary.remainingToSpend),
        icon: ReceiptText,
      },
    ],
    [activeMonth.income, summary.availableToBudget, summary.remainingToBudget, summary.remainingToSpend]
  );

  function handleMonthChange(nextMonthKey: string) {
    if (!isBudgetMonthKey(nextMonthKey)) return;
    setEditingExpenseId(null);
    setExpenseDraft(
      createEmptyExpenseDraft(nextMonthKey, activeMonth.categories[0]?.id ?? "")
    );
    selectMonth(nextMonthKey);
  }

  function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    addCategory(trimmedName);
    setNewCategoryName("");
  }

  function resetExpenseDraft() {
    setEditingExpenseId(null);
    setExpenseDraft(createEmptyExpenseDraft(activeMonthKey, activeMonth.categories[0]?.id ?? ""));
  }

  function handleExpenseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!expenseDraft.categoryId) return;

    const payload = {
      categoryId: resolvedExpenseCategoryId,
      amount: parseAmountInput(expenseDraft.amount),
      date: expenseDraft.date,
      note: expenseDraft.note,
    };

    if (editingExpenseId) {
      updateExpense(editingExpenseId, payload);
    } else {
      addExpense(payload);
    }

    resetExpenseDraft();
  }

  function handleEditExpense(expenseId: string) {
    const expense = findExpense(expenseId);
    if (!expense) return;

    setEditingExpenseId(expenseId);
    setExpenseDraft({
      categoryId: expense.categoryId,
      amount: String(expense.amount),
      date: expense.date,
      note: expense.note,
    });
  }

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-primary)_11%,transparent),transparent_30%),linear-gradient(180deg,color-mix(in_srgb,var(--surface-secondary)_88%,var(--surface-primary))_0%,var(--surface-primary)_100%)]"
      aria-label="Budget planner workspace"
      data-testid="budget-planner-shell"
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12">
        <motion.div
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-elevated)_94%,var(--color-primary)_6%)_0%,var(--surface-elevated)_45%,color-mix(in_srgb,var(--surface-secondary)_88%,var(--color-success)_12%)_100%)] shadow-[var(--shadow-lg)]"
        >
          <div className="grid gap-8 border-b border-[var(--border-primary)]/80 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.25fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary)]">
                Fintech Tools
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Budget Planner
              </h1>
              <p className="mt-3 max-w-[64ch] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.98rem]">
                Plan one month at a time with an editorial-style ledger for income, savings,
                category targets, and manual expenses. Everything stays in your browser.
              </p>
            </div>

            <div className="grid gap-3 rounded-[26px] border border-[var(--border-primary)] bg-[color-mix(in_srgb,var(--surface-primary)_88%,transparent)] p-3 shadow-[var(--shadow-sm)] backdrop-blur sm:grid-cols-[auto_minmax(180px,1fr)_auto]">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, -1))}
                className="tap-target inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <label className="flex min-h-[48px] flex-col justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Budget month
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-[var(--color-primary)]" />
                  <input
                    aria-label="Budget month"
                    type="month"
                    value={activeMonthKey}
                    onChange={(event) => handleMonthChange(event.target.value)}
                    className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-[var(--text-primary)] focus-visible:rounded-md"
                  />
                </div>
              </label>

              <button
                type="button"
                aria-label="Next month"
                onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, 1))}
                className="tap-target inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 sm:px-8">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              {formatBudgetMonthLabel(activeMonthKey)}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {topMetrics.map(({ label, value, tone, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[24px] border border-[var(--border-primary)] bg-[color-mix(in_srgb,var(--surface-primary)_82%,transparent)] px-4 py-4 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      {label}
                    </p>
                    <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                  </div>
                  <p className={`mt-3 text-2xl font-semibold tracking-tight ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <motion.div variants={motionVariants} initial="hidden" animate="visible">
            <WarmCard
              padding="none"
              className="overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--color-primary)_14%,var(--border-primary))] bg-[linear-gradient(180deg,var(--surface-elevated)_0%,color-mix(in_srgb,var(--surface-secondary)_72%,var(--surface-elevated))_100%)]"
            >
              <div className="border-b border-[var(--border-primary)] px-6 py-5 sm:px-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-primary)]">
                  Planning
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Planning
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  Set income, savings, and category targets before the spending ledger fills in.
                </p>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Monthly income
                    </span>
                    <input
                      aria-label="Monthly income"
                      type="number"
                      min="0"
                      step="50"
                      value={String(activeMonth.income)}
                      onChange={(event) => updateIncome(Number(event.target.value))}
                      className="mt-2 w-full border-0 bg-transparent p-0 text-lg font-semibold text-[var(--text-primary)]"
                    />
                  </label>

                  <label className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Savings target
                    </span>
                    <input
                      aria-label="Savings target"
                      type="number"
                      min="0"
                      step="25"
                      value={String(activeMonth.savingsTarget)}
                      onChange={(event) => updateSavingsTarget(Number(event.target.value))}
                      className="mt-2 w-full border-0 bg-transparent p-0 text-lg font-semibold text-[var(--text-primary)]"
                    />
                  </label>
                </div>

                <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        Category budgets
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Rename, rebudget, or remove categories as your month evolves.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                      Budgeted total:{" "}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatCurrency(summary.budgetedTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {summary.categorySummaries.map((category) => {
                      const displayName = category.name || "Untitled";
                      const progressWidth = `${Math.min(100, Math.max(0, category.utilization * 100))}%`;
                      const hasLinkedExpenses = category.expenseCount > 0;

                      return (
                        <div
                          key={category.id}
                          className="rounded-[24px] border border-[var(--border-primary)] bg-[color-mix(in_srgb,var(--surface-secondary)_60%,var(--surface-primary))] p-4"
                        >
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end">
                            <label className="min-w-0">
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                                Category name
                              </span>
                              <input
                                aria-label={`Category name for ${displayName}`}
                                type="text"
                                value={category.name}
                                onChange={(event) =>
                                  renameCategory(category.id, event.target.value)
                                }
                                onBlur={(event) => {
                                  if (!event.target.value.trim()) {
                                    renameCategory(category.id, "Untitled");
                                  }
                                }}
                                className="mt-2 min-h-[44px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                              />
                            </label>

                            <label>
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                                Budgeted amount
                              </span>
                              <input
                                aria-label={`Budget amount for ${displayName}`}
                                type="number"
                                min="0"
                                step="25"
                                value={String(category.budgetedAmount)}
                                onChange={(event) =>
                                  updateCategoryBudget(category.id, Number(event.target.value))
                                }
                                className="mt-2 min-h-[44px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                              />
                            </label>

                            <button
                              type="button"
                              aria-label={`Delete ${displayName}`}
                              disabled={hasLinkedExpenses}
                              onClick={() => removeCategory(category.id)}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                                Spent
                              </p>
                              <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                                {formatCurrency(category.spent)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                                Remaining
                              </p>
                              <p
                                className={`mt-2 text-base font-semibold ${getBalanceTone(
                                  category.remaining
                                )}`}
                              >
                                {formatSignedCurrency(category.remaining)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[var(--surface-primary)] px-3 py-3">
                              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                                Linked expenses
                              </p>
                              <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                                {category.expenseCount}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                              <span>Spend vs budget</span>
                              <span>{Math.round(category.utilization * 100)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-primary)]">
                              <div
                                className={`h-full rounded-full ${
                                  category.overBudget
                                    ? "bg-[var(--color-error)]"
                                    : category.utilization >= 0.85
                                      ? "bg-[var(--color-warning)]"
                                      : "bg-[var(--color-primary)]"
                                }`}
                                style={{ width: progressWidth }}
                              />
                            </div>
                            {hasLinkedExpenses && (
                              <p className="mt-3 text-xs leading-6 text-[var(--text-tertiary)]">
                                Remove linked expenses before deleting this category.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleAddCategory} className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <label className="flex-1">
                      <span className="sr-only">New category name</span>
                      <input
                        aria-label="New category name"
                        type="text"
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        placeholder="Add a custom category"
                        className="min-h-[46px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-secondary)]"
                    >
                      <Plus className="h-4 w-4" />
                      Add category
                    </button>
                  </form>
                </div>
              </div>
            </WarmCard>
          </motion.div>

          <motion.div variants={motionVariants} initial="hidden" animate="visible">
            <WarmCard
              padding="none"
              className="overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--color-primary)_10%,var(--border-primary))] bg-[linear-gradient(180deg,var(--surface-elevated)_0%,color-mix(in_srgb,var(--surface-secondary)_58%,var(--surface-elevated))_100%)]"
            >
              <div className="border-b border-[var(--border-primary)] px-6 py-5 sm:px-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-primary)]">
                  Expense Ledger
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Expense Ledger
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  Track manual expenses and edit them in place when the month changes shape.
                </p>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-8">
                <form
                  onSubmit={handleExpenseSubmit}
                  className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        Expense category
                      </span>
                      <select
                        aria-label="Expense category"
                        value={resolvedExpenseCategoryId}
                        onChange={(event) =>
                          setExpenseDraft((current) => ({
                            ...current,
                            categoryId: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      >
                        {activeMonth.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name || "Untitled"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        Expense amount
                      </span>
                      <input
                        aria-label="Expense amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseDraft.amount}
                        onChange={(event) =>
                          setExpenseDraft((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        Expense date
                      </span>
                      <input
                        aria-label="Expense date"
                        type="date"
                        value={expenseDraft.date}
                        onChange={(event) =>
                          setExpenseDraft((current) => ({
                            ...current,
                            date: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        Expense note
                      </span>
                      <input
                        aria-label="Expense note"
                        type="text"
                        value={expenseDraft.note}
                        onChange={(event) =>
                          setExpenseDraft((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                        placeholder="Coffee, rent, groceries"
                        className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={
                        !resolvedExpenseCategoryId || !expenseDraft.amount || !expenseDraft.date
                      }
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      {editingExpenseId ? "Save expense" : "Add expense"}
                    </button>
                    {editingExpenseId && (
                      <button
                        type="button"
                        onClick={resetExpenseDraft}
                        className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>

                <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Entries</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {summary.expenseEntries.length} total
                    </p>
                  </div>

                  {summary.expenseEntries.length === 0 ? (
                    <div className="mt-4 rounded-[22px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-6 text-sm leading-7 text-[var(--text-secondary)]">
                      Your ledger is empty. Add the first expense to start tracking where this
                      month is going.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {summary.expenseEntries.map((expense) => (
                        <div
                          key={expense.id}
                          className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-[var(--text-primary)]">
                                {expense.note || expense.categoryName}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                                  {expense.categoryName}
                                </span>
                                <span className="rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                                  {expense.date}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-lg font-semibold text-[var(--text-primary)]">
                                {formatCurrency(expense.amount)}
                              </p>
                              <button
                                type="button"
                                aria-label={`Edit ${expense.note || expense.categoryName} expense`}
                                onClick={() => handleEditExpense(expense.id)}
                                className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${expense.note || expense.categoryName} expense`}
                                onClick={() => {
                                  removeExpense(expense.id);
                                  if (editingExpenseId === expense.id) {
                                    resetExpenseDraft();
                                  }
                                }}
                                className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </WarmCard>
          </motion.div>
        </div>

        <motion.div
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          <WarmCard
            padding="none"
            className="overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--color-primary)_10%,var(--border-primary))] bg-[linear-gradient(180deg,var(--surface-elevated)_0%,color-mix(in_srgb,var(--surface-secondary)_54%,var(--surface-elevated))_100%)]"
          >
            <div className="border-b border-[var(--border-primary)] px-6 py-5 sm:px-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Insights
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Category Insights
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                See how assigned budget, actual spend, and recent movement line up before the
                month closes.
              </p>
            </div>

            <div className="grid gap-6 px-6 py-6 sm:px-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Remaining to budget
                    </p>
                    <p className={`mt-3 text-xl font-semibold ${getBalanceTone(summary.remainingToBudget)}`}>
                      {formatSignedCurrency(summary.remainingToBudget)}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Spent so far
                    </p>
                    <p className="mt-3 text-xl font-semibold text-[var(--text-primary)]">
                      {formatCurrency(summary.spentTotal)}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Remaining to spend
                    </p>
                    <p className={`mt-3 text-xl font-semibold ${getBalanceTone(summary.remainingToSpend)}`}>
                      {formatSignedCurrency(summary.remainingToSpend)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Category Insights</h3>
                  <div className="mt-4 space-y-4">
                    {summary.categorySummaries.map((category) => (
                      <div key={category.id}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {category.name || "Untitled"}
                            </p>
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                              {formatCurrency(category.spent)} spent of {formatCurrency(category.budgetedAmount)}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold ${getBalanceTone(category.remaining)}`}>
                            {formatSignedCurrency(category.remaining)}
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                          <div
                            className={`h-full rounded-full ${
                              category.overBudget
                                ? "bg-[var(--color-error)]"
                                : category.utilization >= 0.85
                                  ? "bg-[var(--color-warning)]"
                                  : "bg-[var(--color-primary)]"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, category.utilization * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recent Activity</h3>
                {summary.recentExpenses.length === 0 ? (
                  <div className="mt-4 rounded-[22px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-6 text-sm leading-7 text-[var(--text-secondary)]">
                    Recent activity will appear here as you add expenses.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {summary.recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {expense.note || expense.categoryName}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                              {expense.categoryName} • {expense.date}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {formatCurrency(expense.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </WarmCard>
        </motion.div>
      </div>
    </section>
  );
}
