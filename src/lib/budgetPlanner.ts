import type {
  BudgetCategory,
  BudgetCategorySummary,
  BudgetExpense,
  BudgetExpenseLine,
  BudgetMonth,
  BudgetMonthMap,
  BudgetSummary,
  BudgetRecurringExpense,
} from "@/types/budget";
import { readBrowserStorageString, writeBrowserStorageJson } from "@/lib/browserStorage";
import { toLocalDateKey } from "@/lib/date-formatters";
import { escapeCsvValue, isRecord, prefixedId, roundTo } from "@/lib/utils";

export const BUDGET_PLANNER_STORAGE_KEY = "budget_planner_months_v1";

const DEFAULT_BUDGET_CATEGORY_NAMES = [
  "Housing",
  "Utilities",
  "Groceries",
  "Transportation",
  "Health",
  "Personal",
  "Entertainment",
];

function roundCurrency(value: number) {
  return Number.isFinite(value) ? roundTo(value, 2) : 0;
}

function sanitizeNonNegativeAmount(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Math.max(0, roundCurrency(numeric));
}

export function isBudgetMonthKey(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/**
 * The month of an instant on the runtime's own calendar. A budget month and
 * an expense date are the visitor's, so the page reads this in the browser
 * after mount and the server render prints no month at all. A pinned zone
 * would hand a visitor east of it last month for the first hours of the 1st.
 */
export function getCurrentBudgetMonthKey(date = new Date()) {
  return toLocalDateKey(date).slice(0, 7);
}

export function getAdjacentBudgetMonthKey(monthKey: string, offset: number) {
  // Pure integer month arithmetic, no Date object involved: a Date built from
  // a month key and shifted with local getters/setters would size the result
  // off the runtime's own zone. An unreadable key steps from the current month.
  const [year, month] = (isBudgetMonthKey(monthKey) ? monthKey : getCurrentBudgetMonthKey())
    .split("-")
    .map(Number);
  const zeroBasedTotal = year * 12 + (month - 1) + offset;
  const nextYear = Math.floor(zeroBasedTotal / 12);
  const nextMonth = ((zeroBasedTotal % 12) + 12) % 12;
  return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`;
}

export function formatBudgetMonthLabel(monthKey: string) {
  if (!isBudgetMonthKey(monthKey)) return monthKey;

  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  // tz-local: `date` is always built from a validated `YYYY-MM` key (never
  // "now"), constructed and formatted in the same runtime pass, so whichever
  // zone that runtime happens to be in cancels out and the printed month
  // never disagrees between the server and a visitor's browser for the same key.
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Today when the month is the current one, its 1st otherwise, and nothing while the month is unknown. */
export function getDefaultExpenseDate(monthKey: string, now = new Date()) {
  if (!isBudgetMonthKey(monthKey)) return "";

  const today = toLocalDateKey(now);
  return isDateInBudgetMonth(today, monthKey) ? today : `${monthKey}-01`;
}

/** An expense is filed under one month, so its `YYYY-MM-DD` date has to fall inside that month. */
export function isDateInBudgetMonth(date: string, monthKey: string) {
  return isBudgetMonthKey(monthKey) && /^\d{4}-\d{2}-\d{2}$/.test(date) && date.startsWith(`${monthKey}-`) &&
    date >= `${monthKey}-01` && date <= getBudgetMonthLastDate(monthKey);
}

/** A month's last day as `YYYY-MM-DD`, the upper bound of its expense dates. */
export function getBudgetMonthLastDate(monthKey: string) {
  if (!isBudgetMonthKey(monthKey)) return "";

  const [year, month] = monthKey.split("-").map(Number);
  // Day 0 of the next month is the last day of this one, counted in UTC so the runtime's zone stays out of it.
  return `${monthKey}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`;
}

export function createBudgetCategory(name: string, budgetedAmount = 0): BudgetCategory {
  return {
    id: prefixedId("cat"),
    name,
    budgetedAmount: sanitizeNonNegativeAmount(budgetedAmount),
  };
}

export function createBudgetExpense(input: Omit<BudgetExpense, "id">): BudgetExpense {
  return {
    id: prefixedId("exp"),
    categoryId: input.categoryId,
    amount: sanitizeNonNegativeAmount(input.amount),
    date: input.date,
    note: input.note.trim(),
  };
}

function getDefaultBudgetCategories() {
  return DEFAULT_BUDGET_CATEGORY_NAMES.map((name) => createBudgetCategory(name));
}

export function createBudgetMonth(monthKey: string): BudgetMonth {
  return {
    monthKey,
    income: 0,
    savingsTarget: 0,
    categories: getDefaultBudgetCategories(),
    expenses: [],
  };
}

function sanitizeBudgetCategory(input: unknown): BudgetCategory | null {
  if (!isRecord(input)) return null;

  const rawName = typeof input.name === "string" ? input.name.trim() : "";

  return {
    id: typeof input.id === "string" && input.id ? input.id : prefixedId("cat"),
    name: rawName || "Untitled",
    budgetedAmount: sanitizeNonNegativeAmount(input.budgetedAmount),
    carryForward: input.carryForward === true,
    carriedAmount: sanitizeNonNegativeAmount(input.carriedAmount),
  };
}

function sanitizeBudgetExpense(input: unknown): BudgetExpense | null {
  if (!isRecord(input)) return null;
  if (typeof input.categoryId !== "string" || !input.categoryId) return null;
  if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return null;

  return {
    id: typeof input.id === "string" && input.id ? input.id : prefixedId("exp"),
    categoryId: input.categoryId,
    amount: sanitizeNonNegativeAmount(input.amount),
    date: input.date,
    note: typeof input.note === "string" ? input.note.trim().slice(0, 140) : "",
    ...(typeof input.recurringId === "string" ? { recurringId: input.recurringId.slice(0, 100) } : {}),
  };
}

function sanitizeBudgetMonth(input: unknown, fallbackMonthKey?: string): BudgetMonth | null {
  if (!isRecord(input)) return null;

  const monthKeySource =
    typeof input.monthKey === "string" ? input.monthKey : fallbackMonthKey ?? "";
  if (!isBudgetMonthKey(monthKeySource)) return null;

  const categories = Array.isArray(input.categories)
    ? input.categories
        .map((category) => sanitizeBudgetCategory(category))
        .filter((category): category is BudgetCategory => category !== null)
    : [];
  const hasEmptyCategories = Array.isArray(input.categories) && input.categories.length === 0;

  const expenses = Array.isArray(input.expenses)
    ? input.expenses
        .map((expense) => sanitizeBudgetExpense(expense))
        .filter((expense): expense is BudgetExpense => expense !== null)
    : [];

  return {
    monthKey: monthKeySource,
    income: sanitizeNonNegativeAmount(input.income),
    savingsTarget: sanitizeNonNegativeAmount(input.savingsTarget),
    categories: categories.length > 0 || hasEmptyCategories ? categories : getDefaultBudgetCategories(),
    expenses,
    recurringExpenses: Array.isArray(input.recurringExpenses)
      ? input.recurringExpenses.flatMap((bill): BudgetRecurringExpense[] => {
          if (!isRecord(bill) || typeof bill.id !== "string" || !bill.id ||
            typeof bill.categoryId !== "string" || !categories.some(c => c.id === bill.categoryId) ||
            typeof bill.day !== "number" || !Number.isInteger(bill.day) || bill.day < 1 || bill.day > 31 ||
            typeof bill.amount !== "number" || !Number.isFinite(bill.amount) || bill.amount <= 0) return [];
          return [{ id: bill.id.slice(0, 100), categoryId: bill.categoryId,
            amount: sanitizeNonNegativeAmount(bill.amount), day: bill.day,
            note: typeof bill.note === "string" ? bill.note.trim().slice(0, 140) : "" }];
        }).slice(0, 100)
      : [],
  };
}

export function isBudgetPlanEmpty(month: BudgetMonth): boolean {
  return month.income === 0 && month.savingsTarget === 0 && month.expenses.length === 0 &&
    !(month.recurringExpenses?.length) && month.categories.every(c => c.budgetedAmount === 0 && !c.carriedAmount);
}

export function copyBudgetPlan(previous: BudgetMonth, monthKey: string): BudgetMonth {
  const summary = calculateBudgetSummary(previous);
  return {
    monthKey, income: previous.income, savingsTarget: previous.savingsTarget, expenses: [],
    categories: previous.categories.map(category => ({
      ...category,
      carriedAmount: category.carryForward
        ? Math.max(0, summary.categorySummaries.find(c => c.id === category.id)?.remaining ?? 0) : 0,
    })),
    recurringExpenses: (previous.recurringExpenses ?? []).map(bill => ({ ...bill })),
  };
}

export function recordRecurringExpenses(month: BudgetMonth): BudgetMonth {
  if (!isBudgetMonthKey(month.monthKey)) return month;
  const lastDay = Number(getBudgetMonthLastDate(month.monthKey).slice(-2));
  const recorded = new Set(month.expenses.map(expense => expense.recurringId));
  const additions = (month.recurringExpenses ?? []).flatMap(bill => {
    if (recorded.has(bill.id) || !month.categories.some(c => c.id === bill.categoryId)) return [];
    recorded.add(bill.id);
    return [{ ...createBudgetExpense({ categoryId: bill.categoryId, amount: bill.amount,
      date: `${month.monthKey}-${String(Math.min(lastDay, bill.day)).padStart(2, "0")}`, note: bill.note }),
      recurringId: bill.id }];
  });
  return { ...month, expenses: [...month.expenses, ...additions] };
}

export function parseBudgetMonths(raw: string | null): BudgetMonthMap {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return {};

    return Object.entries(parsed).reduce<BudgetMonthMap>((accumulator, [monthKey, value]) => {
      const month = sanitizeBudgetMonth(value, monthKey);
      if (month) {
        accumulator[month.monthKey] = month;
      }
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

export function ensureBudgetMonth(months: BudgetMonthMap, monthKey: string) {
  if (!isBudgetMonthKey(monthKey)) return months;
  if (months[monthKey]) return months;

  return {
    ...months,
    [monthKey]: createBudgetMonth(monthKey),
  };
}

export function loadBudgetMonths(storage?: Pick<Storage, "getItem">) {
  if (storage) {
    return parseBudgetMonths(storage.getItem(BUDGET_PLANNER_STORAGE_KEY));
  }

  if (typeof window === "undefined") return {};
  return parseBudgetMonths(readBrowserStorageString(BUDGET_PLANNER_STORAGE_KEY).value);
}

export function saveBudgetMonths(
  months: BudgetMonthMap,
  storage?: Pick<Storage, "setItem">
) {
  if (storage) {
    storage.setItem(BUDGET_PLANNER_STORAGE_KEY, JSON.stringify(months));
    return;
  }

  if (typeof window === "undefined") return;
  writeBrowserStorageJson(BUDGET_PLANNER_STORAGE_KEY, months);
}

export function calculateBudgetSummary(month: BudgetMonth): BudgetSummary {
  const categoryLookup = new Map(month.categories.map((category) => [category.id, category.name]));
  const expenseTotals = new Map<string, number>();
  const expenseCounts = new Map<string, number>();

  for (const expense of month.expenses) {
    expenseTotals.set(
      expense.categoryId,
      roundCurrency((expenseTotals.get(expense.categoryId) ?? 0) + expense.amount)
    );
    expenseCounts.set(expense.categoryId, (expenseCounts.get(expense.categoryId) ?? 0) + 1);
  }

  const expenseEntries: BudgetExpenseLine[] = [...month.expenses]
    .map((expense) => ({
      ...expense,
      categoryName: categoryLookup.get(expense.categoryId) ?? "Uncategorized",
    }))
    .sort((left, right) => {
      if (left.date !== right.date) {
        return right.date.localeCompare(left.date);
      }

      return right.amount - left.amount;
    });

  const categorySummaries: BudgetCategorySummary[] = month.categories
    .map((category) => {
      const spent = roundCurrency(expenseTotals.get(category.id) ?? 0);
      const availableAmount = roundCurrency(category.budgetedAmount + (category.carriedAmount ?? 0));
      const remaining = roundCurrency(availableAmount - spent);
      const utilization =
        availableAmount > 0
          ? spent / availableAmount
          : spent > 0
            ? 1
            : 0;

      return {
        ...category,
        availableAmount,
        spent,
        remaining,
        utilization,
        expenseCount: expenseCounts.get(category.id) ?? 0,
        overBudget: spent > availableAmount,
      };
    })
    .sort((left, right) => {
      if (left.overBudget !== right.overBudget) {
        return Number(right.overBudget) - Number(left.overBudget);
      }

      return right.spent - left.spent;
    });

  const budgetedTotal = roundCurrency(
    month.categories.reduce((sum, category) => sum + category.budgetedAmount + (category.carriedAmount ?? 0), 0)
  );
  const spentTotal = roundCurrency(month.expenses.reduce((sum, expense) => sum + expense.amount, 0));
  const carriedTotal = month.categories.reduce((sum, category) => sum + (category.carriedAmount ?? 0), 0);
  const availableToBudget = roundCurrency(month.income - month.savingsTarget + carriedTotal);

  return {
    availableToBudget,
    budgetedTotal,
    remainingToBudget: roundCurrency(availableToBudget - budgetedTotal),
    spentTotal,
    remainingToSpend: roundCurrency(availableToBudget - spentTotal),
    categorySummaries,
    expenseEntries,
    recentExpenses: expenseEntries.slice(0, 5),
  };
}

/**
 * Serialize a month's expense ledger plus a totals block to CSV. A leading BOM
 * keeps Excel on UTF-8, and rows use CRLF endings per RFC 4180.
 */
export function buildBudgetCsv(month: BudgetMonth, summary: BudgetSummary): string {
  const lines: string[] = [];
  lines.push(["date", "category", "note", "amount"].join(","));
  for (const entry of summary.expenseEntries) {
    lines.push(
      [entry.date, entry.categoryName, entry.note, entry.amount]
        .map(escapeCsvValue)
        .join(",")
    );
  }
  lines.push("");
  lines.push(["summary", "amount"].join(","));
  lines.push(["Income", month.income].map(escapeCsvValue).join(","));
  lines.push(["Carried in", month.categories.reduce((sum, category) => sum + (category.carriedAmount ?? 0), 0)].map(escapeCsvValue).join(","));
  lines.push(["Budgeted", summary.budgetedTotal].map(escapeCsvValue).join(","));
  lines.push(["Spent", summary.spentTotal].map(escapeCsvValue).join(","));
  lines.push(
    ["Remaining to spend", summary.remainingToSpend].map(escapeCsvValue).join(",")
  );
  lines.push(["Savings target", month.savingsTarget].map(escapeCsvValue).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}
