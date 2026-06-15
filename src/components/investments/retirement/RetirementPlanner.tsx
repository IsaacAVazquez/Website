"use client";

import React from "react";
import { IconChartHistogram } from "@tabler/icons-react";
import { useRetirementPlan, type RetirementSeed } from "@/hooks/useRetirementPlan";
import { RetirementInputs } from "./RetirementInputs";
import { RetirementVerdict } from "./RetirementVerdict";
import { RetirementProjectionChart } from "./RetirementProjectionChart";
import { RetirementLevers } from "./RetirementLevers";
import { RetirementAssumptions } from "./RetirementAssumptions";
import { RetirementDisclaimer } from "./RetirementDisclaimer";

interface Props {
  /** Current portfolio value, offered as a one-click balance seed. */
  portfolioValue?: number;
  /** Derived allocation from the portfolio, used to seed a fresh plan. */
  seedAllocation?: RetirementSeed["allocation"];
}

export function RetirementPlanner({ portfolioValue, seedAllocation }: Props) {
  const seed: RetirementSeed = { portfolioValue, allocation: seedAllocation };
  const controller = useRetirementPlan(seed);
  const { result, ready, isComputing, hasError } = controller;

  return (
    <section
      id="retirement"
      className="invest-research-band invest-retire-band scroll-mt-28"
      aria-label="Retirement planner"
    >
      <div className="invest-section-header">
        <div>
          <p className="invest-section-kicker">Plan ahead</p>
          <h2 className="invest-section-title">Retirement planner</h2>
        </div>
        <span className="invest-retire-band-tag">
          <IconChartHistogram size={14} aria-hidden="true" />
          {result ? `${result.monteCarlo.simulations.toLocaleString()} Monte Carlo scenarios` : "Monte Carlo"}
          {isComputing ? <span className="invest-retire-computing" aria-live="polite"> · updating…</span> : null}
        </span>
      </div>

      <p className="invest-retire-intro">
        Am I on track to retire — and what should I change? Start with five numbers for an instant
        read, then open the advanced sections to refine accounts, allocation, income, and
        assumptions.
      </p>

      <div className="invest-retire-layout">
        <div className="invest-retire-col-inputs">
          <RetirementInputs controller={controller} result={result} portfolioValue={portfolioValue} />
        </div>

        <div className="invest-retire-col-results">
          {ready && result ? (
            <>
              <RetirementVerdict result={result} />
              <RetirementProjectionChart result={result} />
              <RetirementLevers result={result} />
            </>
          ) : hasError ? (
            <div className="invest-retire-loading" role="alert">
              The projection couldn't run with these inputs. Adjust the plan
              values, or use Reset to start over.
            </div>
          ) : (
            <div className="invest-retire-loading" role="status">
              Crunching scenarios…
            </div>
          )}
        </div>
      </div>

      {ready && result ? <RetirementAssumptions result={result} /> : null}
      {/* The educational disclaimer carries no data dependency and must stay
          present on every output state — including loading and error — per the
          compliance requirement that all projections ship with it. */}
      <RetirementDisclaimer />
    </section>
  );
}
