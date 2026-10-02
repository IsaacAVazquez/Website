"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import {
  BUDGET_PLANNER_STORAGE_KEY,
  buildBudgetCsv,
  formatBudgetMonthLabel,
  getAdjacentBudgetMonthKey,
  getDefaultExpenseDate,
  isBudgetMonthKey,
} from "@/lib/budgetPlanner";
import { downloadFile } from "@/lib/downloadFile";
import { useBudgetPlanner } from "@/hooks/useBudgetPlanner";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { checkRegister } from "./envelopes";
import { EnvelopesSignature } from "./EnvelopesSignature";
import "./budget-planner.css";
import { formatDollars } from "@/lib/utils";

const ROUTE = "/fintech-tools/budget-planner";

interface ExpenseDraft {
  categoryId: string;
  amount: string;
  date: string;
  note: string;
}

function formatSignedCurrency(value: number) {
  if (value > 0) return formatDollars(value);
  if (value < 0) return `-${formatDollars(Math.abs(value))}`;
  return formatDollars(0);
}

// tz-local: `iso` is the visitor's own logged expense date, entered through
// <input type="date"> and stored in this browser only, so it formats in the
// visitor's own zone rather than a pinned one.
const EXPENSE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatExpenseDate(iso: string): string {
  // ISO YYYY-MM-DD constructed in local time so a user's "today" lines up
  // with the calendar. Appending T00:00 avoids the UTC-offset off-by-one.
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
    clearMonth,
  } = useBudgetPlanner();
  const persistenceStatus = useLocalStoragePersistenceStatus(BUDGET_PLANNER_STORAGE_KEY);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>(() =>
    createEmptyExpenseDraft(activeMonthKey, activeMonth.categories[0]?.id ?? "")
  );
  const resolvedExpenseCategoryId = activeMonth.categories.some(
    (category) => category.id === expenseDraft.categoryId
  )
    ? expenseDraft.categoryId
    : activeMonth.categories[0]?.id ?? "";

  const monthLabel = formatBudgetMonthLabel(activeMonthKey);
  const totalIncome = activeMonth.income;
  const totalExpenses = summary.spentTotal;
  const remaining = summary.remainingToSpend;
  const percentSpent = useMemo(() => {
    // With no income there is no percentage to report, even when money was spent.
    if (totalIncome <= 0) return null;
    return Math.min(999, Math.round((totalExpenses / totalIncome) * 100));
  }, [totalIncome, totalExpenses]);

  const register = useMemo(
    () => checkRegister(summary.availableToBudget, summary.expenseEntries),
    [summary.availableToBudget, summary.expenseEntries]
  );

  function handleMonthChange(nextMonthKey: string) {
    if (!isBudgetMonthKey(nextMonthKey)) return;
    setEditingExpenseId(null);
    setConfirmReset(false);
    setExpenseDraft(createEmptyExpenseDraft(nextMonthKey, activeMonth.categories[0]?.id ?? ""));
    selectMonth(nextMonthKey);
  }

  function handleExportCsv() {
    downloadFile(`budget-${activeMonthKey}.csv`, buildBudgetCsv(activeMonth, summary), "text/csv;charset=utf-8");
  }

  function handleResetMonth() {
    clearMonth();
    setConfirmReset(false);
    setEditingExpenseId(null);
    setExpenseDraft(createEmptyExpenseDraft(activeMonthKey, ""));
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
    // On a phone the form sits screens above the ledger row, so move there.
    amountInputRef.current?.focus();
  }

  const lead = PROJECT_PRESS[ROUTE].lead;
  const standfirst =
    "I built this to plan a month's spending before it happens. Set an income and a savings target, put each category in its own envelope, and log expenses as they happen so the envelopes and the ledger below both move together.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Budget Planner"
        standfirst={standfirst}
        meta={
          persistenceStatus === "memory-only"
            ? `${monthLabel} · Browser storage is unavailable, so changes last only while this tab is open.`
            : `${monthLabel} · Saved in this browser, no account needed.`
        }
        readouts={[
          {
            label: "Income",
            value: formatDollars(totalIncome),
            detail: `Savings target ${formatDollars(activeMonth.savingsTarget)}`,
          },
          {
            label: "Spent",
            value: formatDollars(totalExpenses),
            detail: percentSpent === null ? "No income set" : `${percentSpent}% of income`,
          },
          {
            label: "Left to spend",
            value: formatSignedCurrency(remaining),
            detail: remaining >= 0 ? "After savings target" : `Over by ${formatDollars(Math.abs(remaining))}`,
          },
        ]}
      >
        <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
          <EnvelopesSignature categories={summary.categorySummaries} />
        </div>
      </Catalog97ProjectHero>

      <div data-testid="budget-planner-shell">
        <p role="status" aria-live="polite" className="sr-only">
          {`${formatDollars(totalExpenses)} spent, ${formatDollars(remaining)} left to spend`}
        </p>
        <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
          <div className="c97-shell">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-2)" }}>
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, -1))}
                  className="c97-btn-ghost"
                  style={{ minWidth: 44, justifyContent: "center" }}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                <label style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-1)" }}>
                  <span className="c97-kicker">Budget month</span>
                  <input
                    aria-label="Budget month"
                    type="month"
                    value={activeMonthKey}
                    onChange={(event) => handleMonthChange(event.target.value)}
                    className="c97-field c97-mono"
                    style={{ width: "12rem", maxWidth: "100%" }}
                  />
                </label>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, 1))}
                  className="c97-btn-ghost"
                  style={{ minWidth: 44, justifyContent: "center" }}
                >
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <span className="c97-serif c97-h3">{monthLabel}</span>
              </div>

              <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-2)" }}>
                <button type="button" onClick={handleExportCsv} className="c97-btn-ghost">
                  <Download size={16} aria-hidden="true" style={{ marginRight: "var(--c97-sp-1)" }} />
                  Export CSV
                </button>
                {confirmReset ? (
                  <>
                    <button
                      type="button"
                      onClick={handleResetMonth}
                      className="c97-btn-ghost"
                      style={{ color: "var(--c97-negative)" }}
                    >
                      <RotateCcw size={16} aria-hidden="true" style={{ marginRight: "var(--c97-sp-1)" }} />
                      Reset month?
                    </button>
                    <button type="button" onClick={() => setConfirmReset(false)} className="c97-btn-ghost">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmReset(true)} className="c97-btn-ghost">
                    <RotateCcw size={16} aria-hidden="true" style={{ marginRight: "var(--c97-sp-1)" }} />
                    Reset month
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
          <div className="c97-shell">
            <h2 className="c97-poster-sm">Income</h2>
            <div className="grid gap-3 sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-3)" }}>
              <label style={{ display: "block" }}>
                <span className="c97-kicker">Monthly income</span>
                <input
                  aria-label="Monthly income"
                  type="number"
                  min="0"
                  step="50"
                  value={String(activeMonth.income)}
                  onChange={(event) => updateIncome(Number(event.target.value))}
                  className="c97-field c97-mono"
                />
              </label>
              <label style={{ display: "block" }}>
                <span className="c97-kicker">Savings target</span>
                <input
                  aria-label="Savings target"
                  type="number"
                  min="0"
                  step="25"
                  value={String(activeMonth.savingsTarget)}
                  onChange={(event) => updateSavingsTarget(Number(event.target.value))}
                  className="c97-field c97-mono"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
          <div className="c97-shell">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="c97-poster-sm">Categories</h2>
              <p className="c97-meta">Budgeted {formatDollars(summary.budgetedTotal)}</p>
            </div>

            <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-3)" }}>
              {summary.categorySummaries.map((category) => {
                const displayName = category.name || "Untitled";
                const hasLinkedExpenses = category.expenseCount > 0;
                const empty = category.name.trim() === "";
                return (
                  <div
                    key={category.id}
                    className="grid gap-2"
                    style={{
                      padding: "var(--c97-sp-2) 0",
                      borderBottom: "1px solid var(--c97-rule)",
                    }}
                  >
                    <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
                      <label className="min-w-0" style={{ display: "block" }}>
                        <span className="sr-only">Category name for {displayName}</span>
                        <input
                          aria-label={`Category name for ${displayName}`}
                          aria-invalid={empty ? true : undefined}
                          type="text"
                          value={category.name}
                          onChange={(event) => renameCategory(category.id, event.target.value)}
                          onBlur={(event) => {
                            if (!event.target.value.trim()) {
                              renameCategory(category.id, "Untitled");
                            }
                          }}
                          className="c97-field"
                        />
                      </label>
                      <label style={{ display: "block" }}>
                        <span className="sr-only">Budget amount for {displayName}</span>
                        <input
                          aria-label={`Budget amount for ${displayName}`}
                          type="number"
                          min="0"
                          step="25"
                          value={String(category.budgetedAmount)}
                          onChange={(event) => updateCategoryBudget(category.id, Number(event.target.value))}
                          className="c97-field c97-mono"
                        />
                      </label>
                      <button
                        type="button"
                        aria-label={`Delete ${displayName}`}
                        aria-describedby={hasLinkedExpenses ? `category-${category.id}-meta` : undefined}
                        disabled={hasLinkedExpenses}
                        onClick={() => removeCategory(category.id)}
                        className="c97-btn-ghost"
                      >
                        <Trash2 size={14} aria-hidden="true" style={{ marginRight: "var(--c97-sp-1)" }} />
                        Delete
                      </button>
                    </div>

                    <p
                      className="c97-meta"
                      id={hasLinkedExpenses ? `category-${category.id}-meta` : undefined}
                    >
                      {formatDollars(category.spent)} of {formatDollars(category.budgetedAmount)} ·{" "}
                      {formatSignedCurrency(category.remaining)} left ·{" "}
                      {category.expenseCount} {category.expenseCount === 1 ? "entry" : "entries"}
                      {hasLinkedExpenses ? " · remove linked expenses before deleting" : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleAddCategory}
              className="flex flex-col gap-2 sm:flex-row"
              style={{ marginTop: "var(--c97-sp-3)" }}
            >
              <label className="flex-1">
                <span className="sr-only">New category name</span>
                <input
                  aria-label="New category name"
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Add a custom category"
                  className="c97-field"
                />
              </label>
              <button type="submit" className="c97-btn c97-offset">
                <Plus size={14} aria-hidden="true" style={{ marginRight: "var(--c97-sp-1)" }} />
                Add category
              </button>
            </form>
          </div>
        </section>

        <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
          <div className="c97-shell">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="c97-poster-sm">Expenses ledger</h2>
              <p className="c97-meta">
                {summary.expenseEntries.length} {summary.expenseEntries.length === 1 ? "entry" : "entries"}
              </p>
            </div>

            {activeMonth.categories.length === 0 ? (
              <p id="budget-expense-needs-category" className="c97-meta" style={{ marginTop: "var(--c97-sp-3)" }}>
                Add a category above before logging expenses.
              </p>
            ) : null}
            <form
              onSubmit={handleExpenseSubmit}
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)_minmax(0,160px)_minmax(0,1fr)_auto]"
              style={{ marginTop: "var(--c97-sp-3)", alignItems: "end" }}
            >
              <label style={{ display: "block" }}>
                <span className="c97-kicker">Category</span>
                <select
                  aria-label="Expense category"
                  value={resolvedExpenseCategoryId}
                  onChange={(event) =>
                    setExpenseDraft((current) => ({ ...current, categoryId: event.target.value }))
                  }
                  className="c97-field"
                >
                  {activeMonth.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name || "Untitled"}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <span className="c97-kicker">Amount</span>
                <input
                  ref={amountInputRef}
                  aria-label="Expense amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseDraft.amount}
                  onChange={(event) =>
                    setExpenseDraft((current) => ({ ...current, amount: event.target.value }))
                  }
                  className="c97-field c97-mono"
                />
              </label>
              <label style={{ display: "block" }}>
                <span className="c97-kicker">Date</span>
                <input
                  aria-label="Expense date"
                  type="date"
                  value={expenseDraft.date}
                  onChange={(event) => setExpenseDraft((current) => ({ ...current, date: event.target.value }))}
                  className="c97-field"
                />
              </label>
              <label style={{ display: "block" }}>
                <span className="c97-kicker">Note</span>
                <input
                  aria-label="Expense note"
                  type="text"
                  value={expenseDraft.note}
                  onChange={(event) => setExpenseDraft((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Coffee, rent, groceries"
                  className="c97-field"
                />
              </label>
              <div className="flex" style={{ gap: "var(--c97-sp-2)" }}>
                <button
                  type="submit"
                  disabled={!resolvedExpenseCategoryId || !expenseDraft.amount || !expenseDraft.date}
                  className="c97-btn c97-offset"
                  aria-describedby={
                    activeMonth.categories.length === 0 ? "budget-expense-needs-category" : undefined
                  }
                >
                  {editingExpenseId ? "Save expense" : "Add expense"}
                </button>
                {editingExpenseId ? (
                  <button type="button" onClick={resetExpenseDraft} className="c97-btn-ghost">
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            {register.length === 0 ? (
              <p className="c97-prose" style={{ marginTop: "var(--c97-sp-4)", color: "var(--c97-ink-2)" }}>
                Ledger is empty. Add the first expense above.
              </p>
            ) : (
              <div
                className="overflow-x-auto"
                role="region"
                tabIndex={0}
                aria-label="Expense ledger"
                style={{ marginTop: "var(--c97-sp-4)" }}
              >
              <table className="c97-table c97-checkregister">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Note</th>
                    <th>Category</th>
                    <th data-align="end">Amount</th>
                    <th data-align="end">Balance</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {register.map((row) => {
                    const displayNote = row.note || row.categoryName;
                    return (
                      <tr key={row.id}>
                        <td data-label="Date" title={row.date}>
                          {formatExpenseDate(row.date)}
                        </td>
                        <td data-label="Note">{row.note || "—"}</td>
                        <td data-label="Category">{row.categoryName}</td>
                        <td data-label="Amount" data-align="end" className="c97-tabular">
                          {formatDollars(row.amount)}
                        </td>
                        <td data-label="Balance" data-align="end" className="c97-tabular">
                          {formatSignedCurrency(row.balance)}
                        </td>
                        <td style={{ border: "none" }}>
                          <div className="flex justify-end" style={{ gap: "var(--c97-sp-2)" }}>
                            <button
                              type="button"
                              aria-label={`Edit ${displayNote} expense`}
                              onClick={() => handleEditExpense(row.id)}
                              className="c97-btn-ghost"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${displayNote} expense`}
                              onClick={() => {
                                removeExpense(row.id);
                                if (editingExpenseId === row.id) {
                                  resetExpenseDraft();
                                }
                              }}
                              className="c97-btn-ghost"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
