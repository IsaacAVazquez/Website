"use client";

import React from "react";
import { PortfolioSummary } from "./PortfolioSummary";
import { StockCard } from "./StockCard";
import { AddStockForm } from "./AddStockForm";
import { AllocationChart } from "./AllocationChart";
import { useInvestments } from "@/hooks/useInvestments";

interface Props {
  onResearch: (symbol: string) => void;
}

export function PortfolioTracker({ onResearch }: Props) {
  const { enhancedHoldings, summary, isLoading, addHolding, updateHolding, removeHolding } =
    useInvestments();

  const isEmpty = enhancedHoldings.length === 0;

  return (
    <section aria-label="Portfolio tracker">
      {/* Summary metrics */}
      {!isEmpty && (
        <div className="mb-6">
          <PortfolioSummary summary={summary} isLoading={isLoading} />
        </div>
      )}

      {/* Add form */}
      <div className="mb-6">
        <AddStockForm onAdd={addHolding} />
      </div>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-tertiary)] text-sm">
            No positions yet. Add your first stock above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Holdings list */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
              Holdings ({enhancedHoldings.length})
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
              {enhancedHoldings.map((h) => (
                <li key={h.symbol}>
                  <StockCard
                    holding={h}
                    onUpdate={updateHolding}
                    onRemove={removeHolding}
                    onResearch={onResearch}
                  />
                </li>
              ))}
            </ul>
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
