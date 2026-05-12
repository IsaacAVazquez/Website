"use client";

import { type FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  ChartPie,
  Landmark,
  ListChecks,
  PiggyBank,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getReducedMotionVariants, fadeInVariants } from "@/components/investments/animations";
import {
  formatBudgetMonthLabel,
  getAdjacentBudgetMonthKey,
  getDefaultExpenseDate,
  isBudgetMonthKey,
} from "@/lib/budgetPlanner";
import { useBudgetPlanner } from "@/hooks/useBudgetPlanner";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

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
  return "text-[var(--home-ink)]";
}

const EXPENSE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatExpenseDate(iso: string): string {
  // ISO YYYY-MM-DD constructed in local time so a user's "today" lines up
  // with the calendar — appending T00:00 avoids the UTC-offset off-by-one.
  const date = new Date(`${iso}T00:00`);
  return Number.isNaN(date.getTime()) ? iso : EXPENSE_DATE_FORMATTER.format(date);
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

const NAV_ITEMS = [
  { id: "income", label: "Income", icon: Landmark, href: "#section-income" },
  { id: "categories", label: "Categories", icon: ChartPie, href: "#section-categories" },
  { id: "expenses", label: "Expenses", icon: ReceiptText, href: "#section-expenses" },
  { id: "summary", label: "Summary", icon: ListChecks, href: "#section-summary" },
] as const;

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
    createEmptyExpenseDraft(activeMonthKey, activeMonth.categories[0]?.id ?? "")
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

  const monthLabel = formatBudgetMonthLabel(activeMonthKey);

  // Hero summary numbers. "Spent" is the canonical "money out" number for the
  // hero card; remaining mirrors what the user has left to spend this month.
  const totalIncome = activeMonth.income;
  const totalExpenses = summary.spentTotal;
  const remaining = summary.remainingToSpend;
  const percentSpent = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.min(999, Math.round((totalExpenses / totalIncome) * 100));
  }, [totalIncome, totalExpenses]);
  const progressWidth = `${Math.min(100, Math.max(0, percentSpent))}%`;

  const topCategories = useMemo(
    () =>
      [...summary.categorySummaries]
        .filter((category) => category.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5),
    [summary.categorySummaries]
  );

  const largestCategory = topCategories[0] ?? null;

  const budgetStatsCells: HomeStatsCell[] = [
    {
      label: "Income",
      value: formatCurrency(totalIncome),
    },
    {
      label: "Spent",
      value: formatCurrency(totalExpenses),
    },
    {
      label: "Remaining",
      value: formatSignedCurrency(remaining),
      tone: remaining > 0 ? "good" : "default",
    },
    {
      label: "Savings target",
      value: formatCurrency(activeMonth.savingsTarget),
    },
    {
      label: "Percent spent",
      value: `${percentSpent}%`,
    },
    {
      label: "Categories",
      value: activeMonth.categories.length.toLocaleString(),
    },
    {
      label: "Largest category",
      value: largestCategory ? largestCategory.name || "Untitled" : "—",
      sub: largestCategory ? formatCurrency(largestCategory.spent) : "No spend yet",
    },
    {
      label: "Active month",
      value: monthLabel,
    },
  ];

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
    if (!resolvedExpenseCategoryId) return;

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

  // Field styling reused across rail + main forms. Tightened to fit the 290px
  // rail without horizontal scroll.
  const fieldLabel =
    "block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]";
  const fieldInput =
    "mt-1.5 w-full min-h-touch rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-[13px] text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2";
  const numericInput = `${fieldInput} [font-variant-numeric:tabular-nums]`;

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Budget Planner"
      data-testid="budget-planner-shell"
    >
      <div className="home-shell home-section">
        <motion.div
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* In-page section nav (replaces sidebar) */}
          <nav className="flex flex-wrap gap-2" aria-label="Section navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="inline-flex min-h-touch items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-4 py-1.5 text-sm font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                  style={{ fontFamily: "var(--font-home-sans)" }}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="tool-topbar">
              <div className="min-w-0">
                <p className="tool-crumbs">
                  Budget Planner / <strong>{monthLabel}</strong>
                </p>
                <h1>Budget Planner</h1>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-1 shadow-[var(--shadow-sm)]">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, -1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--home-ink-muted)] transition hover:bg-[color-mix(in_srgb,var(--home-acid)_18%,transparent)] hover:text-[var(--home-ink)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <label className="flex items-center gap-1.5 px-2 text-[12px] font-semibold text-[var(--home-ink)]">
                  <CalendarRange className="h-3.5 w-3.5 text-[var(--home-haze)]" aria-hidden="true" />
                  <input
                    aria-label="Budget month"
                    type="month"
                    value={activeMonthKey}
                    onChange={(event) => handleMonthChange(event.target.value)}
                    className="border-0 bg-transparent p-0 text-[12px] font-semibold text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    style={{ width: "115px" }}
                  />
                </label>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--home-ink-muted)] transition hover:bg-[color-mix(in_srgb,var(--home-acid)_18%,transparent)] hover:text-[var(--home-ink)]"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="tool-meta-chip" role="status" aria-live="polite">
              <span className="tool-meta-chip-dot" aria-hidden="true" />
              <span>
                Income <strong>{formatCurrency(totalIncome)}</strong>
              </span>
              <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
              <span>
                Spent <strong>{formatCurrency(totalExpenses)}</strong>
              </span>
              <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
              <span>
                Remaining <strong className={getBalanceTone(remaining)}>{formatSignedCurrency(remaining)}</strong>
              </span>
              <span className="tool-meta-chip-spacer" />
              <span className="tool-meta-chip-meta">{percentSpent}% of budget</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
              <div className="flex flex-col gap-5">
              <div id="section-summary" className="scroll-mt-28">
                <HomeStatsPanel
                  id="budget-planner-stats"
                  title="Budget at a glance"
                  meta={`${formatSignedCurrency(summary.remainingToBudget)} left to budget`}
                  hideLiveDot
                  cells={budgetStatsCells}
                  pills={[
                    { label: "Income", href: "#section-income" },
                    { label: "Categories", href: "#section-categories" },
                    { label: "Expenses", href: "#section-expenses" },
                    { label: "Summary", href: "#section-summary" },
                  ]}
                />
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    <span>Spend progress</span>
                    <span className="[font-variant-numeric:tabular-nums]">{percentSpent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))]">
                    <div
                      className={`h-full rounded-full ${
                        percentSpent >= 100
                          ? "bg-[var(--color-error)]"
                          : percentSpent >= 85
                            ? "bg-[var(--color-warning)]"
                            : "bg-[var(--home-haze)]"
                      }`}
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>
              </div>

              {/* Income + Savings target */}
              <section
                id="section-income"
                className="tool-card scroll-mt-28"
                aria-label="Income and savings target"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="tool-section-kicker">Planning</p>
                    <h2 className="tool-section-title">Income</h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={fieldLabel}>Monthly income</span>
                    <input
                      aria-label="Monthly income"
                      type="number"
                      min="0"
                      step="50"
                      value={String(activeMonth.income)}
                      onChange={(event) => updateIncome(Number(event.target.value))}
                      className={numericInput}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Savings target</span>
                    <input
                      aria-label="Savings target"
                      type="number"
                      min="0"
                      step="25"
                      value={String(activeMonth.savingsTarget)}
                      onChange={(event) => updateSavingsTarget(Number(event.target.value))}
                      className={numericInput}
                    />
                  </label>
                </div>
              </section>

              {/* Categories */}
              <section
                id="section-categories"
                className="tool-card scroll-mt-28"
                aria-label="Category budgets"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="tool-section-kicker">Allocation</p>
                    <h2 className="tool-section-title">Categories</h2>
                  </div>
                  <p className="text-[12px] text-[var(--home-ink-muted)]">
                    Budgeted{" "}
                    <span className="font-semibold text-[var(--home-ink)] [font-variant-numeric:tabular-nums]">
                      {formatCurrency(summary.budgetedTotal)}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 divide-y divide-[var(--home-rule)]">
                  {summary.categorySummaries.map((category) => {
                    const displayName = category.name || "Untitled";
                    const utilWidth = `${Math.min(100, Math.max(0, category.utilization * 100))}%`;
                    const hasLinkedExpenses = category.expenseCount > 0;
                    const empty = category.name.trim() === "";
                    return (
                      <div key={category.id} className="grid gap-2 py-3 first:pt-0">
                        <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
                          <label className="min-w-0 block">
                            <span className="sr-only">Category name for {displayName}</span>
                            <input
                              aria-label={`Category name for ${displayName}`}
                              aria-invalid={empty ? true : undefined}
                              aria-describedby={empty ? `category-${category.id}-error` : undefined}
                              type="text"
                              value={category.name}
                              onChange={(event) => renameCategory(category.id, event.target.value)}
                              onBlur={(event) => {
                                if (!event.target.value.trim()) {
                                  renameCategory(category.id, "Untitled");
                                }
                              }}
                              className="w-full min-h-touch rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13.5px] font-medium text-[var(--home-ink)] hover:border-[var(--home-rule)] focus-visible:border-[var(--home-rule)] focus-visible:bg-[var(--home-paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 aria-[invalid=true]:border-[var(--color-error)]"
                            />
                          </label>
                          <label className="block">
                            <span className="sr-only">Budget amount for {displayName}</span>
                            <input
                              aria-label={`Budget amount for ${displayName}`}
                              type="number"
                              min="0"
                              step="25"
                              value={String(category.budgetedAmount)}
                              onChange={(event) =>
                                updateCategoryBudget(category.id, Number(event.target.value))
                              }
                              className="w-full min-h-touch rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-[13.5px] font-medium text-[var(--home-ink)] [font-variant-numeric:tabular-nums] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                            />
                          </label>
                          <button
                            type="button"
                            aria-label={`Delete ${displayName}`}
                            aria-describedby={
                              hasLinkedExpenses ? `category-${category.id}-delete-help` : undefined
                            }
                            disabled={hasLinkedExpenses}
                            onClick={() => removeCategory(category.id)}
                            className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12.5px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>

                        {empty ? (
                          <span
                            id={`category-${category.id}-error`}
                            className="text-[11px] text-[var(--color-error)]"
                          >
                            Name a category — empty fields fall back to "Untitled".
                          </span>
                        ) : null}

                        <div className="flex items-center gap-3 text-[11.5px] text-[var(--home-ink-muted)]">
                          <span className="[font-variant-numeric:tabular-nums]">
                            {formatCurrency(category.spent)} / {formatCurrency(category.budgetedAmount)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`${getBalanceTone(category.remaining)} [font-variant-numeric:tabular-nums]`}
                          >
                            {formatSignedCurrency(category.remaining)} left
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="[font-variant-numeric:tabular-nums]">
                            {category.expenseCount} {category.expenseCount === 1 ? "entry" : "entries"}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))]">
                          <div
                            className={`h-full rounded-full ${
                              category.overBudget
                                ? "bg-[var(--color-error)]"
                                : category.utilization >= 0.85
                                  ? "bg-[var(--color-warning)]"
                                  : "bg-[var(--home-haze)]"
                            }`}
                            style={{ width: utilWidth }}
                          />
                        </div>

                        {hasLinkedExpenses ? (
                          <p
                            id={`category-${category.id}-delete-help`}
                            className="text-[11px] text-[var(--home-ink-muted)]"
                          >
                            Remove linked expenses before deleting this category.
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleAddCategory} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <label className="flex-1">
                    <span className="sr-only">New category name</span>
                    <input
                      aria-label="New category name"
                      type="text"
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      placeholder="Add a custom category"
                      className="w-full min-h-touch rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-[13.5px] text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-touch items-center justify-center gap-2 rounded-lg bg-[var(--home-ink)] px-4 text-[13px] font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-haze))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add category
                  </button>
                </form>
              </section>

              {/* Expenses ledger */}
              <section
                id="section-expenses"
                className="tool-card scroll-mt-28"
                aria-label="Expenses ledger"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="tool-section-kicker">Ledger</p>
                    <h2 className="tool-section-title">Expenses ledger</h2>
                  </div>
                  <p className="text-[12px] text-[var(--home-ink-muted)] [font-variant-numeric:tabular-nums]">
                    {summary.expenseEntries.length}{" "}
                    {summary.expenseEntries.length === 1 ? "entry" : "entries"}
                  </p>
                </div>

                {summary.expenseEntries.length === 0 ? (
                  <div className="tool-empty mt-4">
                    <p className="text-[13.5px] font-semibold text-[var(--home-ink)]">
                      Ledger is empty
                    </p>
                    <p>Add the first expense using the form on the right.</p>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-[var(--home-rule)]">
                    {summary.expenseEntries.map((expense) => (
                      <li key={expense.id} className="grid gap-2 py-3 first:pt-0">
                        <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-semibold text-[var(--home-ink)]">
                              {expense.note || expense.categoryName}
                            </p>
                            <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                              <span>{expense.categoryName}</span>
                              <span aria-hidden="true"> · </span>
                              <span title={expense.date}>{formatExpenseDate(expense.date)}</span>
                            </p>
                          </div>
                          <p className="text-[13.5px] font-semibold text-[var(--home-ink)] [font-variant-numeric:tabular-nums]">
                            {formatCurrency(expense.amount)}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Edit ${expense.note || expense.categoryName} expense`}
                              onClick={() => handleEditExpense(expense.id)}
                              className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12.5px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
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
                              className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12.5px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

          <aside
            aria-label="Budget tools"
            className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_74%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          >
            <section aria-labelledby="rail-add-expense">
              <p className="tool-rail-label" id="rail-add-expense">
                <Plus size={12} aria-hidden="true" />
                {editingExpenseId ? "Edit expense" : "Add expense"}
              </p>
              <form
                onSubmit={handleExpenseSubmit}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_94%,var(--home-elev-mix))] p-3 shadow-[var(--shadow-sm)]"
              >
                <label className="block">
                  <span className={fieldLabel}>Category</span>
                  <select
                    aria-label="Expense category"
                    value={resolvedExpenseCategoryId}
                    onChange={(event) =>
                      setExpenseDraft((current) => ({
                        ...current,
                        categoryId: event.target.value,
                      }))
                    }
                    className={fieldInput}
                  >
                    {activeMonth.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name || "Untitled"}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className={fieldLabel}>Amount</span>
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
                      className={numericInput}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Date</span>
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
                      className={fieldInput}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={fieldLabel}>Note</span>
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
                    className={fieldInput}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={
                      !resolvedExpenseCategoryId || !expenseDraft.amount || !expenseDraft.date
                    }
                    className="inline-flex min-h-touch flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-3 text-[13px] font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-haze))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {editingExpenseId ? "Save expense" : "Add expense"}
                  </button>
                  {editingExpenseId ? (
                    <button
                      type="button"
                      onClick={resetExpenseDraft}
                      className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12.5px] font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section aria-labelledby="rail-top-categories">
              <p className="tool-rail-label" id="rail-top-categories">
                <Sparkles size={12} aria-hidden="true" />
                Top categories
              </p>
              {topCategories.length === 0 ? (
                <p className="text-[12px] leading-6 text-[var(--home-ink-muted)]">
                  No spend yet. Add an expense and the categories with the most movement will
                  surface here.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {topCategories.map((category) => {
                    const utilWidth = `${Math.min(100, Math.max(0, category.utilization * 100))}%`;
                    return (
                      <li key={category.id} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-[12px]">
                          <span className="truncate font-medium text-[var(--home-ink)]">
                            {category.name || "Untitled"}
                          </span>
                          <span className="text-[var(--home-ink-muted)] [font-variant-numeric:tabular-nums]">
                            {formatCurrency(category.spent)}
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))]">
                          <div
                            className={`h-full rounded-full ${
                              category.overBudget
                                ? "bg-[var(--color-error)]"
                                : category.utilization >= 0.85
                                  ? "bg-[var(--color-warning)]"
                                  : "bg-[var(--home-haze)]"
                            }`}
                            style={{ width: utilWidth }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <p className="tool-rail-foot">
              <PiggyBank size={14} aria-hidden="true" />
              Saved in your browser — no account, no server.
            </p>
          </aside>
        </div>
      </motion.div>
      </div>
    </section>
  );
}
