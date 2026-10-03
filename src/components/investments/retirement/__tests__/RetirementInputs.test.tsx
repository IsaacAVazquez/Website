import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { RetirementInputs } from "../RetirementInputs";
import { createDefaultPlan, type RetirementPlanInput, type RetirementResult } from "@/lib/retirement";
import type { UseRetirementPlanReturn } from "@/hooks/useRetirementPlan";

function controllerFor(plan: RetirementPlanInput = createDefaultPlan(), isSampleScenario = false) {
  return {
    plan,
    result: null,
    ready: true,
    isComputing: false,
    hasError: false,
    persistenceStatus: { ok: true },
    isSampleScenario,
    updatePlan: jest.fn(),
    updateAssumptions: jest.fn(),
    updateAllocation: jest.fn(),
    updateOtherIncome: jest.fn(),
    addAccount: jest.fn(),
    updateAccount: jest.fn(),
    removeAccount: jest.fn(),
    addLumpyExpense: jest.fn(),
    updateLumpyExpense: jest.fn(),
    removeLumpyExpense: jest.fn(),
    applyPortfolioBalance: jest.fn(),
    reset: jest.fn(),
  } as unknown as jest.Mocked<UseRetirementPlanReturn>;
}

/**
 * The control under a field's visible label. Each field's <label> also wraps
 * its "$"/"%" affix and its hint, so a label-text query has to spell those out;
 * finding the label's own caption keeps these tests on the words a visitor reads.
 */
function field(label: string, index = 0) {
  const caption = screen.getAllByText(label, { selector: ".invest-retire-field-label" })[index];
  return caption.closest("label")!.querySelector("input, select") as HTMLInputElement;
}

function type(label: string, value: string, index = 0) {
  const input = field(label, index);
  fireEvent.change(input, { target: { value } });
  return input;
}

describe("RetirementInputs", () => {
  it("captions a seeded plan as an example and an edited one as the visitor's", () => {
    const { rerender } = render(<RetirementInputs controller={controllerFor(undefined, true)} result={null} />);
    expect(screen.getByText("Example numbers")).toBeInTheDocument();
    rerender(<RetirementInputs controller={controllerFor(undefined, false)} result={null} />);
    expect(screen.getByText("Your numbers")).toBeInTheDocument();
  });

  it("asks before resetting the plan", () => {
    const controller = controllerFor();
    render(<RetirementInputs controller={controller} result={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(controller.reset).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset plan?" }));
    expect(controller.reset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Reset plan?" })).toBeNull();
  });

  it("commits quick-start edits, rounding ages and clamping to the field's range", () => {
    const controller = controllerFor();
    render(<RetirementInputs controller={controller} result={null} />);

    expect(field("Current age").value).toBe("35");
    type("Current age", "41.6");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({ currentAge: 42 });
    type("Current age", "10");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({ currentAge: 18 });
    type("Retirement age", "120");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({ retirementAge: 90 });
    type("Plan to age", "99.4");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({ horizonAge: 99 });
    type("Desired annual spend", "72000");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({ desiredAnnualSpend: 72000 });

    type("Current balance", "80000");
    expect(controller.updateAccount).toHaveBeenLastCalledWith("primary", { balance: 80000 });
    type("Annual savings", "-500");
    expect(controller.updateAccount).toHaveBeenLastCalledWith("primary", { annualContribution: 0 });
  });

  it("does not commit a cleared field", () => {
    const controller = controllerFor();
    render(<RetirementInputs controller={controller} result={null} />);
    const input = type("Desired annual spend", "");
    expect(controller.updatePlan).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("creates a primary account when the plan has none", () => {
    const controller = controllerFor({ ...createDefaultPlan(), accounts: [] });
    render(<RetirementInputs controller={controller} result={null} />);

    expect(field("Current balance").value).toBe("0");
    type("Current balance", "5000");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({
      accounts: [{ id: "primary", type: "traditional", balance: 5000, annualContribution: 0, employerMatch: 0 }],
    });
    type("Annual savings", "1200");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({
      accounts: [{ id: "primary", type: "traditional", balance: 0, annualContribution: 1200, employerMatch: 0 }],
    });
  });

  it("totals balances and contributions across several accounts", () => {
    const plan = createDefaultPlan();
    plan.accounts.push({ id: "roth-1", type: "roth", balance: 100000, annualContribution: 6500, employerMatch: 3000 });
    render(<RetirementInputs controller={controllerFor(plan)} result={null} />);
    expect(screen.getByText("Total across 2 accounts: $150K")).toBeInTheDocument();
    expect(screen.getByText("Total contributions: $19.5K")).toBeInTheDocument();
  });

  it("offers the portfolio balance as a seed only when there is one", () => {
    const controller = controllerFor();
    const { rerender } = render(<RetirementInputs controller={controller} result={null} portfolioValue={123456} />);
    fireEvent.click(screen.getByRole("button", { name: "Use my portfolio balance ($123.5K)" }));
    expect(controller.applyPortfolioBalance).toHaveBeenCalledWith(123456);

    rerender(<RetirementInputs controller={controller} result={null} portfolioValue={0} />);
    expect(screen.queryByRole("button", { name: /Use my portfolio balance/ })).toBeNull();
  });

  it("edits, adds, and removes accounts by tax type", () => {
    const controller = controllerFor();
    render(<RetirementInputs controller={controller} result={null} />);

    fireEvent.change(field("Type"), { target: { value: "roth" } });
    expect(controller.updateAccount).toHaveBeenLastCalledWith("primary", { type: "roth" });
    type("Employer match", "2500");
    expect(controller.updateAccount).toHaveBeenLastCalledWith("primary", { employerMatch: 2500 });
    type("Balance", "64000");
    expect(controller.updateAccount).toHaveBeenLastCalledWith("primary", { balance: 64000 });
    type("Annual contribution", "7000");
    expect(controller.updateAccount).toHaveBeenLastCalledWith("primary", { annualContribution: 7000 });

    // Contribution growth defaults to inflation and is entered as a percent.
    expect(field("Contribution growth").value).toBe("2.5");
    type("Contribution growth", "3");
    expect(controller.updateAccount).toHaveBeenLastCalledWith("primary", { contributionGrowth: 0.03 });

    fireEvent.click(screen.getByRole("button", { name: "Remove account" }));
    expect(controller.removeAccount).toHaveBeenCalledWith("primary");
    fireEvent.click(screen.getByRole("button", { name: "Add account" }));
    expect(controller.addAccount).toHaveBeenCalledTimes(1);
  });

  it("summarises the allocation's return and checks that the weights add up", () => {
    const controller = controllerFor();
    const result = { expectedReturn: 0.0712, volatility: 0.1534 } as RetirementResult;
    const { rerender } = render(<RetirementInputs controller={controller} result={result} />);

    expect(screen.getByText("7.1% return · 15.3% vol")).toBeInTheDocument();
    expect(screen.getByText(/Total: 100%/)).toHaveTextContent("Total: 100% ✓");

    type("Stocks", "70");
    expect(controller.updateAllocation).toHaveBeenLastCalledWith({ stocks: 70 });
    type("Bonds", "25");
    expect(controller.updateAllocation).toHaveBeenLastCalledWith({ bonds: 25 });
    type("Cash", "150");
    expect(controller.updateAllocation).toHaveBeenLastCalledWith({ cash: 100 });
    type("Other / real assets", "5");
    expect(controller.updateAllocation).toHaveBeenLastCalledWith({ other: 5 });

    const plan = createDefaultPlan();
    plan.allocation = { stocks: 70, bonds: 15, cash: 5, other: 0 };
    rerender(<RetirementInputs controller={controllerFor(plan)} result={null} />);
    const note = screen.getByText(/Total: 90%/);
    expect(note).toHaveTextContent("Total: 90% (weights are normalized automatically)");
    expect(note.className).toContain("warn");
    expect(screen.queryByText(/return · .* vol/)).toBeNull();
  });

  it("commits other income, clamping the Social Security claim age to 62–70", () => {
    const controller = controllerFor();
    render(<RetirementInputs controller={controller} result={null} />);

    type("Social Security / yr", "30000");
    expect(controller.updateOtherIncome).toHaveBeenLastCalledWith({ socialSecurityAnnual: 30000 });
    type("Claim age", "72");
    expect(controller.updateOtherIncome).toHaveBeenLastCalledWith({ socialSecurityClaimAge: 70 });
    type("Pension / yr", "12000");
    expect(controller.updateOtherIncome).toHaveBeenLastCalledWith({ pensionAnnual: 12000 });
    type("Pension start age", "60.4");
    expect(controller.updateOtherIncome).toHaveBeenLastCalledWith({ pensionStartAge: 60 });
    type("Part-time income / yr", "20000");
    expect(controller.updateOtherIncome).toHaveBeenLastCalledWith({ partTimeAnnual: 20000 });
    // Part-time work cannot start before the retirement age.
    type("Part-time from age", "50");
    expect(controller.updateOtherIncome).toHaveBeenLastCalledWith({ partTimeStartAge: 65 });
    type("Part-time until age", "72");
    expect(controller.updateOtherIncome).toHaveBeenLastCalledWith({ partTimeEndAge: 72 });
  });

  it("edits one-time expenses with labelled controls", () => {
    const plan = createDefaultPlan();
    plan.lumpyExpenses = [
      { id: "wed", label: "Wedding", amount: 30000, age: 40 },
      { id: "blank", label: "", amount: 5000, age: 50 },
    ];
    const controller = controllerFor(plan);
    render(<RetirementInputs controller={controller} result={null} />);

    type("Extra healthcare before Medicare (65) / yr", "8000");
    expect(controller.updatePlan).toHaveBeenLastCalledWith({ preMedicareHealthcare: 8000 });

    fireEvent.change(screen.getAllByLabelText("Expense label")[0], { target: { value: "Roof" } });
    expect(controller.updateLumpyExpense).toHaveBeenLastCalledWith("wed", { label: "Roof" });
    type("Amount", "45000", 0);
    expect(controller.updateLumpyExpense).toHaveBeenLastCalledWith("wed", { amount: 45000 });
    // An expense cannot land before today's age.
    type("At age", "20", 1);
    expect(controller.updateLumpyExpense).toHaveBeenLastCalledWith("blank", { age: 35 });

    fireEvent.click(screen.getByRole("button", { name: "Remove Wedding expense" }));
    expect(controller.removeLumpyExpense).toHaveBeenCalledWith("wed");
    fireEvent.click(screen.getByRole("button", { name: "Remove this expense" }));
    expect(controller.removeLumpyExpense).toHaveBeenCalledWith("blank");
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    expect(controller.addLumpyExpense).toHaveBeenCalledTimes(1);
  });

  it("enters assumptions as percents and stores them as decimals", () => {
    const controller = controllerFor();
    render(<RetirementInputs controller={controller} result={null} />);

    fireEvent.change(field("Withdrawal strategy"), { target: { value: "guardrails" } });
    expect(controller.updateAssumptions).toHaveBeenLastCalledWith({ withdrawalStrategy: "guardrails" });

    expect(field("Withdrawal rate (target #)").value).toBe("4");
    type("Withdrawal rate (target #)", "3.5");
    expect(controller.updateAssumptions).toHaveBeenLastCalledWith({ withdrawalRateOverride: 0.035 });
    type("Inflation", "3");
    expect(controller.updateAssumptions).toHaveBeenLastCalledWith({ inflation: 0.03 });
    type("Healthcare inflation", "20");
    expect(controller.updateAssumptions).toHaveBeenLastCalledWith({ healthcareInflation: 0.15 });
    type("On-track threshold", "90");
    expect(controller.updateAssumptions).toHaveBeenLastCalledWith({ successThreshold: 0.9 });

    const { taxRates } = createDefaultPlan().assumptions;
    type("Tax on traditional withdrawals", "22");
    expect(controller.updateAssumptions).toHaveBeenLastCalledWith({ taxRates: { ...taxRates, traditional: 0.22 } });
    type("Tax on taxable withdrawals", "15");
    expect(controller.updateAssumptions).toHaveBeenLastCalledWith({ taxRates: { ...taxRates, taxable: 0.15 } });
  });
});
