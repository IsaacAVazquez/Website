"use client";

import { useState, type FormEvent } from "react";
import type { BudgetMonth } from "@/types/budget";
import { formatDollars } from "@/lib/utils";

interface Props {
  month: BudgetMonth;
  canCopyPrevious: boolean;
  onCopy: () => void;
  onAdd: (draft: {
    categoryId: string;
    amount: number;
    day: number;
    note: string;
  }) => void;
  onRemove: (id: string) => void;
  onRecord: () => void;
}

export function BudgetRepeatingCosts({
  month,
  canCopyPrevious,
  onCopy,
  onAdd,
  onRemove,
  onRecord,
}: Props) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [note, setNote] = useState("");
  const bills = month.recurringExpenses ?? [];
  const categoryId = month.categories.some((c) => c.id === category)
    ? category
    : (month.categories[0]?.id ?? "");
  const remaining = bills.filter(
    (bill) =>
      !month.expenses.some((expense) => expense.recurringId === bill.id),
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!categoryId || !Number.isFinite(Number(amount)) || Number(amount) <= 0)
      return;
    onAdd({ categoryId, amount: Number(amount), day: Number(day), note });
    setAmount("");
    setNote("");
  }
  return (
    <details className="bp-repeat">
      <summary>Reuse a plan and recurring bills</summary>
      <div className="bp-repeat-body">
        <p>
          Copy last month’s income, savings target, categories, and recurring
          bills into an empty month. Categories checked for carry forward also
          bring their unused balance.
        </p>
        <button
          type="button"
          className="bp-link"
          disabled={!canCopyPrevious}
          onClick={onCopy}
        >
          Copy previous month’s plan
        </button>
        {!canCopyPrevious && (
          <p className="bp-storage">
            Needs a saved previous month and an empty plan for this month.
          </p>
        )}
        <h2>Recurring bills</h2>
        <p>
          Save monthly bills here, then record them when ready. Recording counts
          them as spending. A day beyond the month’s end uses its last day.
        </p>
        <form className="bp-repeat-form" onSubmit={submit}>
          <label>
            Bill name
            <input
              className="bp-field"
              value={note}
              maxLength={140}
              required
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label>
            Bill category
            <select
              className="bp-field"
              value={categoryId}
              onChange={(e) => setCategory(e.target.value)}
            >
              {month.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bill amount
            <input
              className="bp-field"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Day of month
            <input
              className="bp-field"
              type="number"
              min="1"
              max="31"
              required
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </label>
          <button className="bp-link" type="submit" disabled={!categoryId}>
            Save recurring bill
          </button>
        </form>
        {bills.length === 0 ? (
          <p>No recurring bills saved for this plan.</p>
        ) : (
          <ul className="bp-repeat-list">
            {bills.map((bill) => (
              <li key={bill.id}>
                <span>
                  {bill.note || "Monthly bill"} · {formatDollars(bill.amount)} ·
                  day {bill.day}
                  {month.expenses.some((e) => e.recurringId === bill.id)
                    ? " · recorded"
                    : " · not recorded yet"}
                </span>
                <button
                  className="bp-link"
                  type="button"
                  aria-label={`Remove recurring bill ${bill.note}`}
                  onClick={() => onRemove(bill.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          className="bp-link"
          type="button"
          disabled={remaining.length === 0}
          onClick={onRecord}
        >
          Record this month’s bills
          {remaining.length > 0 ? ` (${remaining.length})` : ""}
        </button>
      </div>
    </details>
  );
}
