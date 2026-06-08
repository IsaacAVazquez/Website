"use client";

import React from "react";
import type { RetirementResult } from "@/lib/retirement";
import { CAPITAL_MARKET_ASSUMPTIONS, formatPercent } from "@/lib/retirement";
import type { AssetClassId } from "@/lib/retirement";

interface Props {
  result: RetirementResult;
}

const STRATEGY_LABEL: Record<string, string> = {
  "fixed-real": "Fixed real (4%-rule style)",
  "fixed-percent": "Fixed % of balance",
  guardrails: "Dynamic guardrails (Guyton-Klinger)",
};

/**
 * Disclose every assumption on screen with its source + as-of date — both a UX
 * best practice and a compliance requirement (spec §6.4, §9). Values are edited
 * in the Assumptions section of the form; this is the always-visible record.
 */
export function RetirementAssumptions({ result }: Props) {
  const { assumptions, input } = result;
  const rows: { label: string; value: string }[] = [
    { label: "Expected return (from allocation)", value: formatPercent(assumptions.expectedReturn, 1) + " nominal" },
    { label: "Return volatility", value: formatPercent(assumptions.volatility, 1) },
    { label: "Inflation", value: formatPercent(assumptions.inflation, 1) },
    { label: "Healthcare inflation (pre-65)", value: formatPercent(input.assumptions.healthcareInflation, 1) },
    { label: "Withdrawal strategy", value: STRATEGY_LABEL[input.assumptions.withdrawalStrategy] ?? input.assumptions.withdrawalStrategy },
    { label: "Safe withdrawal rate (target #)", value: formatPercent(result.safeWithdrawalRate, 1) },
    { label: "On-track threshold", value: formatPercent(assumptions.successThreshold, 0) },
    { label: "Monte Carlo trials", value: result.monteCarlo.simulations.toLocaleString() },
    { label: "Effective tax — traditional", value: formatPercent(input.assumptions.taxRates.traditional, 0) },
    { label: "Effective tax — taxable", value: formatPercent(input.assumptions.taxRates.taxable, 0) },
    { label: "RMD start age (SECURE 2.0)", value: String(assumptions.rmdStartAge) },
  ];

  return (
    <section className="invest-retire-assumptions" aria-label="Assumptions used">
      <header>
        <h3>Assumptions</h3>
        <p>
          Editable in the form. Returns are derived from your allocation, never a single hardcoded
          number.
        </p>
      </header>

      <dl className="invest-retire-assumption-grid">
        {rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>

      <details className="invest-retire-cma">
        <summary>Per-asset-class capital market assumptions</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Asset class</th>
              <th scope="col">Exp. return</th>
              <th scope="col">Std dev</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(CAPITAL_MARKET_ASSUMPTIONS) as AssetClassId[]).map((id) => {
              const cma = CAPITAL_MARKET_ASSUMPTIONS[id];
              return (
                <tr key={id}>
                  <td>{cma.label}</td>
                  <td>{formatPercent(cma.expectedReturn, 1)}</td>
                  <td>{formatPercent(cma.stdDev, 1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>

      <p className="invest-retire-cma-source">
        Capital market assumptions: {assumptions.cmaSource} As of {assumptions.cmaAsOf}.{" "}
        {assumptions.cmaVerified
          ? "Pinned to a dated primary source."
          : "Illustrative — re-verify against the latest primary source before relying on figures."}
      </p>
    </section>
  );
}
