'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WarmCard from '@/components/ui/WarmCard';
import ModernButton from '@/components/ui/ModernButton';
import Heading from '@/components/ui/Heading';
import Paragraph from '@/components/ui/Paragraph';
import {
  IconPlus,
  IconWallet,
  IconTrendingUp,
  IconTrendingDown,
  IconPigMoney,
  IconEdit,
  IconTrash,
  IconDownload,
  IconUpload,
  IconChartPie,
} from '@tabler/icons-react';

// Types
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  budgetAmount: number;
  color: string;
  icon: string;
}

interface MonthlyData {
  month: string;
  transactions: Transaction[];
  categories: BudgetCategory[];
}

const defaultCategories: BudgetCategory[] = [
  { id: '1', name: 'Housing', budgetAmount: 0, color: '#FF6B35', icon: '🏠' },
  { id: '2', name: 'Food', budgetAmount: 0, color: '#F7B32B', icon: '🍔' },
  { id: '3', name: 'Transportation', budgetAmount: 0, color: '#FF8E53', icon: '🚗' },
  { id: '4', name: 'Entertainment', budgetAmount: 0, color: '#6BCF7F', icon: '🎬' },
  { id: '5', name: 'Utilities', budgetAmount: 0, color: '#00D9FF', icon: '💡' },
  { id: '6', name: 'Healthcare', budgetAmount: 0, color: '#B026FF', icon: '⚕️' },
  { id: '7', name: 'Shopping', budgetAmount: 0, color: '#FFB020', icon: '🛍️' },
  { id: '8', name: 'Other', budgetAmount: 0, color: '#888888', icon: '📦' },
];

export default function BudgetingContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>(defaultCategories);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  // Form states
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  // Category form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryBudget, setCategoryBudget] = useState('');
  const [categoryColor, setCategoryColor] = useState('#FF6B35');
  const [categoryIcon, setCategoryIcon] = useState('📦');

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('budgetData');
    if (saved) {
      try {
        const data: MonthlyData = JSON.parse(saved);
        if (data.month === currentMonth) {
          setTransactions(data.transactions || []);
          setCategories(data.categories || defaultCategories);
        }
      } catch (error) {
        console.error('Error loading budget data:', error);
      }
    }
  }, [currentMonth]);

  // Save data to localStorage
  useEffect(() => {
    const data: MonthlyData = {
      month: currentMonth,
      transactions,
      categories,
    };
    localStorage.setItem('budgetData', JSON.stringify(data));
  }, [transactions, categories, currentMonth]);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Calculate category spending
  const getCategorySpending = (categoryName: string) => {
    return transactions
      .filter((t) => t.type === 'expense' && t.category === categoryName)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Handle add/edit transaction
  const handleSaveTransaction = () => {
    if (!formCategory || !formAmount || !formDescription) return;

    const transaction: Transaction = {
      id: editingTransaction?.id || Date.now().toString(),
      type: formType,
      category: formCategory,
      amount: parseFloat(formAmount),
      description: formDescription,
      date: formDate,
    };

    if (editingTransaction) {
      setTransactions(transactions.map((t) => (t.id === transaction.id ? transaction : t)));
    } else {
      setTransactions([transaction, ...transactions]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormType('expense');
    setFormCategory('');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setShowAddTransaction(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormType(transaction.type);
    setFormCategory(transaction.category);
    setFormAmount(transaction.amount.toString());
    setFormDescription(transaction.description);
    setFormDate(transaction.date);
    setShowAddTransaction(true);
  };

  // Handle add category
  const handleAddCategory = () => {
    if (!categoryName || !categoryBudget) return;

    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: categoryName,
      budgetAmount: parseFloat(categoryBudget),
      color: categoryColor,
      icon: categoryIcon,
    };

    setCategories([...categories, newCategory]);
    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryBudget('');
    setCategoryColor('#FF6B35');
    setCategoryIcon('📦');
    setShowAddCategory(false);
  };

  const handleUpdateCategoryBudget = (categoryId: string, newBudget: number) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, budgetAmount: newBudget } : cat
      )
    );
  };

  // Export data
  const handleExportData = () => {
    const data: MonthlyData = { month: currentMonth, transactions, categories };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${currentMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data: MonthlyData = JSON.parse(event.target?.result as string);
        setTransactions(data.transactions || []);
        setCategories(data.categories || defaultCategories);
        setCurrentMonth(data.month || currentMonth);
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--neutral-50)] to-[var(--neutral-100)] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Heading level={1} className="mb-4">
            Budget Tracker
          </Heading>
          <Paragraph className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Take control of your finances with this simple and intuitive budgeting tool.
            Track your income, expenses, and savings goals all in one place.
          </Paragraph>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <WarmCard padding="lg" hoverLift>
            <div className="flex items-center justify-between">
              <div>
                <Paragraph className="text-[var(--text-secondary)] text-sm mb-1">
                  Total Income
                </Paragraph>
                <Heading level={3} className="text-[var(--color-tertiary)]">
                  ${totalIncome.toFixed(2)}
                </Heading>
              </div>
              <IconTrendingUp className="w-12 h-12 text-[var(--color-tertiary)] opacity-50" />
            </div>
          </WarmCard>

          <WarmCard padding="lg" hoverLift>
            <div className="flex items-center justify-between">
              <div>
                <Paragraph className="text-[var(--text-secondary)] text-sm mb-1">
                  Total Expenses
                </Paragraph>
                <Heading level={3} className="text-[var(--color-error)]">
                  ${totalExpenses.toFixed(2)}
                </Heading>
              </div>
              <IconTrendingDown className="w-12 h-12 text-[var(--color-error)] opacity-50" />
            </div>
          </WarmCard>

          <WarmCard padding="lg" hoverLift>
            <div className="flex items-center justify-between">
              <div>
                <Paragraph className="text-[var(--text-secondary)] text-sm mb-1">
                  Balance
                </Paragraph>
                <Heading
                  level={3}
                  className={balance >= 0 ? 'text-[var(--color-tertiary)]' : 'text-[var(--color-error)]'}
                >
                  ${balance.toFixed(2)}
                </Heading>
              </div>
              <IconPigMoney className="w-12 h-12 text-[var(--color-secondary)] opacity-50" />
            </div>
          </WarmCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-4 mb-8 justify-center"
        >
          <ModernButton
            variant="primary"
            onClick={() => setShowAddTransaction(true)}
            className="flex items-center gap-2"
          >
            <IconPlus className="w-5 h-5" />
            Add Transaction
          </ModernButton>
          <ModernButton
            variant="secondary"
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2"
          >
            <IconChartPie className="w-5 h-5" />
            Manage Categories
          </ModernButton>
          <ModernButton
            variant="outline"
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <IconDownload className="w-5 h-5" />
            Export Data
          </ModernButton>
          <label>
            <ModernButton
              variant="outline"
              as="span"
              className="flex items-center gap-2 cursor-pointer"
            >
              <IconUpload className="w-5 h-5" />
              Import Data
            </ModernButton>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </motion.div>

        {/* Add Transaction Form */}
        {showAddTransaction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8"
          >
            <WarmCard padding="lg">
              <Heading level={3} className="mb-6">
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'income' | 'expense')}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="">Select category</option>
                    {formType === 'expense' ? (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Salary">💼 Salary</option>
                        <option value="Freelance">💻 Freelance</option>
                        <option value="Investment">📈 Investment</option>
                        <option value="Other Income">💰 Other Income</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter description"
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <ModernButton variant="primary" onClick={handleSaveTransaction}>
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </ModernButton>
                <ModernButton variant="outline" onClick={resetForm}>
                  Cancel
                </ModernButton>
              </div>
            </WarmCard>
          </motion.div>
        )}

        {/* Add Category Form */}
        {showAddCategory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8"
          >
            <WarmCard padding="lg">
              <Heading level={3} className="mb-6">
                Add New Category
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g., Groceries"
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Monthly Budget ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={categoryBudget}
                    onChange={(e) => setCategoryBudget(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    placeholder="📦"
                    maxLength={2}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-full h-10 px-2 py-1 rounded-lg border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <ModernButton variant="primary" onClick={handleAddCategory}>
                  Add Category
                </ModernButton>
                <ModernButton variant="outline" onClick={resetCategoryForm}>
                  Cancel
                </ModernButton>
              </div>
            </WarmCard>
          </motion.div>
        )}

        {/* Budget Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <Heading level={2} className="mb-6">
            Budget by Category
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const spent = getCategorySpending(category.name);
              const percentage = category.budgetAmount > 0 ? (spent / category.budgetAmount) * 100 : 0;
              const isOverBudget = spent > category.budgetAmount && category.budgetAmount > 0;

              return (
                <WarmCard key={category.id} padding="lg" hoverLift>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <Heading level={4}>{category.name}</Heading>
                        <Paragraph className="text-sm text-[var(--text-secondary)]">
                          ${spent.toFixed(2)} / ${category.budgetAmount.toFixed(2)}
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                  {category.budgetAmount > 0 && (
                    <>
                      <div className="w-full bg-[var(--neutral-200)] rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isOverBudget ? 'bg-[var(--color-error)]' : 'bg-[var(--color-tertiary)]'
                          }`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <Paragraph
                        className={`text-sm ${
                          isOverBudget ? 'text-[var(--color-error)]' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {percentage.toFixed(1)}% used
                        {isOverBudget && ' (Over budget!)'}
                      </Paragraph>
                    </>
                  )}
                  <div className="mt-4">
                    <input
                      type="number"
                      step="0.01"
                      value={category.budgetAmount}
                      onChange={(e) =>
                        handleUpdateCategoryBudget(category.id, parseFloat(e.target.value) || 0)
                      }
                      placeholder="Set budget"
                      className="w-full px-3 py-1 text-sm rounded border border-[var(--border-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </WarmCard>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Heading level={2} className="mb-6">
            Recent Transactions
          </Heading>
          <WarmCard padding="none">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <IconWallet className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                <Paragraph className="text-[var(--text-secondary)]">
                  No transactions yet. Add your first transaction to get started!
                </Paragraph>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-primary)]">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 flex items-center justify-between hover:bg-[var(--neutral-100)] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.type === 'income'
                            ? 'bg-[var(--color-tertiary)] bg-opacity-20'
                            : 'bg-[var(--color-error)] bg-opacity-20'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <IconTrendingUp className="w-6 h-6 text-[var(--color-tertiary)]" />
                        ) : (
                          <IconTrendingDown className="w-6 h-6 text-[var(--color-error)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Heading level={5}>{transaction.description}</Heading>
                        <Paragraph className="text-sm text-[var(--text-secondary)]">
                          {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                        </Paragraph>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Heading
                        level={4}
                        className={
                          transaction.type === 'income'
                            ? 'text-[var(--color-tertiary)]'
                            : 'text-[var(--color-error)]'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </Heading>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-2 hover:bg-[var(--neutral-200)] rounded-lg transition-colors"
                          aria-label="Edit transaction"
                        >
                          <IconEdit className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2 hover:bg-[var(--color-error)] hover:bg-opacity-10 rounded-lg transition-colors"
                          aria-label="Delete transaction"
                        >
                          <IconTrash className="w-5 h-5 text-[var(--color-error)]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WarmCard>
        </motion.div>
      </div>
    </div>
  );
}
