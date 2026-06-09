"use client";

import React from "react";
import { IconTrash, IconPlus, IconRefresh, IconWallet } from "@tabler/icons-react";
import type { UseRetirementPlanReturn } from "@/hooks/useRetirementPlan";
import type { AccountType, RetirementResult, WithdrawalStrategy } from "@/lib/retirement";
import { formatCompactCurrency, formatPercent } from "@/lib/retirement";
import { Collapsible, NumberField, SelectField } from "./RetirementFields";

interface Props {
  controller: UseRetirementPlanReturn;
  result: RetirementResult | null;
  /** Current portfolio value, if any, offered as a one-click balance seed. */
  portfolioValue?: number;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "taxable", label: "Taxable brokerage" },
  { value: "traditional", label: "Traditional 401k / IRA" },
  { value: "roth", label: "Roth" },
  { value: "hsa", label: "HSA" },
];

const STRATEGIES: { value: WithdrawalStrategy; label: string }[] = [
  { value: "fixed-real", label: "Fixed real (4%-rule style)" },
  { value: "guardrails", label: "Dynamic guardrails (smart)" },
  { value: "fixed-percent", label: "Fixed % of balance" },
];

export function RetirementInputs({ controller, result, portfolioValue }: Props) {
  const {
    plan,
    updatePlan,
    updateAssumptions,
    updateAllocation,
    updateOtherIncome,
    addAccount,
    updateAccount,
    removeAccount,
    addLumpyExpense,
    updateLumpyExpense,
    removeLumpyExpense,
    applyPortfolioBalance,
    reset,
  } = controller;

  const primary = plan.accounts[0];
  const totalBalance = plan.accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalContribution = plan.accounts.reduce(
    (s, a) => s + (a.annualContribution || 0) + (a.employerMatch || 0),
    0,
  );
  const allocTotal =
    plan.allocation.stocks + plan.allocation.bonds + plan.allocation.cash + plan.allocation.other;

  function setPrimaryBalance(value: number) {
    if (primary) updateAccount(primary.id, { balance: value });
    else updatePlan({ accounts: [{ id: "primary", type: "traditional", balance: value, annualContribution: 0, employerMatch: 0 }] });
  }
  function setPrimaryContribution(value: number) {
    if (primary) updateAccount(primary.id, { annualContribution: value });
    else updatePlan({ accounts: [{ id: "primary", type: "traditional", balance: 0, annualContribution: value, employerMatch: 0 }] });
  }

  return (
    <div className="invest-retire-inputs">
      <div className="invest-retire-inputs-head">
        <p className="invest-rail-section-label">
          <IconWallet size={12} aria-hidden="true" className="mr-1.5 inline align-middle" />
          Your numbers
        </p>
        <button type="button" className="invest-retire-reset" onClick={reset}>
          <IconRefresh size={13} aria-hidden="true" /> Reset
        </button>
      </div>

      {/* ── Quick start — instant first number ── */}
      <div className="invest-retire-grid-2">
        <NumberField label="Current age" value={plan.currentAge} min={18} max={90}
          onChange={(v) => updatePlan({ currentAge: Math.round(v) })} />
        <NumberField label="Retirement age" value={plan.retirementAge} min={plan.currentAge + 1} max={90}
          onChange={(v) => updatePlan({ retirementAge: Math.round(v) })} />
        <NumberField label="Current balance" value={primary?.balance ?? 0} prefix="$" min={0} step={1000}
          onChange={setPrimaryBalance}
          hint={plan.accounts.length > 1 ? `Total across ${plan.accounts.length} accounts: ${formatCompactCurrency(totalBalance)}` : undefined} />
        <NumberField label="Annual savings" value={primary?.annualContribution ?? 0} prefix="$" min={0} step={500}
          onChange={setPrimaryContribution}
          hint={plan.accounts.length > 1 ? `Total contributions: ${formatCompactCurrency(totalContribution)}` : undefined} />
        <NumberField label="Desired annual spend" value={plan.desiredAnnualSpend} prefix="$" min={0} step={1000}
          onChange={(v) => updatePlan({ desiredAnnualSpend: v })} hint="In today's dollars" />
        <NumberField label="Plan to age" value={plan.horizonAge} min={plan.retirementAge + 1} max={110}
          onChange={(v) => updatePlan({ horizonAge: Math.round(v) })} hint="Conservative life expectancy" />
      </div>

      {portfolioValue && portfolioValue > 0 ? (
        <button type="button" className="invest-retire-seed" onClick={() => applyPortfolioBalance(portfolioValue)}>
          Use my portfolio balance ({formatCompactCurrency(portfolioValue)})
        </button>
      ) : null}

      {/* ── Accounts by tax type ── */}
      <Collapsible title="Accounts by tax type" summary="taxable · traditional · Roth · HSA">
        <div className="invest-retire-accounts">
          {plan.accounts.map((account) => (
            <div key={account.id} className="invest-retire-account">
              <div className="invest-retire-account-head">
                <SelectField label="Type" value={account.type} options={ACCOUNT_TYPES}
                  onChange={(v) => updateAccount(account.id, { type: v })} />
                <button type="button" className="invest-retire-icon-btn" aria-label="Remove account"
                  onClick={() => removeAccount(account.id)}>
                  <IconTrash size={15} aria-hidden="true" />
                </button>
              </div>
              <div className="invest-retire-grid-2">
                <NumberField label="Balance" value={account.balance} prefix="$" min={0} step={1000}
                  onChange={(v) => updateAccount(account.id, { balance: v })} />
                <NumberField label="Annual contribution" value={account.annualContribution} prefix="$" min={0} step={500}
                  onChange={(v) => updateAccount(account.id, { annualContribution: v })} />
                <NumberField label="Employer match" value={account.employerMatch} prefix="$" min={0} step={500}
                  onChange={(v) => updateAccount(account.id, { employerMatch: v })} />
                <NumberField label="Contribution growth" value={account.contributionGrowth ?? plan.assumptions.inflation}
                  suffix="%" min={0} max={20} step={0.1} asPercent
                  onChange={(v) => updateAccount(account.id, { contributionGrowth: v })} />
              </div>
            </div>
          ))}
          <button type="button" className="invest-retire-add" onClick={addAccount}>
            <IconPlus size={14} aria-hidden="true" /> Add account
          </button>
        </div>
      </Collapsible>

      {/* ── Allocation ── */}
      <Collapsible
        title="Asset allocation"
        summary={result ? `${formatPercent(result.expectedReturn, 1)} return · ${formatPercent(result.volatility, 1)} vol` : undefined}
      >
        <div className="invest-retire-grid-2">
          <NumberField label="Stocks" value={plan.allocation.stocks} suffix="%" min={0} max={100} step={5}
            onChange={(v) => updateAllocation({ stocks: v })} />
          <NumberField label="Bonds" value={plan.allocation.bonds} suffix="%" min={0} max={100} step={5}
            onChange={(v) => updateAllocation({ bonds: v })} />
          <NumberField label="Cash" value={plan.allocation.cash} suffix="%" min={0} max={100} step={5}
            onChange={(v) => updateAllocation({ cash: v })} />
          <NumberField label="Other / real assets" value={plan.allocation.other} suffix="%" min={0} max={100} step={5}
            onChange={(v) => updateAllocation({ other: v })} />
        </div>
        <p className={`invest-retire-alloc-note ${Math.abs(allocTotal - 100) > 0.5 ? "warn" : ""}`}>
          Total: {allocTotal.toFixed(0)}% {Math.abs(allocTotal - 100) > 0.5 ? "(weights are normalized automatically)" : "✓"}
        </p>
      </Collapsible>

      {/* ── Other income ── */}
      <Collapsible title="Other retirement income" summary="Social Security · pension · part-time">
        <div className="invest-retire-grid-2">
          <NumberField label="Social Security / yr" value={plan.otherIncome.socialSecurityAnnual} prefix="$" min={0} step={500}
            onChange={(v) => updateOtherIncome({ socialSecurityAnnual: v })} hint="FRA estimate from ssa.gov" />
          <NumberField label="Claim age" value={plan.otherIncome.socialSecurityClaimAge} min={62} max={70}
            onChange={(v) => updateOtherIncome({ socialSecurityClaimAge: Math.round(v) })} hint="62–70; delaying adds ~8%/yr" />
          <NumberField label="Pension / yr" value={plan.otherIncome.pensionAnnual} prefix="$" min={0} step={500}
            onChange={(v) => updateOtherIncome({ pensionAnnual: v })} />
          <NumberField label="Pension start age" value={plan.otherIncome.pensionStartAge} min={50} max={90}
            onChange={(v) => updateOtherIncome({ pensionStartAge: Math.round(v) })} />
          <NumberField label="Part-time income / yr" value={plan.otherIncome.partTimeAnnual} prefix="$" min={0} step={500}
            onChange={(v) => updateOtherIncome({ partTimeAnnual: v })} />
          <NumberField label="Part-time until age" value={plan.otherIncome.partTimeEndAge} min={plan.retirementAge} max={90}
            onChange={(v) => updateOtherIncome({ partTimeEndAge: Math.round(v) })} />
        </div>
      </Collapsible>

      {/* ── Spending details ── */}
      <Collapsible title="Spending details" summary="healthcare gap · one-time expenses">
        <NumberField label="Extra healthcare before Medicare (65) / yr" value={plan.preMedicareHealthcare} prefix="$" min={0} step={500}
          onChange={(v) => updatePlan({ preMedicareHealthcare: v })} hint="Modeled with faster healthcare inflation" />
        <div className="invest-retire-lumpy">
          <span className="invest-retire-field-label">One-time / lumpy expenses</span>
          {plan.lumpyExpenses.map((expense) => (
            <div key={expense.id} className="invest-retire-lumpy-row">
              <input className="invest-retire-lumpy-label" value={expense.label}
                onChange={(e) => updateLumpyExpense(expense.id, { label: e.target.value })} aria-label="Expense label" />
              <NumberField label="Amount" value={expense.amount} prefix="$" min={0} step={1000}
                onChange={(v) => updateLumpyExpense(expense.id, { amount: v })} />
              <NumberField label="At age" value={expense.age} min={plan.currentAge} max={plan.horizonAge}
                onChange={(v) => updateLumpyExpense(expense.id, { age: Math.round(v) })} />
              <button type="button" className="invest-retire-icon-btn" aria-label="Remove expense"
                onClick={() => removeLumpyExpense(expense.id)}>
                <IconTrash size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="invest-retire-add" onClick={addLumpyExpense}>
            <IconPlus size={14} aria-hidden="true" /> Add expense
          </button>
        </div>
      </Collapsible>

      {/* ── Assumptions ── */}
      <Collapsible title="Assumptions" summary="returns, inflation, taxes, withdrawal rule">
        <div className="invest-retire-grid-2">
          <SelectField label="Filing status" value={plan.filingStatus}
            options={[{ value: "single", label: "Single" }, { value: "married", label: "Married" }]}
            onChange={(v) => updatePlan({ filingStatus: v })} />
          <SelectField label="Withdrawal strategy" value={plan.assumptions.withdrawalStrategy} options={STRATEGIES}
            onChange={(v) => updateAssumptions({ withdrawalStrategy: v })} />
          <NumberField label="Inflation" value={plan.assumptions.inflation} suffix="%" min={0} max={10} step={0.1} asPercent
            onChange={(v) => updateAssumptions({ inflation: v })} />
          <NumberField label="Healthcare inflation" value={plan.assumptions.healthcareInflation} suffix="%" min={0} max={15} step={0.1} asPercent
            onChange={(v) => updateAssumptions({ healthcareInflation: v })} />
          <NumberField label="Withdrawal rate (target #)" value={plan.assumptions.withdrawalRateOverride ?? 0.04}
            suffix="%" min={1} max={10} step={0.1} asPercent
            onChange={(v) => updateAssumptions({ withdrawalRateOverride: v })} hint="Default 4%; edit to your safe rate" />
          <NumberField label="On-track threshold" value={plan.assumptions.successThreshold} suffix="%" min={50} max={99} step={1} asPercent
            onChange={(v) => updateAssumptions({ successThreshold: v })} hint="85–90% is typical" />
          <NumberField label="Tax — traditional withdrawals" value={plan.assumptions.taxRates.traditional} suffix="%" min={0} max={50} step={1} asPercent
            onChange={(v) => updateAssumptions({ taxRates: { ...plan.assumptions.taxRates, traditional: v } })} />
          <NumberField label="Tax — taxable withdrawals" value={plan.assumptions.taxRates.taxable} suffix="%" min={0} max={40} step={1} asPercent
            onChange={(v) => updateAssumptions({ taxRates: { ...plan.assumptions.taxRates, taxable: v } })} />
        </div>
      </Collapsible>
    </div>
  );
}
