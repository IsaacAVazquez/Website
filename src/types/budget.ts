export interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
  carryForward?: boolean;
  carriedAmount?: number;
}

export interface BudgetExpense {
  id: string;
  categoryId: string;
  amount: number;
  date: string;
  note: string;
  recurringId?: string;
}

export interface BudgetRecurringExpense {
  id: string;
  categoryId: string;
  amount: number;
  day: number;
  note: string;
}

export interface BudgetMonth {
  monthKey: string;
  income: number;
  savingsTarget: number;
  categories: BudgetCategory[];
  expenses: BudgetExpense[];
  recurringExpenses?: BudgetRecurringExpense[];
}

export type BudgetMonthMap = Record<string, BudgetMonth>;

export interface BudgetExpenseLine extends BudgetExpense {
  categoryName: string;
}

export interface BudgetCategorySummary extends BudgetCategory {
  availableAmount: number;
  spent: number;
  remaining: number;
  utilization: number;
  expenseCount: number;
  overBudget: boolean;
}

export interface BudgetSummary {
  availableToBudget: number;
  budgetedTotal: number;
  remainingToBudget: number;
  spentTotal: number;
  remainingToSpend: number;
  categorySummaries: BudgetCategorySummary[];
  expenseEntries: BudgetExpenseLine[];
  recentExpenses: BudgetExpenseLine[];
}
