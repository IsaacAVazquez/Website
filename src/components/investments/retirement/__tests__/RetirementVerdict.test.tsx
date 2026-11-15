import { render, screen } from "@testing-library/react";
import { createDefaultPlan, project } from "@/lib/retirement";
import type { RetirementPlanInput } from "@/lib/retirement";
import { RetirementVerdict } from "../RetirementVerdict";

function resultFor(strategy: RetirementPlanInput["assumptions"]["withdrawalStrategy"]) {
  const plan = createDefaultPlan();
  return project({ ...plan, assumptions: { ...plan.assumptions, withdrawalStrategy: strategy } }, 2026);
}

describe("RetirementVerdict", () => {
  it("says a guardrails count is about the money lasting, cuts included", () => {
    render(<RetirementVerdict result={resultFor("guardrails")} />);
    expect(screen.getByText(/keep money in the portfolio/)).toBeInTheDocument();
    expect(screen.getByText(/still counts here after those cuts/)).toBeInTheDocument();
  });

  it("keeps the plain spending line for fixed real withdrawals", () => {
    render(<RetirementVerdict result={resultFor("fixed-real")} />);
    expect(screen.getByText(/fund your spending/)).toBeInTheDocument();
    expect(screen.queryByText(/still counts here after those cuts/)).not.toBeInTheDocument();
  });
});
