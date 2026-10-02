"use client";

import React, { useEffect, useMemo } from "react";
import { ResearchAssetHeader } from "./ResearchAssetHeader";
import { ResearchLoading } from "./ResearchLoading";
import { ResearchPosition } from "./ResearchPosition";
import { ResearchOverview } from "./ResearchOverview";
import { FinancialStatementsPanel } from "./FinancialStatementsPanel";
import { ValuationRatiosPanel } from "./ValuationRatiosPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { GrowthPanel } from "./GrowthPanel";
import { IndustryPanel } from "./IndustryPanel";
import { ComparisonTab } from "./ComparisonTab";
import { PriceChartPanel } from "./PriceChartPanel";
import { ErrorState } from "./ErrorState";
import { useStockData } from "@/hooks/useStockData";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
import type {
  CompanyInfo,
  EnhancedHolding,
  InvestmentCapabilities,
} from "@/types/investment";
import type { ResearchTab } from "@/app/investments/investments-state";

export interface ResearchSectionProps {
  symbol: string;
  activeTab: ResearchTab;
  onTabChange: (tab: ResearchTab) => void;
  portfolioSymbols?: string[];
  position?: EnhancedHolding | null;
}

const TABS: { key: ResearchTab; label: string }[] = [
  { key: "overview",     label: "Overview" },
  { key: "financials",   label: "Financials" },
  { key: "growth",       label: "Growth" },
  { key: "valuation",    label: "Valuation" },
  { key: "industry",     label: "Industry" },
  { key: "chart",        label: "Chart" },
  { key: "compare",      label: "Compare" },
];

function getCuratedOnlyMessage(symbol: string) {
  return `${symbol.toUpperCase()} is not in the current research set. Search by ticker or company name to pick an available symbol.`;
}

function getResearchErrorMessage(error: string | null) {
  if (!error) return "Research data is temporarily unavailable. Try again shortly.";
  if (/temporarily unavailable/i.test(error)) return "Research data is temporarily unavailable. Try again shortly.";
  return error;
}

function isTabAvailable(tab: ResearchTab, capabilities: InvestmentCapabilities): boolean {
  switch (tab) {
    case "overview":    return capabilities.info !== false;
    case "financials":  return capabilities.income_statement !== false && capabilities.balance_sheet !== false && capabilities.cash_flow !== false;
    case "growth":      return capabilities.growth !== false;
    case "valuation":   return capabilities.fundamentals !== false;
    case "industry":    return capabilities.industry === true;
    case "chart":       return capabilities.price !== false;
    case "compare":     return capabilities.compare === true;
    default:            return true;
  }
}

/**
 * The research view for a picked symbol. ResearchSection loads it on demand
 * and renders the empty state itself, so this always has a symbol.
 */
export function ResearchWorkspace({
  symbol,
  activeTab,
  onTabChange,
  portfolioSymbols = [],
  position = null,
}: ResearchSectionProps) {
  const {
    error: symbolError,
    isLoading: symbolLoading,
    isNotFetched: symbolNotFetched,
    source,
    capabilities,
    refetch: refetchSymbol,
  } = useStockData<CompanyInfo>(symbol || null, "info");

  const hasResearchContext = source !== null && !symbolError;
  const visibleTabs = useMemo(
    () =>
      symbol && hasResearchContext
        ? TABS.filter((tab) => isTabAvailable(tab.key, capabilities))
        : [],
    [capabilities, hasResearchContext, symbol]
  );

  const isInPortfolio = !!(symbol && portfolioSymbols.includes(symbol));
  const resolvedActiveTab = visibleTabs.some((tab) => tab.key === activeTab) ? activeTab : "overview";
  const showCuratedOnlyState = !!symbol && !symbolLoading && symbolNotFetched && !hasResearchContext;
  const showResearchErrorState = !!symbol && !symbolLoading && !!symbolError && !showCuratedOnlyState && !hasResearchContext;
  const showLoadingState = !!symbol && symbolLoading && !hasResearchContext;

  useEffect(() => {
    if (symbol && visibleTabs.length > 0 && !visibleTabs.some((tab) => tab.key === activeTab)) {
      onTabChange("overview");
    }
  }, [activeTab, onTabChange, symbol, visibleTabs]);

  const handleVisibleTabKeyDown = useTablistKeyboard(
    visibleTabs,
    (t) => onTabChange(t.key),
  );

  return (
    <section
      id="research-section"
      aria-label={`Research · ${symbol.toUpperCase()}`}
      className="scroll-mt-12 min-[901px]:scroll-mt-0 space-y-5"
    >
      {showLoadingState ? (
        <ResearchLoading symbol={symbol} />
      ) : showCuratedOnlyState ? (
        <div className="border border-[color-mix(in_srgb,var(--c97-warning)_35%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-warning)_10%,var(--c97-panel))] px-5 py-6 text-center ">
          <p className="text-sm font-semibold text-[var(--c97-ink)]">
            This symbol is not in the current research set.
          </p>
          <p className="mt-2 text-sm text-[var(--c97-ink-2)]">
            {getCuratedOnlyMessage(symbol)}
          </p>
        </div>
      ) : showResearchErrorState ? (
        <ErrorState message={getResearchErrorMessage(symbolError)} onRetry={refetchSymbol} />
      ) : (
        <>
          <ResearchAssetHeader
            symbol={symbol}
            isInPortfolio={isInPortfolio}
            portfolioShares={position?.shares ?? null}
            portfolioSymbols={portfolioSymbols}
          />

          {position ? <ResearchPosition position={position} /> : null}

          {visibleTabs.length > 0 ? (
            <div
            className="flex gap-2 overflow-x-auto border border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-surface)_92%,var(--c97-panel))] p-2 "
            role="tablist"
            aria-label="Research sections"
          >
            {visibleTabs.map(({ key, label }, index) => (
              <button
                key={key}
                id={`research-tab-${key}`}
                role="tab"
                aria-selected={resolvedActiveTab === key}
                aria-controls={`research-panel-${key}`}
                tabIndex={resolvedActiveTab === key ? 0 : -1}
                onKeyDown={(e) => handleVisibleTabKeyDown(e, index)}
                onClick={() => onTabChange(key)}
                className={`min-h-touch whitespace-nowrap px-4 py-2 text-sm font-semibold transition ${
                  resolvedActiveTab === key
                    ? "bg-[var(--c97-ink)] text-[var(--c97-surface)]"
                    : "text-[var(--c97-ink-2)] hover:bg-[var(--c97-panel)] hover:text-[var(--c97-ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          ) : null}

          <div
              key={resolvedActiveTab}
              id={`research-panel-${resolvedActiveTab}`}
              role="tabpanel"
              aria-labelledby={`research-tab-${resolvedActiveTab}`}
              className="c97-enter-fade"
            >
              {resolvedActiveTab === "overview" && (
                <ResearchOverview symbol={symbol} showNews={capabilities.news !== false} />
              )}
              {resolvedActiveTab === "financials" && <FinancialStatementsPanel symbol={symbol} />}
              {resolvedActiveTab === "growth" && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <GrowthPanel symbol={symbol} />
                  <ProfitabilityPanel symbol={symbol} />
                </div>
              )}
              {resolvedActiveTab === "valuation" && (
                <ValuationRatiosPanel
                  symbol={symbol}
                  showIndustryComparison={capabilities.industry === true}
                />
              )}
              {resolvedActiveTab === "industry" && <IndustryPanel symbol={symbol} />}
              {resolvedActiveTab === "chart" && (
                <PriceChartPanel
                  symbol={symbol}
                  costBasis={position?.averageCost ?? null}
                />
              )}
              {resolvedActiveTab === "compare" && <ComparisonTab />}
            </div>
        </>
      )}
    </section>
  );
}
