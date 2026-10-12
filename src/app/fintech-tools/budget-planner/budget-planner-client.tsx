"use client";

import { type FormEvent, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Plus, RotateCcw } from "lucide-react";
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
import type { BudgetCategorySummary } from "@/types/budget";
import { checkRegister, envelope } from "./envelopes";
import "./budget-planner.css";
import { formatDollars } from "@/lib/utils";

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

function CategoryNameField({
  id,
  name,
  onRename,
}: {
  id: string;
  name: string;
  onRename: (id: string, name: string) => void;
}) {
  const [draft, setDraft] = useState(name);
  const [savedName, setSavedName] = useState(name);
  if (savedName !== name) {
    setSavedName(name);
    setDraft(name);
  }

  return (
    <input
      aria-label={`Category name for ${name}`}
      type="text"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const trimmed = draft.trim();
        if (trimmed) onRename(id, trimmed);
        setDraft(trimmed || name);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className="bp-envelope-name"
    />
  );
}

/**
 * One envelope per category. The envelope is the object, so it carries its
 * own name, its budget, and what is left, with the fill strip and the torn
 * flap as marks that repeat the printed reading and never replace it.
 */
function Envelope({
  category,
  onRename,
  onBudget,
  onDelete,
}: {
  category: BudgetCategorySummary;
  onRename: (id: string, name: string) => void;
  onBudget: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const displayName = category.name || "Untitled";
  const hasLinkedExpenses = category.expenseCount > 0;
  const { fill, torn, overBy } = envelope(category.spent, category.budgetedAmount);
  const metaId = `category-${category.id}-meta`;
  const entries = `${category.expenseCount} ${category.expenseCount === 1 ? "entry" : "entries"}`;

  let reading: string;
  if (torn) reading = `${formatDollars(category.spent)} spent, over by ${formatDollars(overBy)}`;
  else if (category.budgetedAmount === 0 && category.spent === 0) reading = "Nothing budgeted yet";
  else reading = `${formatDollars(category.spent)} spent, ${formatDollars(category.remaining)} left`;

  return (
    <li className="bp-envelope" data-torn={torn ? "true" : "false"}>
      <span className="bp-envelope-flap" aria-hidden="true" />
      <CategoryNameField id={category.id} name={displayName} onRename={onRename} />
      <label className="bp-envelope-budget">
        <span aria-hidden="true">$</span>
        <input
          aria-label={`Budget amount for ${displayName}`}
          type="number"
          min="0"
          step="25"
          value={String(category.budgetedAmount)}
          onChange={(event) => onBudget(category.id, Number(event.target.value))}
        />
      </label>
      <p className="bp-envelope-reading" data-over={torn || undefined}>
        {reading}
      </p>
      <div className="bp-envelope-foot">
        {/* Seeded category ids are random until the saved month loads, so the id
            only prints once it is needed, which keeps the server and client markup equal. */}
        <p className="bp-envelope-meta" id={hasLinkedExpenses ? metaId : undefined}>
          {entries}
          {hasLinkedExpenses ? ", remove linked expenses before deleting" : ""}
        </p>
        <button
          type="button"
          aria-label={`Delete ${displayName}`}
          aria-describedby={hasLinkedExpenses ? metaId : undefined}
          disabled={hasLinkedExpenses}
          onClick={() => onDelete(category.id)}
          className="bp-link"
        >
          Delete
        </button>
      </div>
      <span className="bp-envelope-fill" aria-hidden="true">
        <span style={{ width: `${fill * 100}%` }} />
      </span>
    </li>
  );
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
  const ids = useId();
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

  // An amount that is typed but not above zero would log a $0 expense, so say so at the field.
  const amountInvalid = expenseDraft.amount.trim() !== "" && !(Number(expenseDraft.amount) > 0);

  const monthLabel = formatBudgetMonthLabel(activeMonthKey);
  const totalIncome = activeMonth.income;
  const totalExpenses = summary.spentTotal;
  const remaining = summary.remainingToSpend;
  const leftToAssign = summary.remainingToBudget;
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
    if (!resolvedExpenseCategoryId || amountInvalid) return;

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
    // On a phone the form sits a screen above the ledger row, so move there.
    amountInputRef.current?.focus();
  }

  return (
    <div className="bp" data-testid="budget-planner-shell">
      <div className="bp-page c97-shell c97-frame">
        <header className="bp-title">
          <h1>Budget Planner</h1>
          <p>
            Give every dollar of the month an envelope before you spend it, then log expenses against the envelopes as
            they happen.
          </p>
          {persistenceStatus === "memory-only" ? (
            <p role="status" className="bp-storage">
              Browser storage is unavailable, so changes last only while this tab is open.
            </p>
          ) : (
            <p className="bp-storage">Saved in this browser, no account needed.</p>
          )}
        </header>

        <p role="status" aria-live="polite" className="sr-only">
          {`${formatDollars(totalExpenses)} spent, ${formatDollars(remaining)} left to spend`}
        </p>

        {/* The plan comes first, so the month, income, and savings target sit above the figures and envelopes they drive. */}
        <section className="bp-month" aria-labelledby={`${ids}-month`}>
          <h2 id={`${ids}-month`} className="sr-only">
            Month and income
          </h2>
          <div className="bp-stepper">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, -1))}
              className="bp-icon-btn"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <label className="bp-month-field">
              <span className="bp-label">Budget month</span>
              <input
                aria-label="Budget month"
                type="month"
                value={activeMonthKey}
                onChange={(event) => handleMonthChange(event.target.value)}
                className="bp-field"
              />
            </label>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => handleMonthChange(getAdjacentBudgetMonthKey(activeMonthKey, 1))}
              className="bp-icon-btn"
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          <label className="bp-money">
            <span className="bp-label">Monthly income</span>
            <span className="bp-field bp-field-money">
              <span aria-hidden="true">$</span>
              <input
                aria-label="Monthly income"
                type="number"
                min="0"
                step="50"
                value={String(activeMonth.income)}
                onChange={(event) => updateIncome(Number(event.target.value))}
              />
            </span>
          </label>
          <label className="bp-money">
            <span className="bp-label">Savings target</span>
            <span className="bp-field bp-field-money">
              <span aria-hidden="true">$</span>
              <input
                aria-label="Savings target"
                type="number"
                min="0"
                step="25"
                value={String(activeMonth.savingsTarget)}
                onChange={(event) => updateSavingsTarget(Number(event.target.value))}
              />
            </span>
          </label>

          <dl className="bp-sum">
            <div>
              <dt>Spent</dt>
              <dd className="bp-sum-value">{formatDollars(totalExpenses)}</dd>
              <dd className="bp-sum-note">{percentSpent === null ? "No income set" : `${percentSpent}% of income`}</dd>
            </div>
            <div>
              <dt>Left to spend</dt>
              <dd className="bp-sum-value" data-negative={remaining < 0 || undefined}>
                {formatSignedCurrency(remaining)}
              </dd>
              <dd className="bp-sum-note">
                {totalIncome <= 0 && totalExpenses <= 0
                  ? "Set an income first"
                  : remaining >= 0
                    ? "After savings target"
                    : `Over by ${formatDollars(Math.abs(remaining))}`}
              </dd>
            </div>
          </dl>

          <div className="bp-actions">
            <button type="button" onClick={handleExportCsv} className="bp-link">
              <Download size={16} aria-hidden="true" />
              Export CSV
            </button>
            {confirmReset ? (
              <>
                <button type="button" onClick={handleResetMonth} className="bp-link" data-danger="true">
                  <RotateCcw size={16} aria-hidden="true" />
                  Reset month?
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="bp-link">
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmReset(true)} className="bp-link">
                <RotateCcw size={16} aria-hidden="true" />
                Reset month
              </button>
            )}
          </div>
        </section>

        <section className="bp-envelopes" aria-labelledby={`${ids}-categories`}>
          <div className="bp-section-head">
            <h2 id={`${ids}-categories`}>Categories</h2>
            <p>
              Budgeted {formatDollars(summary.budgetedTotal)} for <span className="bp-month-name">{monthLabel}</span>,{" "}
              {leftToAssign >= 0
                ? `${formatDollars(leftToAssign)} left to assign`
                : `${formatDollars(Math.abs(leftToAssign))} more than the month has`}
            </p>
          </div>

          <ul className="bp-envelope-grid">
            {summary.categorySummaries.map((category) => (
              <Envelope
                key={category.id}
                category={category}
                onRename={renameCategory}
                onBudget={updateCategoryBudget}
                onDelete={removeCategory}
              />
            ))}
            <li className="bp-envelope-new">
              <form onSubmit={handleAddCategory}>
                <label>
                  <span className="bp-label">New envelope</span>
                  <input
                    aria-label="New category name"
                    type="text"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Travel, gifts, pets"
                    className="bp-field"
                  />
                </label>
                <button type="submit" className="bp-btn">
                  <Plus size={16} aria-hidden="true" />
                  Add category
                </button>
              </form>
            </li>
          </ul>
        </section>

        <section className="bp-ledger" aria-labelledby={`${ids}-ledger`}>
          <div className="bp-section-head">
            <h2 id={`${ids}-ledger`}>Expenses ledger</h2>
            <p>
              {summary.expenseEntries.length} {summary.expenseEntries.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          {activeMonth.categories.length === 0 ? (
            <p id="budget-expense-needs-category" className="bp-note">
              Add a category above before logging expenses.
            </p>
          ) : null}
          <form onSubmit={handleExpenseSubmit} className="bp-expense-form">
            <label>
              <span className="bp-label">Category</span>
              <select
                aria-label="Expense category"
                value={resolvedExpenseCategoryId}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, categoryId: event.target.value }))}
                className="bp-field"
              >
                {activeMonth.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name || "Untitled"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="bp-label">Amount</span>
              <input
                ref={amountInputRef}
                aria-label="Expense amount"
                aria-invalid={amountInvalid || undefined}
                aria-describedby={amountInvalid ? "budget-expense-amount-error" : undefined}
                type="number"
                min="0"
                step="0.01"
                value={expenseDraft.amount}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, amount: event.target.value }))}
                className="bp-field bp-num"
              />
              {amountInvalid ? (
                <span id="budget-expense-amount-error" className="bp-note">
                  Enter an amount above zero.
                </span>
              ) : null}
            </label>
            <label>
              <span className="bp-label">Date</span>
              <input
                aria-label="Expense date"
                type="date"
                value={expenseDraft.date}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, date: event.target.value }))}
                className="bp-field"
              />
            </label>
            <label>
              <span className="bp-label">Note</span>
              <input
                aria-label="Expense note"
                type="text"
                value={expenseDraft.note}
                onChange={(event) => setExpenseDraft((current) => ({ ...current, note: event.target.value }))}
                placeholder="Coffee, rent, groceries"
                className="bp-field"
              />
            </label>
            <div className="bp-expense-actions">
              <button
                type="submit"
                disabled={!resolvedExpenseCategoryId || !expenseDraft.amount || amountInvalid || !expenseDraft.date}
                className="bp-btn"
                aria-describedby={activeMonth.categories.length === 0 ? "budget-expense-needs-category" : undefined}
              >
                {editingExpenseId ? "Save expense" : "Add expense"}
              </button>
              {editingExpenseId ? (
                <button type="button" onClick={resetExpenseDraft} className="bp-link">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          {register.length === 0 ? (
            <p className="bp-empty">Ledger is empty. Add the first expense above.</p>
          ) : (
            <div className="bp-register-scroll" role="region" tabIndex={0} aria-label="Expense ledger">
              <table className="bp-register">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Note</th>
                    <th scope="col">Category</th>
                    <th scope="col" data-align="end">
                      Amount
                    </th>
                    <th scope="col" data-align="end">
                      Balance
                    </th>
                    <th scope="col">
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
                        <td data-label="Note" data-empty={row.note ? undefined : "true"}>
                          {row.note || "No note"}
                        </td>
                        <td data-label="Category">{row.categoryName}</td>
                        <td data-label="Amount" data-align="end">
                          {formatDollars(row.amount)}
                        </td>
                        <td data-label="Balance" data-align="end" data-negative={row.balance < 0 || undefined}>
                          {formatSignedCurrency(row.balance)}
                        </td>
                        <td className="bp-register-actions">
                          <button
                            type="button"
                            aria-label={`Edit ${displayNote} expense`}
                            onClick={() => handleEditExpense(row.id)}
                            className="bp-link"
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
                            className="bp-link"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
