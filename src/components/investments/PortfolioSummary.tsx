"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WarmCard } from "@/components/ui/WarmCard";
import type { PortfolioSummary as PortfolioSummaryType } from "@/types/investment";
import {
  containerVariants,
  itemVariants,
  getReducedMotionVariants,
} from "./animations";

interface Props {
  summary: PortfolioSummaryType;
  isLoading: boolean;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPercent(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function PortfolioSummary({ summary, isLoading }: Props) {
  const gainPositive = summary.totalGainLoss >= 0;
  const dayPositive = summary.dayChange >= 0;
  const gainColor = gainPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]";
  const dayColor = dayPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]";

  const shouldReduceMotion = useReducedMotion();
  const v = shouldReduceMotion ? getReducedMotionVariants() : { containerVariants, itemVariants };

  return (
    <motion.div
      role="region"
      aria-label="Portfolio summary"
      variants={v.containerVariants}
      initial="hidden"
      animate="visible"
    >
      <WarmCard padding="sm" className="rounded-[28px] shadow-[var(--shadow-sm)]">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 w-48 rounded bg-[var(--neutral-200)] animate-pulse" />
            <div className="h-6 w-32 rounded bg-[var(--neutral-200)] animate-pulse" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5">
              <motion.div variants={v.itemVariants}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Total Portfolio Value
                </p>
                <p className="text-3xl font-bold text-[var(--home-ink)]">
                  {formatCurrency(summary.totalValue)}
                </p>
              </motion.div>

              <motion.div variants={v.itemVariants} className="mt-2">
                <p className={`text-base font-semibold ${gainColor}`}>
                  {formatCurrency(summary.totalGainLoss)} ({formatPercent(summary.totalGainLossPercent)})
                </p>
              </motion.div>
            </div>

            <motion.div
              variants={v.itemVariants}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Today
                </p>
                <p className={`mt-2 text-sm font-semibold ${dayColor}`}>
                  {formatCurrency(summary.dayChange)} ({formatPercent(summary.dayChangePercent)})
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Total Cost
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--home-ink)]">
                  {formatCurrency(summary.totalCost)}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </WarmCard>
    </motion.div>
  );
}
