"use client";

import React, { useState, useEffect } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { PortfolioSummary as PortfolioSummaryType } from "@/types/investment";
import { IconTrendingUp, IconTrendingDown, IconRefresh } from "@tabler/icons-react";
import { ModernButton } from "@/components/ui/ModernButton";
import { motion, useReducedMotion } from "framer-motion";

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
  loading: boolean;
  onRefresh: () => void;
  lastUpdated: Date | null;
}

export function PortfolioSummary({ summary, loading, onRefresh, lastUpdated }: PortfolioSummaryProps) {
  const shouldReduceMotion = useReducedMotion();
  const [, setTick] = useState(0);

  // Re-render every 15s to keep relative time fresh
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(interval);
  }, [lastUpdated]);
  const isPositive = summary.totalGainLoss >= 0;
  const isDayPositive = summary.dayChange >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
    >
      <WarmCard padding="xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-sm uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Portfolio Value
            </h2>
            <p className={`text-5xl md:text-6xl font-bold text-[var(--text-primary)] transition-opacity ${loading ? 'opacity-50' : ''}`}>
              {formatCurrency(summary.totalValue)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && !loading && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {formatRelativeTime(lastUpdated)}
              </span>
            )}
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              ariaLabel="Refresh portfolio data"
            >
              <IconRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </ModernButton>
          </div>
        </div>

        {/* Day Change */}
        <div className="mb-8 pb-8 border-b border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Today&apos;s Change
          </p>
          <div className="flex items-center gap-3">
            {isDayPositive ? (
              <IconTrendingUp className="w-6 h-6 text-[var(--color-success)]" />
            ) : (
              <IconTrendingDown className="w-6 h-6 text-[var(--color-error)]" />
            )}
            <div className={`flex items-baseline gap-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
              <span className={`text-3xl font-bold ${isDayPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                {formatCurrency(summary.dayChange)}
              </span>
              <span className={`text-xl font-semibold ${isDayPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                {formatPercent(summary.dayChangePercent)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Gain/Loss */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Total Cost
            </p>
            <p className="text-2xl font-bold text-[var(--text-tertiary)]">
              {formatCurrency(summary.totalCost)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Total Gain/Loss
            </p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
              {formatCurrency(summary.totalGainLoss)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Return
            </p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
              {formatPercent(summary.totalGainLossPercent)}
            </p>
          </div>
        </div>
      </WarmCard>
    </motion.div>
  );
}
