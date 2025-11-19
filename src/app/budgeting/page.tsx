import { Metadata } from 'next';
import BudgetingContent from '@/components/BudgetingContent';

export const metadata: Metadata = {
  title: 'Budget Tracker | Isaac Vazquez',
  description: 'Simple and intuitive budgeting tool to track your income, expenses, and savings goals.',
  keywords: ['budget tracker', 'personal finance', 'expense tracking', 'money management', 'savings'],
  openGraph: {
    title: 'Budget Tracker | Isaac Vazquez',
    description: 'Simple and intuitive budgeting tool to track your income, expenses, and savings goals.',
    url: 'https://isaacavazquez.com/budgeting',
    type: 'website',
  },
};

export default function BudgetingPage() {
  return <BudgetingContent />;
}
