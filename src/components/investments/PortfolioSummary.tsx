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
      <WarmCard padding="sm">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 w-48 rounded bg-[var(--neutral-200)] animate-pulse" />
            <div className="h-6 w-32 rounded bg-[var(--neutral-200)] animate-pulse" />
          </div>
        ) : (
          <>
            {/* Hero: Total value */}
            <motion.div variants={v.itemVariants}>
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                Total Portfolio Value
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {formatCurrency(summary.totalValue)}
              </p>
            </motion.div>

            {/* Sub-line: Total gain/loss */}
            <motion.div variants={v.itemVariants} className="mt-1">
              <p className={`text-base font-semibold ${gainColor}`}>
                {formatCurrency(summary.totalGainLoss)} ({formatPercent(summary.totalGainLossPercent)})
              </p>
            </motion.div>

            {/* Secondary row */}
            <motion.div
              variants={v.itemVariants}
              className="flex items-center gap-6 mt-3 pt-3 border-t border-[var(--border-primary)]"
            >
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Today</p>
                <p className={`text-sm font-semibold ${dayColor}`}>
                  {formatCurrency(summary.dayChange)} ({formatPercent(summary.dayChangePercent)})
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Total Cost</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {formatCurrency(summary.totalCost)}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </WarmCard>
    </motion.div>
  );
}
