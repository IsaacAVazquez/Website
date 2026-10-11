"use client";

import React from "react";
import type { QuoteSourceCounts } from "@/lib/investmentsPriceHealth";
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
  /** Counted once by the dashboard, which reads the same numbers for the tape. */
  quoteSources: QuoteSourceCounts;
}

export function PortfolioSummary({ summary, holdings, isLoading, snapshots, quoteSources }: Props) {
  const { total, live: liveCount, saved: savedCount } = quoteSources;
  const hasLiveQuotes = liveCount > 0;
  const allQuotesLive = total > 0 && liveCount === total;
  const marketStatus =
    total === 0
      ? "No positions"
      : allQuotesLive
        ? "Latest quotes"
        : liveCount > 0
          ? `${liveCount} of ${total} current quotes`
          : savedCount === total
            ? "Saved quotes"
            : savedCount > 0
              ? "Saved quotes + cost basis"
              : "Cost basis";

  return (
    <>
      <PortfolioHeroCard
        summary={summary}
        snapshots={snapshots}
        isLoading={isLoading}
        marketStatus={marketStatus}
        hasLiveQuotes={hasLiveQuotes}
        allQuotesLive={allQuotesLive}
      />
      {/* The balance's second line. Six dashes summarize nothing, so the row
          waits for the first position. */}
      {holdings.length > 0 ? <PortfolioStatsGrid summary={summary} holdings={holdings} /> : null}
    </>
  );
}
