"use client";

import React from "react";
import { TerminalPanel } from "./TerminalPanel";
import type { EnhancedHolding } from "@/types/investment";

interface Props {
  position: EnhancedHolding;
}

function currency(n: number | undefined, maximumFractionDigits = 2): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(n);
}

function signedCurrency(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${currency(Math.abs(n))}`;
}

function signedPercent(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

function shareLabel(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function toneClass(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n) || n === 0) return "text-[var(--home-ink)]";
  return n > 0 ? "text-[var(--home-positive)]" : "text-[var(--home-negative)]";
}

/**
 * "Your position" — surfaces the held lot for the symbol under research, drawn
 * straight from the local portfolio (no fabricated figures). Renders only when
 * the symbol is actually held, so the deep-dive carries the same position
 * context the prototype's right column did, without inventing data.
 */
export function ResearchPosition({ position }: Props) {
  const {
    shares,
    averageCost,
    currentValue,
    gainLoss,
    gainLossPercent,
    dayChange,
    dayChangePercent,
    allocationPercent,
  } = position;

  const alloc =
    allocationPercent !== null && Number.isFinite(allocationPercent)
      ? Math.max(0, Math.min(100, allocationPercent))
      : null;

  const metrics: { label: string; value: string; toneValue?: number }[] = [
    { label: "Shares", value: shareLabel(shares) },
    { label: "Avg cost", value: currency(averageCost) },
    { label: "Market value", value: currency(currentValue, 0) },
    {
      label: "Total return",
      value: `${signedCurrency(gainLoss)} · ${signedPercent(gainLossPercent)}`,
      toneValue: gainLoss,
    },
    {
      label: "Day P/L",
      value: `${signedCurrency(dayChange)} · ${signedPercent(dayChangePercent)}`,
      toneValue: dayChange,
    },
  ];

  return (
    <TerminalPanel
      padding="sm"
      ariaLabel="Your position"
     
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="invest-rail-section-label">Your position</p>
          <p className="mt-1 text-xs text-[var(--home-ink-soft)]">
            From your local portfolio. Live price when available, else last saved close.
          </p>
        </div>
        <span className="research-badge-pill held">
          Held · {shareLabel(shares)} sh
        </span>
      </div>

      <div className="research-key-metrics" role="list" aria-label="Position metrics">
        {metrics.map((m) => (
          <div className="research-key-metric" key={m.label} role="listitem">
            <span className="research-key-metric-label">{m.label}</span>
            <span className={`research-key-metric-value ${toneClass(m.toneValue)}`}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {alloc !== null ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--home-ink-muted)]">
            <span>Allocation</span>
            <span className="font-semibold text-[var(--home-ink)]">
              {alloc.toFixed(1)}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-[var(--home-paper-alt)]"
            role="img"
            aria-label={`Allocation ${alloc.toFixed(1)} percent of portfolio`}
          >
            <div
              className="h-full rounded-full bg-[var(--home-signal)]"
              style={{ width: `${alloc}%` }}
            />
          </div>
        </div>
      ) : null}
    </TerminalPanel>
  );
}
