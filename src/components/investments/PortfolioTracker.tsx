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
  const {
    enhancedHoldings,
    summary,
    isLoading,
    error,
    lastUpdated,
    snapshots,
    addHolding,
    updateHolding,
    removeHolding,
    refetch,
  } = useInvestments();

  const shouldReduceMotion = useReducedMotion();
  const v = shouldReduceMotion ? getReducedMotionVariants() : { containerVariants, itemVariants };

  const isEmpty = enhancedHoldings.length === 0;

  return (
    <section aria-label="Portfolio tracker" className="space-y-6">
      {!isEmpty && (
        <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                Portfolio Overview
              </p>
              <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
                Track allocation, performance, and holding-level changes across your saved positions.
              </p>
            </div>
            <div className="justify-self-start xl:justify-self-end">
              <DataFreshnessIndicator
                lastUpdated={lastUpdated}
                onRefresh={refetch}
                isRefreshing={isLoading}
              />
            </div>
          </div>
          {error ? (
            <div className="mb-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--home-paper-alt))] px-4 py-3 text-sm text-[var(--home-ink-muted)]">
              {error}
            </div>
          ) : null}
          <PortfolioSummary
            summary={summary}
            holdings={enhancedHoldings}
            isLoading={isLoading}
          />
        </div>
      )}

      {!isEmpty && snapshots.length >= 2 && (
        <div id="performance-chart" className="scroll-mt-28">
          <PortfolioPerformanceChart snapshots={snapshots} />
        </div>
      )}

      <div>
        <AddStockForm onAdd={addHolding} />
      </div>

      {isEmpty ? (
        <div className="rounded-[28px] border border-dashed border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
          <p className="mb-2 text-sm font-semibold text-[var(--home-ink)]">
            No positions yet
          </p>
          <p className="text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))] text-sm max-w-xs mx-auto">
            Add your first stock using the form above. Holdings are saved in your browser and persist across visits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <div id="holdings-list" className="scroll-mt-28">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
              Holdings ({enhancedHoldings.length})
            </h2>
            <motion.ul
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2"
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

          <div id="allocation-chart" className="scroll-mt-28">
            <AllocationChart holdings={enhancedHoldings} />
          </div>
        </div>
      )}
    </section>
  );
}
