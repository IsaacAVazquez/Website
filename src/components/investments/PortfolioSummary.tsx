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
  const liveCount = holdings.filter((holding) => holding.priceSource === "live").length;
  const savedCount = holdings.filter((holding) => holding.priceSource === "saved").length;
  const hasLiveQuotes = liveCount > 0;
  const allQuotesLive = holdings.length > 0 && liveCount === holdings.length;
  const marketStatus =
    holdings.length === 0
      ? "No positions"
      : allQuotesLive
        ? "Latest quotes"
        : liveCount > 0
          ? `${liveCount} of ${holdings.length} current quotes`
          : savedCount === holdings.length
            ? "Saved quotes"
            : savedCount > 0
              ? "Saved quotes + cost basis"
              : "Cost basis";

  return (
    <div className="space-y-5">
      <PortfolioHeroCard
        summary={summary}
        snapshots={snapshots}
        isLoading={isLoading}
        onAddHolding={onAddHolding}
        onRefresh={onRefresh}
        lastUpdated={lastUpdated}
        marketStatus={marketStatus}
        hasLiveQuotes={hasLiveQuotes}
        allQuotesLive={allQuotesLive}
      />
      <PortfolioStatsGrid
        summary={summary}
        holdings={holdings}
        marketStatus={marketStatus}
        hasLiveQuotes={hasLiveQuotes}
        allQuotesLive={allQuotesLive}
      />
    </div>
  );
}
