"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import type { PortfolioSummary as PortfolioSummaryType } from "@/types/investment";

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

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  isLoading: boolean;
}

function MetricCard({ label, value, sub, positive, isLoading }: MetricCardProps) {
  const valueColor =
    positive === null || positive === undefined
      ? "text-[var(--text-primary)]"
      : positive
      ? "text-[var(--color-success)]"
      : "text-[var(--color-error)]";

  return (
    <WarmCard padding="sm" ariaLabel={label}>
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
        {label}
      </p>
      {isLoading ? (
        <div className="h-7 w-28 rounded bg-[var(--neutral-200)] animate-pulse" />
      ) : (
        <>
          <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
          {sub && (
            <p className={`text-sm mt-0.5 ${positive !== null ? valueColor : "text-[var(--text-secondary)]"}`}>
              {sub}
            </p>
          )}
        </>
      )}
    </WarmCard>
  );
}

export function PortfolioSummary({ summary, isLoading }: Props) {
  const gainPositive = summary.totalGainLoss >= 0;
  const dayPositive = summary.dayChange >= 0;

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      role="region"
      aria-label="Portfolio summary"
    >
      <MetricCard
        label="Total Value"
        value={formatCurrency(summary.totalValue)}
        isLoading={isLoading}
      />
      <MetricCard
        label="Total Cost"
        value={formatCurrency(summary.totalCost)}
        isLoading={isLoading}
      />
      <MetricCard
        label="Total Gain / Loss"
        value={formatCurrency(summary.totalGainLoss)}
        sub={formatPercent(summary.totalGainLossPercent)}
        positive={gainPositive}
        isLoading={isLoading}
      />
      <MetricCard
        label="Today's Change"
        value={formatCurrency(summary.dayChange)}
        sub={formatPercent(summary.dayChangePercent)}
        positive={dayPositive}
        isLoading={isLoading}
      />
    </div>
  );
}
