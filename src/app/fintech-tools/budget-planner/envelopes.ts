/**
 * Budget Planner signature helpers: the envelope fill/tear math for the
 * category envelopes, and the expenses ledger's running balance for the
 * check register. Both are pure transforms of numbers the route already has.
 */

import type { BudgetExpenseLine } from "@/types/budget";
import { roundTo } from "@/lib/utils";

export interface Envelope {
  /** Spent against budgeted, clamped at one so an outlier never blows out the fill. */
  fill: number;
  /** Drawn torn open once spending passes the budget. */
  torn: boolean;
  /** How far over budget, zero when not torn. */
  overBy: number;
  spentLabel: string;
  budgetLabel: string;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

/** A zero budget with any spend reads as torn, never as a division by zero. */
export function envelope(spent: number, budgeted: number): Envelope {
  const safeSpent = Number.isFinite(spent) ? Math.max(0, spent) : 0;
  const safeBudgeted = Number.isFinite(budgeted) ? Math.max(0, budgeted) : 0;
  const torn = safeSpent > safeBudgeted;
  const fill = safeBudgeted > 0 ? Math.min(1, safeSpent / safeBudgeted) : safeSpent > 0 ? 1 : 0;

  return {
    fill,
    torn,
    overBy: torn ? roundTo(safeSpent - safeBudgeted, 2) : 0,
    spentLabel: formatCurrency(safeSpent),
    budgetLabel: formatCurrency(safeBudgeted),
  };
}

export interface CheckRegisterRow extends BudgetExpenseLine {
  /** Running balance after this row, starting from what the month has to spend (income less the savings target) and subtracting each expense in date order. */
  balance: number;
}

/** Chronological order, ties broken by the entries' own order (a stable sort). */
export function checkRegister(startingBalance: number, expenseEntries: BudgetExpenseLine[]): CheckRegisterRow[] {
  const ordered = [...expenseEntries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let balance = Number.isFinite(startingBalance) ? startingBalance : 0;

  return ordered.map((entry) => {
    balance = roundTo(balance - entry.amount, 2);
    return { ...entry, balance };
  });
}
