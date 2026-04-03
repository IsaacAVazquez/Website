export interface BudgetCategory {
  id: string;
  name: string;
  budgetedAmount: number;
}

export interface BudgetExpense {
  id: string;
  categoryId: string;
  amount: number;
  date: string;
  note: string;
}

export interface BudgetMonth {
  monthKey: string;
  income: number;
  savingsTarget: number;
  categories: BudgetCategory[];
  expenses: BudgetExpense[];
}

export type BudgetMonthMap = Record<string, BudgetMonth>;

export interface BudgetExpenseLine extends BudgetExpense {
  categoryName: string;
}

export interface BudgetCategorySummary extends BudgetCategory {
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
