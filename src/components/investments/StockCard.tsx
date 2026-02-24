"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { EnhancedHolding } from "@/types/investment";
import { IconTrendingUp, IconTrendingDown, IconTrash, IconAlertCircle } from "@tabler/icons-react";

interface StockCardProps {
  holding: EnhancedHolding;
  onRemove: (symbol: string) => void;
  loading?: boolean;
}

export function StockCard({ holding, onRemove, loading = false }: StockCardProps) {
  const isPositive = holding.gainLoss >= 0;
  const isDayPositive = holding.dayChange >= 0;
  const hasError = holding.hasError;

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
    <WarmCard padding="lg" hover>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">
              {holding.symbol}
            </h3>
            {hasError && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-[var(--color-warning)] bg-[var(--color-warning)]/10">
                <IconAlertCircle className="w-3 h-3" />
                Price unavailable
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {holding.shares} shares @ {formatCurrency(holding.averageCost)}
          </p>
        </div>
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={() => onRemove(holding.symbol)}
          ariaLabel={`Remove ${holding.symbol} from portfolio`}
        >
          <IconTrash className="w-4 h-4" />
        </ModernButton>
      </div>

      {/* Current Price */}
      <div className="mb-6">
        <p className="text-sm text-[var(--text-secondary)] mb-1">
          Current Price
        </p>
        <p className={`text-3xl font-bold text-[var(--text-primary)] transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {hasError ? formatCurrency(holding.averageCost) : formatCurrency(holding.currentPrice)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {hasError ? (
            <span className="text-sm text-[var(--text-tertiary)]">--</span>
          ) : (
            <>
              {isDayPositive ? (
                <IconTrendingUp className="w-4 h-4 text-[var(--color-success)]" />
              ) : (
                <IconTrendingDown className="w-4 h-4 text-[var(--color-error)]" />
              )}
              <span className={`text-sm font-semibold ${isDayPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                {formatPercent(holding.dayChangePercent)} ({formatCurrency(holding.dayChange)})
              </span>
            </>
          )}
        </div>
      </div>

      {/* Holdings Value */}
      <div className={`grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-[var(--border-primary)] transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Total Value
          </p>
          <p className="text-xl font-bold text-[var(--text-primary)]">
            {hasError ? "--" : formatCurrency(holding.currentValue)}
          </p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            Total Cost
          </p>
          <p className="text-xl font-bold text-[var(--text-tertiary)]">
            {formatCurrency(holding.totalCost)}
          </p>
        </div>
      </div>

      {/* Gain/Loss */}
      <div>
        <p className="text-sm text-[var(--text-secondary)] mb-1">
          Total Gain/Loss
        </p>
        {hasError ? (
          <p className="text-2xl font-bold text-[var(--text-tertiary)]">--</p>
        ) : (
          <div className="flex items-baseline gap-3">
            <p className={`text-2xl font-bold ${isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
              {formatCurrency(holding.gainLoss)}
            </p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
              {formatPercent(holding.gainLossPercent)}
            </p>
          </div>
        )}
      </div>
    </WarmCard>
  );
}
