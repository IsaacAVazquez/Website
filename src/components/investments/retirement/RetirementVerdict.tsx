"use client";

import React from "react";
import type { RetirementResult, Verdict } from "@/lib/retirement";
import { formatCompactCurrency, formatPercent, formatScenarioCount } from "@/lib/retirement";

const VERDICT_COPY: Record<Verdict, { label: string; tone: string }> = {
  "on-track": { label: "On track", tone: "var(--color-success)" },
  good: { label: "Looking good", tone: "var(--color-success)" },
  fair: { label: "Fair — worth a look", tone: "var(--color-warning)" },
  "at-risk": { label: "Needs attention", tone: "var(--color-error)" },
};

interface Props {
  result: RetirementResult;
}

export function RetirementVerdict({ result }: Props) {
  const { monteCarlo, deterministic, targetNestEgg, input, verdict } = result;
  const successPct = Math.round(monteCarlo.successRate * 100);
  const copy = VERDICT_COPY[verdict];
  const meetsThreshold = monteCarlo.successRate >= input.assumptions.successThreshold;

  const projected = monteCarlo.balanceAtRetirement.p50;
  const surplus = projected - targetNestEgg;
  const depletion = monteCarlo.medianDepletionAge;

  return (
    <section className="invest-retire-verdict" aria-label="Retirement readiness verdict">
      <div className="invest-retire-verdict-head">
        <div
          className="invest-retire-gauge"
          style={
            {
              "--gauge": `${successPct}`,
              "--gauge-tone": copy.tone,
            } as React.CSSProperties
          }
          role="img"
          aria-label={`${formatScenarioCount(monteCarlo.successRate)} simulated scenarios fund retirement through age ${input.horizonAge}`}
        >
          <div className="invest-retire-gauge-inner">
            <span className="invest-retire-gauge-num">{successPct}</span>
            <span className="invest-retire-gauge-unit">/ 100</span>
          </div>
        </div>

        <div className="invest-retire-verdict-copy">
          <span className="invest-retire-verdict-badge" style={{ color: copy.tone }}>
            <span className="invest-retire-verdict-dot" style={{ background: copy.tone }} aria-hidden="true" />
            {copy.label}
          </span>
          <p className="invest-retire-verdict-line">
            About <strong>{formatScenarioCount(monteCarlo.successRate)}</strong> simulated scenarios
            fund your spending through age <strong>{input.horizonAge}</strong>.
          </p>
          <p className="invest-retire-verdict-sub">
            Your target is {formatPercent(input.assumptions.successThreshold, 0)}.{" "}
            {meetsThreshold
              ? "You're meeting it."
              : "A “miss” usually just means a mid-course spending adjustment, not running out."}
          </p>
        </div>
      </div>

      <dl className="invest-retire-stats">
        <div>
          <dt>Projected at {input.retirementAge}</dt>
          <dd>{formatCompactCurrency(projected)}</dd>
          <span className="invest-retire-stat-meta">median, today&apos;s dollars</span>
        </div>
        <div>
          <dt>Target nest egg</dt>
          <dd>{formatCompactCurrency(targetNestEgg)}</dd>
          <span className="invest-retire-stat-meta">
            net spend ÷ {formatPercent(result.safeWithdrawalRate, 1)}
          </span>
        </div>
        <div>
          <dt>{surplus >= 0 ? "Surplus" : "Shortfall"}</dt>
          <dd style={{ color: surplus >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
            {surplus >= 0 ? "+" : "−"}
            {formatCompactCurrency(Math.abs(surplus))}
          </dd>
          <span className="invest-retire-stat-meta">vs. target at retirement</span>
        </div>
        <div>
          <dt>If money runs out</dt>
          <dd>{depletion ? `age ${depletion}` : "lasts"}</dd>
          <span className="invest-retire-stat-meta">
            {depletion ? "median of shortfall paths" : `funded to ${input.horizonAge}`}
          </span>
        </div>
      </dl>

      {deterministic.depletionAge ? (
        <p className="invest-retire-verdict-note">
          On a single average-return path the portfolio is exhausted around age{" "}
          {deterministic.depletionAge}. Monte Carlo (above) is the more honest read — a range, not a
          point estimate.
        </p>
      ) : null}
    </section>
  );
}
