"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PortfolioSummary } from "./PortfolioSummary";
import { StockCard } from "./StockCard";
import { AddStockForm } from "./AddStockForm";
import { AllocationChart } from "./AllocationChart";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { PortfolioPerformanceChart } from "./PortfolioPerformanceChart";
import { useInvestments } from "@/hooks/useInvestments";
import {
  containerVariants,
  itemVariants,
  getReducedMotionVariants,
} from "./animations";

interface Props {
  onResearch: (symbol: string) => void;
}

export function PortfolioTracker({ onResearch }: Props) {
  const { enhancedHoldings, summary, isLoading, lastUpdated, snapshots, addHolding, updateHolding, removeHolding, refetch } =
    useInvestments();

  const shouldReduceMotion = useReducedMotion();
  const v = shouldReduceMotion ? getReducedMotionVariants() : { containerVariants, itemVariants };

  const isEmpty = enhancedHoldings.length === 0;

  return (
    <section aria-label="Portfolio tracker">
      {/* Summary metrics + freshness */}
      {!isEmpty && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              Portfolio Overview
            </h2>
            <DataFreshnessIndicator
              lastUpdated={lastUpdated}
              onRefresh={refetch}
              isRefreshing={isLoading}
            />
          </div>
          <PortfolioSummary summary={summary} isLoading={isLoading} />
        </div>
      )}

      {/* Performance chart */}
      {!isEmpty && snapshots.length >= 2 && (
        <div className="mb-6">
          <PortfolioPerformanceChart snapshots={snapshots} />
        </div>
      )}

      {/* Add form */}
      <div className="mb-6">
        <AddStockForm onAdd={addHolding} />
      </div>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-secondary)] text-sm font-medium mb-2">
            No positions yet
          </p>
          <p className="text-[var(--text-tertiary)] text-sm max-w-xs mx-auto">
            Add your first stock using the form above. Holdings are saved in your browser and persist across visits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Holdings list */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Holdings ({enhancedHoldings.length})
            </h2>
            <motion.ul
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="list"
              variants={v.containerVariants}
              initial="hidden"
              animate="visible"
            >
              {enhancedHoldings.map((h) => (
                <motion.li key={h.symbol} variants={v.itemVariants}>
                  <StockCard
                    holding={h}
                    onUpdate={updateHolding}
                    onRemove={removeHolding}
                    onResearch={onResearch}
                  />
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Allocation chart */}
          <div>
            <AllocationChart holdings={enhancedHoldings} />
          </div>
        </div>
      )}
    </section>
  );
}
