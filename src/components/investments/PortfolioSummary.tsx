"use client";

import React from "react";
import type {
  EnhancedHolding,
  PortfolioSnapshot,
  PortfolioSummary as PortfolioSummaryType,
} from "@/types/investment";
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
    <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
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
      />
    </div>
  );
}
