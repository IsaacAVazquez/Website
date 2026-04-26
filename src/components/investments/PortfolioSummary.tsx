"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WarmCard } from "@/components/ui/WarmCard";
import type {
  EnhancedHolding,
  PortfolioSummary as PortfolioSummaryType,
} from "@/types/investment";
import {
  containerVariants,
  itemVariants,
  getReducedMotionVariants,
} from "./animations";

interface Props {
  summary: PortfolioSummaryType;
  holdings: EnhancedHolding[];
  isLoading: boolean;
}

function formatCurrency(n: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function formatSignedCurrency(n: number, fractionDigits = 2): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(n), fractionDigits)}`;
}

function formatPercent(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
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
    .sort(
      (a, b) =>
        (b.allocationPercent ?? 0) - (a.allocationPercent ?? 0),
    );
  const top = sortedByAllocation[0] ?? null;

  // Top-3 concentration as a portfolio-shape signal: how heavy the
  // top three holdings are relative to the whole book.
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
      ? {
          symbol: top.symbol,
          allocationPercent: top.allocationPercent ?? 0,
        }
      : null,
    bestPerformer: best
      ? {
          symbol: best.symbol,
          gainLossPercent: best.gainLossPercent,
        }
      : null,
    biggestDayMove: biggestMove
      ? {
          symbol: biggestMove.symbol,
          dayChangePercent: biggestMove.dayChangePercent,
        }
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
}

function StatCell({ label, hint, value, sub, tone = "default" }: StatCellProps) {
  const valueColor =
    tone === "pos"
      ? "text-[var(--color-success)]"
      : tone === "neg"
        ? "text-[var(--color-error)]"
        : "text-[var(--home-ink)]";
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className="w-fit cursor-help text-[12.5px] font-medium text-[var(--home-ink-muted)] [text-decoration-color:color-mix(in_srgb,var(--home-ink)_28%,transparent)] [text-decoration-line:underline] [text-decoration-style:dotted] [text-underline-offset:3px]"
        title={hint}
      >
        {label}
      </span>
      <span
        className={`truncate text-[17px] font-semibold leading-[1.3] tracking-[-0.01em] tabular-nums ${valueColor}`}
      >
        {value}
      </span>
      {sub ? (
        <span className="text-[11.5px] tabular-nums text-[var(--home-ink-muted)]">
          {sub}
        </span>
      ) : null}
    </div>
  );
}

export function PortfolioSummary({ summary, holdings, isLoading }: Props) {
  const gainPositive = summary.totalGainLoss >= 0;
  const dayPositive = summary.dayChange >= 0;
  const stats = computeStats(holdings);

  const shouldReduceMotion = useReducedMotion();
  const v = shouldReduceMotion ? getReducedMotionVariants() : { containerVariants, itemVariants };

  if (isLoading) {
    return (
      <WarmCard padding="sm" className="rounded-[28px] shadow-[var(--shadow-sm)]">
        <div className="space-y-3">
          <div className="h-10 w-48 rounded bg-[var(--home-paper-alt)] animate-pulse" />
          <div className="h-6 w-32 rounded bg-[var(--home-paper-alt)] animate-pulse" />
        </div>
      </WarmCard>
    );
  }

  return (
    <motion.div
      role="region"
      aria-label="Portfolio summary"
      variants={v.containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Hero balance card — live pulse, big balance, delta chip */}
      <motion.div
        variants={v.itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-6 shadow-[var(--shadow-md)] sm:px-7 sm:py-7"
      >
        {/* Periwinkle haze blur — sits behind balance like the design source */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--home-haze) 18%, transparent), transparent 60%)",
            filter: "blur(20px)",
          }}
        />

        <div className="relative z-[1] flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
            <span
              aria-hidden="true"
              className="motion-safe:animate-pulse h-[7px] w-[7px] rounded-full bg-[var(--color-success)]"
              style={{
                boxShadow:
                  "0 0 0 3px color-mix(in srgb, var(--color-success) 22%, transparent)",
              }}
            />
            Total portfolio value · Live
          </span>

          <p className="m-0 flex items-baseline gap-2 text-[clamp(2.6rem,4vw+1rem,3.6rem)] font-semibold leading-[0.95] tracking-[-0.06em] tabular-nums text-[var(--home-ink)]">
            {formatCurrency(summary.totalValue, 2)}
            <span className="text-[0.34em] font-semibold tracking-[0.04em] text-[var(--home-ink-muted)]">
              USD
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13.5px] font-semibold">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${
                gainPositive
                  ? "border-[color-mix(in_srgb,var(--color-success)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)]"
                  : "border-[color-mix(in_srgb,var(--color-error)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)] text-[var(--color-error)]"
              }`}
            >
              {formatSignedCurrency(summary.totalGainLoss)}
              {" · "}
              {formatPercent(summary.totalGainLossPercent)}
            </span>
            <span className="font-medium text-[var(--home-ink-muted)]">
              All-time return
            </span>
          </div>
        </div>
      </motion.div>

      {/* Dense Gemini-style 8-fact stats grid */}
      <motion.div
        variants={v.itemVariants}
        className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-6 shadow-[var(--shadow-sm)] sm:px-7 sm:py-7"
      >
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="m-0 text-[16px] font-bold tracking-[-0.02em] text-[var(--home-ink)]">
            Portfolio stats
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--home-ink-muted)]">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
              style={{ boxShadow: "0 0 0 3px rgba(43,168,74,0.16)" }}
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
          />
          <StatCell
            label="All-time return"
            hint="Total dollar return since you started tracking each position."
            value={formatSignedCurrency(summary.totalGainLoss)}
            sub={formatPercent(summary.totalGainLossPercent)}
            tone={gainPositive ? "pos" : "neg"}
          />
          <StatCell
            label="Cost basis"
            hint="What you paid for the holdings you're still tracking."
            value={formatCurrency(summary.totalCost)}
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
            tone={
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
            tone={
              stats.biggestDayMove && stats.biggestDayMove.dayChangePercent >= 0
                ? "pos"
                : stats.biggestDayMove
                  ? "neg"
                  : "default"
            }
          />
          <StatCell
            label="Top-3 concentration"
            hint="Combined allocation of your three largest positions — a quick read on portfolio shape."
            value={`${stats.concentration.toFixed(1)}%`}
            sub={
              stats.positions <= 3
                ? "Whole book"
                : `${stats.positions - 3} more positions`
            }
          />
        </div>

        {/* Quick-link pill row — Whitepaper/Website-style affordances */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-dashed border-[color-mix(in_srgb,var(--home-ink)_14%,transparent)] pt-4">
          <a
            href="#allocation-chart"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_88%,var(--home-elev-mix))] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--home-ink)] transition hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--home-ink)_18%,transparent)] hover:bg-[color-mix(in_srgb,var(--home-acid)_20%,var(--home-paper))]"
          >
            Allocation breakdown
          </a>
          <a
            href="#holdings-list"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_88%,var(--home-elev-mix))] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--home-ink)] transition hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--home-ink)_18%,transparent)] hover:bg-[color-mix(in_srgb,var(--home-acid)_20%,var(--home-paper))]"
          >
            Per-position detail
          </a>
          <a
            href="#performance-chart"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_88%,var(--home-elev-mix))] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--home-ink)] transition hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--home-ink)_18%,transparent)] hover:bg-[color-mix(in_srgb,var(--home-acid)_20%,var(--home-paper))]"
          >
            Performance over time
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
