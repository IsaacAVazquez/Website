"use client";

import React from "react";
import type {
  EnhancedHolding,
  PortfolioSummary as PortfolioSummaryType,
} from "@/types/investment";
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from "@/lib/investmentFormatting";

interface Props {
  summary: PortfolioSummaryType;
  holdings: EnhancedHolding[];
}

interface ComputedStats {
  topHolding: { symbol: string; allocationPercent: number } | null;
  bestPerformer: { symbol: string; gainLossPercent: number } | null;
  biggestDayMove: { symbol: string; dayChangePercent: number } | null;
  positions: number;
  concentration: number;
}

function computeStats(holdings: EnhancedHolding[]): ComputedStats {
  const positions = holdings.length;
  if (positions === 0) {
    return {
      topHolding: null,
      bestPerformer: null,
      biggestDayMove: null,
      positions: 0,
      concentration: 0,
    };
  }

  const sortedByAllocation = [...holdings]
    .filter((h) => h.allocationPercent !== null)
    .sort((a, b) => (b.allocationPercent ?? 0) - (a.allocationPercent ?? 0));
  const top = sortedByAllocation[0] ?? null;

  const concentration = sortedByAllocation
    .slice(0, 3)
    .reduce((sum, h) => sum + (h.allocationPercent ?? 0), 0);

  const sortedByReturn = [...holdings].sort(
    (a, b) => b.gainLossPercent - a.gainLossPercent,
  );
  const best = sortedByReturn[0] ?? null;

  const sortedByDayMove = [...holdings].sort(
    (a, b) => Math.abs(b.dayChangePercent) - Math.abs(a.dayChangePercent),
  );
  const biggestMove = sortedByDayMove[0] ?? null;

  return {
    topHolding: top
      ? { symbol: top.symbol, allocationPercent: top.allocationPercent ?? 0 }
      : null,
    bestPerformer: best
      ? { symbol: best.symbol, gainLossPercent: best.gainLossPercent }
      : null,
    biggestDayMove: biggestMove
      ? { symbol: biggestMove.symbol, dayChangePercent: biggestMove.dayChangePercent }
      : null,
    positions,
    concentration,
  };
}

interface StatCellProps {
  label: string;
  hint: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "pos" | "neg";
  subTone?: "default" | "pos" | "neg";
}

function StatCell({ label, hint, value, sub, tone = "default", subTone = "default" }: StatCellProps) {
  const valueColor =
    tone === "pos"
      ? "text-[var(--color-success)]"
      : tone === "neg"
        ? "text-[var(--color-error)]"
        : "text-[var(--home-ink)]";
  const subColor =
    subTone === "pos"
      ? "text-[var(--color-success)]"
      : subTone === "neg"
        ? "text-[var(--color-error)]"
        : "text-[var(--home-ink-muted)]";
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className="invest-stats-cell-label w-fit cursor-help text-[12.5px] font-medium text-[var(--home-ink-muted)] [text-decoration-color:color-mix(in_srgb,var(--home-ink)_28%,transparent)] [text-decoration-line:underline] [text-decoration-style:dotted] [text-underline-offset:3px]"
        title={hint}
      >
        {label}
      </span>
      <span
        className={`truncate text-[17px] font-semibold leading-[1.3] tracking-[-0.01em] tabular-nums ${valueColor}`}
      >
        {value}
      </span>
      <span
        className={`invest-stats-cell-sub text-[11.5px] tabular-nums ${subColor}`}
      >
        {sub ?? " "}
      </span>
    </div>
  );
}

export function PortfolioStatsGrid({ summary, holdings }: Props) {
  const gainPositive = summary.totalGainLoss >= 0;
  const dayPositive = summary.dayChange >= 0;
  const stats = computeStats(holdings);

  return (
    <section
      id="portfolio-stats"
      className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-6 shadow-[var(--shadow-sm)] sm:px-7 sm:py-7 scroll-mt-28"
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-[16px] font-bold tracking-[-0.02em] text-[var(--home-ink)]">
          Portfolio stats
        </h2>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--home-ink-muted)]">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
            style={{ boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-success) 18%, transparent)" }}
          />
          Live across saved positions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        <StatCell
          label="Day P/L"
          hint="Today's change in portfolio value, summed across all positions."
          value={formatSignedCurrency(summary.dayChange)}
          sub={formatPercent(summary.dayChangePercent)}
          tone={dayPositive ? "pos" : "neg"}
          subTone={dayPositive ? "pos" : "neg"}
        />
        <StatCell
          label="All-time return"
          hint="Total dollar return since you started tracking each position."
          value={formatSignedCurrency(summary.totalGainLoss)}
          sub={formatPercent(summary.totalGainLossPercent)}
          tone={gainPositive ? "pos" : "neg"}
          subTone={gainPositive ? "pos" : "neg"}
        />
        <StatCell
          label="Cost basis"
          hint="What you paid for the holdings you're still tracking."
          value={formatCurrency(summary.totalCost)}
          sub={
            stats.positions === 0
              ? undefined
              : `Across ${stats.positions} ${stats.positions === 1 ? "position" : "positions"}`
          }
        />
        <StatCell
          label="Positions"
          hint="Number of distinct tickers in the saved book."
          value={String(stats.positions)}
          sub={
            stats.positions === 0
              ? undefined
              : `${stats.concentration.toFixed(1)}% in top three`
          }
        />
        <StatCell
          label="Top holding"
          hint="Largest position by current market value."
          value={stats.topHolding?.symbol ?? "—"}
          sub={
            stats.topHolding
              ? `${stats.topHolding.allocationPercent.toFixed(1)}% of book`
              : undefined
          }
        />
        <StatCell
          label="Best performer"
          hint="Position with the strongest all-time return percentage."
          value={stats.bestPerformer?.symbol ?? "—"}
          sub={
            stats.bestPerformer
              ? formatPercent(stats.bestPerformer.gainLossPercent)
              : undefined
          }
          subTone={
            stats.bestPerformer && stats.bestPerformer.gainLossPercent >= 0
              ? "pos"
              : stats.bestPerformer
                ? "neg"
                : "default"
          }
        />
        <StatCell
          label="Biggest day move"
          hint="Position with the largest absolute change today."
          value={stats.biggestDayMove?.symbol ?? "—"}
          sub={
            stats.biggestDayMove
              ? formatPercent(stats.biggestDayMove.dayChangePercent)
              : undefined
          }
          subTone={
            stats.biggestDayMove && stats.biggestDayMove.dayChangePercent >= 0
              ? "pos"
              : stats.biggestDayMove
                ? "neg"
                : "default"
          }
        />
        <StatCell
          label="Top-3 concentration"
          hint="Combined allocation of your three largest positions, a quick read on portfolio shape."
          value={`${stats.concentration.toFixed(1)}%`}
          sub={
            stats.positions <= 3
              ? "Whole book"
              : `${stats.positions - 3} more positions`
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-dashed border-[color-mix(in_srgb,var(--home-ink)_14%,transparent)] pt-4">
        <a href="#allocation" className="invest-ghost">
          Allocation breakdown
        </a>
        <a href="#holdings-list" className="invest-ghost">
          Per-position detail
        </a>
        <a href="#performance" className="invest-ghost">
          Performance over time
        </a>
        <a href="#add-holding" className="invest-ghost">
          Add a holding
        </a>
      </div>
    </section>
  );
}
