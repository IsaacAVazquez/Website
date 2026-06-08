"use client";

import React from "react";
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";
import type { LeverEffect, RetirementResult } from "@/lib/retirement";
import { formatPercent } from "@/lib/retirement";

interface Props {
  result: RetirementResult;
}

function deltaTone(delta: number): string {
  if (delta > 0.005) return "var(--color-success)";
  if (delta < -0.005) return "var(--color-error)";
  return "var(--home-ink-muted)";
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 0.005) return <IconArrowUpRight size={15} aria-hidden="true" />;
  if (delta < -0.005) return <IconArrowDownRight size={15} aria-hidden="true" />;
  return <IconMinus size={15} aria-hidden="true" />;
}

function LeverRow({ lever, threshold }: { lever: LeverEffect; threshold: number }) {
  const tone = deltaTone(lever.delta);
  const pp = Math.round(lever.delta * 100);
  return (
    <li className="invest-retire-lever">
      <div className="invest-retire-lever-top">
        <div>
          <span className="invest-retire-lever-label">{lever.label}</span>
          <span className="invest-retire-lever-change">{lever.changeLabel}</span>
        </div>
        <span className="invest-retire-lever-delta" style={{ color: tone }}>
          <DeltaIcon delta={lever.delta} />
          {pp > 0 ? "+" : ""}
          {pp} pp
        </span>
      </div>
      <p className="invest-retire-lever-desc">{lever.description}</p>
      <div className="invest-retire-lever-bar" aria-hidden="true">
        <div
          className="invest-retire-lever-bar-fill"
          style={{ width: `${Math.round(lever.newSuccessRate * 100)}%`, background: tone }}
        />
        <span
          className="invest-retire-lever-bar-target"
          style={{ left: `${Math.round(threshold * 100)}%` }}
        />
      </div>
      <div className="invest-retire-lever-foot">
        <span>→ {formatPercent(lever.newSuccessRate, 0)} success</span>
        {lever.toReachTarget ? (
          <span className="invest-retire-lever-target">
            {lever.toReachTarget.value} {lever.toReachTarget.label}
          </span>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Sensitivity to the four dials (spec §5.5): save more, retire later, spend
 * less, change allocation. Shows the marginal effect of each, sorted by impact.
 */
export function RetirementLevers({ result }: Props) {
  const threshold = result.input.assumptions.successThreshold;
  const levers = [...result.levers].sort((a, b) => b.delta - a.delta);

  return (
    <section className="invest-retire-levers" aria-label="What moves the outcome">
      <header className="invest-retire-levers-head">
        <h3>What gets me to {formatPercent(threshold, 0)}?</h3>
        <p>Each dial&apos;s marginal effect on your probability of success.</p>
      </header>
      {levers.length === 0 ? (
        <ul className="invest-retire-lever-list" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="invest-retire-lever invest-retire-lever-skeleton" />
          ))}
        </ul>
      ) : (
        <ul className="invest-retire-lever-list">
          {levers.map((lever) => (
            <LeverRow key={lever.id} lever={lever} threshold={threshold} />
          ))}
        </ul>
      )}
    </section>
  );
}
