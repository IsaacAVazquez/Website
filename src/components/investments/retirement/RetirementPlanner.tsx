"use client";

import { ChartColumn } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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
}

export function RetirementPlanner({ portfolioValue }: Props) {
  const seed: RetirementSeed = { portfolioValue };

  // The planner is the last section on the page unless ?task=retirement puts it
  // first, so the projection waits until the section is within 600px of the viewport, the margin the fantasy boards
  // use for their own windowing. It latches on, and a browser with no
  // IntersectionObserver runs the projection straight away. A print never
  // scrolls the section into view, so the hook runs the projection on
  // beforeprint whatever this says.
  const sectionRef = useRef<HTMLElement | null>(null);
  const [nearViewport, setNearViewport] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const element = sectionRef.current;
    if (nearViewport || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNearViewport(true);
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [nearViewport]);

  const controller = useRetirementPlan(seed, nearViewport);
  const { result, ready, isComputing, hasError, persistenceStatus, isSampleScenario } = controller;

  return (
    <section
      ref={sectionRef}
      id="retirement"
      className="invest-research-band invest-retire-band invest-rail-target"
      aria-label="Retirement planner"
    >
      <div className="invest-section-header">
        <div>
          <p className="invest-section-kicker">Plan ahead</p>
          <h2 className="c97-poster-sm" style={{ marginTop: "var(--c97-sp-1)" }}>Retirement planner</h2>
        </div>
        <span className="invest-retire-band-tag">
          <ChartColumn size={14} aria-hidden="true" />
          {result ? `${result.monteCarlo.simulations.toLocaleString("en-US")} Monte Carlo scenarios` : "Monte Carlo"}
          {isComputing ? <span className="invest-retire-computing" aria-live="polite"> · updating…</span> : null}
        </span>
      </div>

      <p className="invest-retire-intro">
        Am I on track to retire, and what should I change? Start with six numbers for an instant
        read, then open the advanced sections to refine accounts, allocation, income, and
        assumptions.
      </p>

      {persistenceStatus === "memory-only" ? (
        <p role="status" className="c97-panel c97-meta" style={{ margin: 0 }}>
          Plan changes are available in this tab, but browser storage is
          unavailable, so they may not remain after you close it.
        </p>
      ) : null}

      <div className="invest-retire-layout">
        <div className="invest-retire-col-inputs">
          <RetirementInputs controller={controller} result={result} portfolioValue={portfolioValue} />
        </div>

        <div className="invest-retire-col-results">
          {ready && result ? (
            <>
              <RetirementVerdict result={result} isSampleScenario={isSampleScenario} />
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
