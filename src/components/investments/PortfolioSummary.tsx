"use client";

import React from "react";
import type {
  EnhancedHolding,
  PortfolioSummary as PortfolioSummaryType,
} from "@/types/investment";
import type { PortfolioSnapshot } from "./PortfolioPerformanceChart";
import { PortfolioHeroCard } from "./PortfolioHeroCard";
import { PortfolioStatsGrid } from "./PortfolioStatsGrid";

interface Props {
  summary: PortfolioSummaryType;
  holdings: EnhancedHolding[];
  isLoading: boolean;
  snapshots: PortfolioSnapshot[];
  onAddHolding?: () => void;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

export function PortfolioSummary({
  summary,
  holdings,
  isLoading,
  snapshots,
  onAddHolding,
  onRefresh,
  lastUpdated,
}: Props) {
  return (
    <div className="space-y-5">
      <PortfolioHeroCard
        summary={summary}
        snapshots={snapshots}
        isLoading={isLoading}
        onAddHolding={onAddHolding}
        onRefresh={onRefresh}
        lastUpdated={lastUpdated}
      />
      <PortfolioStatsGrid summary={summary} holdings={holdings} />
    </div>
  );
}
