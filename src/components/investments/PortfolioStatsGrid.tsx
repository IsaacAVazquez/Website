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
import styles from "@/app/investments/investments.module.css";

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
  const valueClass = tone === "pos" ? styles.statPos : tone === "neg" ? styles.statNeg : "";
  const subClass = subTone === "pos" ? styles.statPos : subTone === "neg" ? styles.statNeg : "";
  return (
    <div className={styles.statCell}>
      <span
        className={styles.statLabel}
        title={hint}
      >
        {label}
      </span>
      <span
        className={styles.statValue + " " + valueClass}
      >
        {value}
      </span>
      <span
        className={styles.statSub + " " + subClass}
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
      className={styles.statsPanel + " scroll-mt-28"}
    >
      <div className={styles.statsCap}>
        <span>Portfolio stats</span>
        <span className={styles.statsLive}>Live across saved positions</span>
      </div>

      <div className={styles.statsGrid}>
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

      <div className={styles.statsFoot}>
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
