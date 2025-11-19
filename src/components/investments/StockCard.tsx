"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { EnhancedHolding } from "@/types/investment";
import { IconTrendingUp, IconTrendingDown, IconTrash } from "@tabler/icons-react";
import { motion } from "framer-motion";

interface StockCardProps {
  holding: EnhancedHolding;
  onRemove: (symbol: string) => void;
}

export function StockCard({ holding, onRemove }: StockCardProps) {
  const isPositive = holding.gainLoss >= 0;
  const isDayPositive = holding.dayChange >= 0;

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <WarmCard padding="lg" hover>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-1">
              {holding.symbol}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            Current Price
          </p>
          <p className="text-3xl font-bold text-black dark:text-white">
            {formatCurrency(holding.currentPrice)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {isDayPositive ? (
              <IconTrendingUp className="w-4 h-4 text-black dark:text-white" />
            ) : (
              <IconTrendingDown className="w-4 h-4 text-black dark:text-white" />
            )}
            <span className={`text-sm font-semibold ${isDayPositive ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {formatPercent(holding.dayChangePercent)} ({formatCurrency(holding.dayChange)})
            </span>
          </div>
        </div>

        {/* Holdings Value */}
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-600">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              Total Value
            </p>
            <p className="text-xl font-bold text-black dark:text-white">
              {formatCurrency(holding.currentValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              Total Cost
            </p>
            <p className="text-xl font-bold text-neutral-500 dark:text-neutral-400">
              {formatCurrency(holding.totalCost)}
            </p>
          </div>
        </div>

        {/* Gain/Loss */}
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            Total Gain/Loss
          </p>
          <div className="flex items-baseline gap-3">
            <p className={`text-2xl font-bold ${isPositive ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {formatCurrency(holding.gainLoss)}
            </p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {formatPercent(holding.gainLossPercent)}
            </p>
          </div>
        </div>
      </WarmCard>
    </motion.div>
  );
}
