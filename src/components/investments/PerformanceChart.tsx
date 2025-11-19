"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { IconTrendingUp } from "@tabler/icons-react";

interface PerformanceChartProps {
  totalValue: number;
  totalGainLoss: number;
}

/**
 * Performance Chart Component
 * Currently displays a placeholder for future chart implementation
 * TODO: Integrate with chart library (recharts, chart.js, or d3) for historical performance
 */
export function PerformanceChart({ totalValue, totalGainLoss }: PerformanceChartProps) {
  const isPositive = totalGainLoss >= 0;

  return (
    <WarmCard padding="lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-black dark:text-white">
            Performance
          </h3>
          <select className="px-3 py-2 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-600 text-sm text-black dark:text-white">
            <option>1 Day</option>
            <option>1 Week</option>
            <option>1 Month</option>
            <option>3 Months</option>
            <option>1 Year</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      {/* Placeholder Chart Area */}
      <div className="relative h-64 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center">
        <div className="text-center">
          <IconTrendingUp className={`w-12 h-12 mx-auto mb-4 ${isPositive ? 'text-black dark:text-white' : 'text-neutral-400 dark:text-neutral-600'}`} />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
            Performance chart coming soon
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            Historical data tracking will be available in the next update
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-600">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            Current Value
          </p>
          <p className="text-lg font-bold text-black dark:text-white">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            Total Return
          </p>
          <p className={`text-lg font-bold ${isPositive ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
            ${totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </WarmCard>
  );
}
