import type {
  BudgetCategory,
  BudgetCategorySummary,
  BudgetExpense,
  BudgetExpenseLine,
  BudgetMonth,
  BudgetMonthMap,
  BudgetSummary,
} from "@/types/budget";

export const BUDGET_PLANNER_STORAGE_KEY = "budget_planner_months_v1";

export const DEFAULT_BUDGET_CATEGORY_NAMES = [
  "Housing",
  "Utilities",
  "Groceries",
  "Transportation",
  "Health",
  "Personal",
  "Entertainment",
];

function roundCurrency(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function sanitizeNonNegativeAmount(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Math.max(0, roundCurrency(numeric));
}

function createId(prefix: "cat" | "exp") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isBudgetMonthKey(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export function getCurrentBudgetMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseBudgetMonthKey(monthKey: string) {
  if (!isBudgetMonthKey(monthKey)) return null;

  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function getAdjacentBudgetMonthKey(monthKey: string, offset: number) {
  const baseDate = parseBudgetMonthKey(monthKey) ?? new Date();
  baseDate.setMonth(baseDate.getMonth() + offset);
  return getCurrentBudgetMonthKey(baseDate);
}

export function formatBudgetMonthLabel(monthKey: string) {
  const date = parseBudgetMonthKey(monthKey);
  if (!date) return monthKey;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getDefaultExpenseDate(monthKey: string, now = new Date()) {
  if (getCurrentBudgetMonthKey(now) === monthKey) {
    const day = String(now.getDate()).padStart(2, "0");
    return `${monthKey}-${day}`;
  }

  return `${monthKey}-01`;
}

export function createBudgetCategory(name: string, budgetedAmount = 0): BudgetCategory {
  return {
    id: createId("cat"),
    name,
    budgetedAmount: sanitizeNonNegativeAmount(budgetedAmount),
  };
}

export function createBudgetExpense(input: Omit<BudgetExpense, "id">): BudgetExpense {
  return {
    id: createId("exp"),
    categoryId: input.categoryId,
    amount: sanitizeNonNegativeAmount(input.amount),
    date: input.date,
    note: input.note.trim(),
  };
}

export function getDefaultBudgetCategories() {
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
    id: typeof input.id === "string" && input.id ? input.id : createId("cat"),
    name: rawName || "Untitled",
    budgetedAmount: sanitizeNonNegativeAmount(input.budgetedAmount),
  };
}

function sanitizeBudgetExpense(input: unknown): BudgetExpense | null {
  if (!isRecord(input)) return null;
  if (typeof input.categoryId !== "string" || !input.categoryId) return null;
  if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return null;

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("exp"),
    categoryId: input.categoryId,
    amount: sanitizeNonNegativeAmount(input.amount),
    date: input.date,
    note: typeof input.note === "string" ? input.note.trim().slice(0, 140) : "",
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

  const expenses = Array.isArray(input.expenses)
    ? input.expenses
        .map((expense) => sanitizeBudgetExpense(expense))
        .filter((expense): expense is BudgetExpense => expense !== null)
    : [];

  return {
    monthKey: monthKeySource,
    income: sanitizeNonNegativeAmount(input.income),
    savingsTarget: sanitizeNonNegativeAmount(input.savingsTarget),
    categories: categories.length > 0 ? categories : getDefaultBudgetCategories(),
    expenses,
  };
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
  return parseBudgetMonths(window.localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY));
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
  window.localStorage.setItem(BUDGET_PLANNER_STORAGE_KEY, JSON.stringify(months));
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
      const remaining = roundCurrency(category.budgetedAmount - spent);
      const utilization =
        category.budgetedAmount > 0
          ? spent / category.budgetedAmount
          : spent > 0
            ? 1
            : 0;

      return {
        ...category,
        spent,
        remaining,
        utilization,
        expenseCount: expenseCounts.get(category.id) ?? 0,
        overBudget: spent > category.budgetedAmount,
      };
    })
    .sort((left, right) => {
      if (left.overBudget !== right.overBudget) {
        return Number(right.overBudget) - Number(left.overBudget);
      }

      return right.spent - left.spent;
    });

  const budgetedTotal = roundCurrency(
    month.categories.reduce((sum, category) => sum + category.budgetedAmount, 0)
  );
  const spentTotal = roundCurrency(month.expenses.reduce((sum, expense) => sum + expense.amount, 0));
  const availableToBudget = roundCurrency(month.income - month.savingsTarget);

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

/** RFC 4180 quoting for a CSV field. */
export function escapeCsvValue(value: string | number): string {
  const raw = String(value);
  return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
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
  lines.push(["Budgeted", summary.budgetedTotal].map(escapeCsvValue).join(","));
  lines.push(["Spent", summary.spentTotal].map(escapeCsvValue).join(","));
  lines.push(
    ["Remaining to spend", summary.remainingToSpend].map(escapeCsvValue).join(",")
  );
  lines.push(["Savings target", month.savingsTarget].map(escapeCsvValue).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}
