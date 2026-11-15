"use client";

import { formatCurrency, formatScenarioCount } from "@/lib/retirement";
import {
  changedPlanGroups,
  type compareRetirementScenarios,
} from "@/lib/retirement/scenarios";

export function RetirementScenarioTable({
  results,
}: {
  results: ReturnType<typeof compareRetirementScenarios>;
}) {
  return (
    <div
      className="pw-scroll"
      tabIndex={0}
      role="region"
      aria-label="Retirement plan comparison"
    >
      <table className="pw-table">
        <caption>Saved plans and recalculated results</caption>
        <thead>
          <tr>
            <th scope="col">Plan</th>
            <th scope="col">Ages now / retirement / horizon</th>
            <th scope="col">Annual contributions</th>
            <th scope="col">Annual spending</th>
            <th scope="col">Funded scenarios</th>
            <th scope="col">Median ending balance</th>
            <th scope="col">Assumptions</th>
            <th scope="col">Changes from first plan</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row, i) => (
            <tr key={row.id}>
              <th scope="row">{row.name}</th>
              <td>
                {row.plan.currentAge} / {row.plan.retirementAge} /{" "}
                {row.plan.horizonAge}
              </td>
              <td>
                {formatCurrency(
                  row.plan.accounts.reduce(
                    (sum, account) =>
                      sum + account.annualContribution + account.employerMatch,
                    0,
                  ),
                )}
              </td>
              <td>{formatCurrency(row.plan.desiredAnnualSpend)}</td>
              <td>
                {row.result
                  ? formatScenarioCount(row.result.monteCarlo.successRate)
                  : "Projection unavailable"}
              </td>
              <td>
                {row.result
                  ? formatCurrency(row.result.monteCarlo.endingBalance.p50)
                  : "Unknown"}
              </td>
              <td>
                {(row.plan.assumptions.inflation * 100).toFixed(1)}% inflation;{" "}
                {row.plan.assumptions.simulations} trials; seed{" "}
                {row.plan.assumptions.seed};{" "}
                {row.result?.assumptions.cmaAsOf ?? "Unknown assumption date"}
              </td>
              <td>
                {i === 0
                  ? "Reference plan"
                  : changedPlanGroups(results[0].plan, row.plan).join(", ") ||
                    "Same inputs"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
