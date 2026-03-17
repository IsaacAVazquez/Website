"use client";

import React, { startTransition, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { StockSearch } from "./StockSearch";
import { ResearchSummaryStrip } from "./ResearchSummaryStrip";
import { ResearchOverview } from "./ResearchOverview";
import { FinancialStatementsPanel } from "./FinancialStatementsPanel";
import { ValuationRatiosPanel } from "./ValuationRatiosPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { GrowthPanel } from "./GrowthPanel";
import { IndustryPanel } from "./IndustryPanel";
import { DCFPanel } from "./DCFPanel";
import { ComparisonTab } from "./ComparisonTab";
import { PriceChartPanel } from "./PriceChartPanel";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import {
  fadeInVariants,
  getReducedMotionVariants,
} from "./animations";
import { useStockData } from "@/hooks/useStockData";
import { getClientInvestmentsIndex } from "@/lib/investmentsClientData";
import type {
  CompanyInfo,
  InvestmentCapabilities,
  InvestmentsIndex,
} from "@/types/investment";

interface Props {
  initialSymbol?: string;
  portfolioSymbols?: string[];
}

type ResearchTab = "overview" | "financials" | "growth" | "valuation" | "industry" | "dcf" | "chart" | "compare";

const TABS: { key: ResearchTab; label: string }[] = [
  { key: "overview",     label: "Overview" },
  { key: "financials",   label: "Financials" },
  { key: "growth",       label: "Growth" },
  { key: "valuation",    label: "Valuation" },
  { key: "industry",     label: "Industry" },
  { key: "dcf",          label: "DCF" },
  { key: "chart",        label: "Chart" },
  { key: "compare",      label: "Compare" },
];

function isTabAvailable(
  tab: ResearchTab,
  capabilities: InvestmentCapabilities
): boolean {
  switch (tab) {
    case "overview":
      return capabilities.info !== false;
    case "financials":
      return (
        capabilities.income_statement !== false &&
        capabilities.balance_sheet !== false &&
        capabilities.cash_flow !== false
      );
    case "growth":
      return capabilities.growth !== false;
    case "valuation":
      return capabilities.fundamentals !== false;
    case "industry":
      return capabilities.industry === true;
    case "dcf":
      return capabilities.dcf === true;
    case "chart":
      return capabilities.price !== false;
    case "compare":
      return capabilities.compare === true;
    default:
      return true;
  }
}

export function StockResearch({ initialSymbol = "", portfolioSymbols = [] }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [activeTab, setActiveTab] = useState<ResearchTab>("overview");
  const [datasetLastUpdated, setDatasetLastUpdated] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const {
    error: symbolError,
    isLoading: symbolLoading,
    isNotFetched: symbolNotFetched,
    source,
    capabilities,
    lastUpdated: symbolLastUpdated,
  } = useStockData<CompanyInfo>(symbol || null, "info");

  const v = shouldReduceMotion ? getReducedMotionVariants() : { fadeInVariants };

  // Load the curated dataset timestamp for prefetched research symbols.
  useEffect(() => {
    getClientInvestmentsIndex()
      .then((data: InvestmentsIndex) => {
        if (data.lastUpdated) setDatasetLastUpdated(data.lastUpdated);
      })
      .catch(() => {});
  }, []);

  const hasResearchContext = source !== null || Object.keys(capabilities).length > 0;
  const visibleTabs = useMemo(
    () =>
      symbol && hasResearchContext
        ? TABS.filter((tab) => isTabAvailable(tab.key, capabilities))
        : [],
    [capabilities, hasResearchContext, symbol]
  );

  const isInPortfolio = symbol && portfolioSymbols.includes(symbol);
  const freshnessMode = "dataset";
  const freshnessLastUpdated = symbolLastUpdated ?? datasetLastUpdated;
  const showNews = capabilities.news !== false;
  const resolvedActiveTab = visibleTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : "overview";
  const showCuratedOnlyState =
    !!symbol && !symbolLoading && symbolNotFetched && !hasResearchContext;
  const showResearchErrorState =
    !!symbol && !symbolLoading && !!symbolError && !showCuratedOnlyState && !hasResearchContext;
  const showLoadingState =
    !!symbol && symbolLoading && !hasResearchContext;

  function handleSymbolChange(nextSymbol: string) {
    startTransition(() => {
      setSymbol(nextSymbol);
      setActiveTab("overview");
    });
  }

  return (
    <section aria-label="Stock research">
      {/* Search bar + portfolio badge + freshness (hidden when Compare tab is active) */}
      {resolvedActiveTab !== "compare" && (
        <div className="flex items-start gap-3 flex-wrap mb-6">
          <StockSearch value={symbol} onChange={handleSymbolChange} />
          {isInPortfolio && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium self-center" style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)", color: "var(--color-success)" }}>
              In portfolio
            </span>
          )}
          <div className="self-center ml-auto">
            <DataFreshnessIndicator
              lastUpdated={freshnessLastUpdated}
              mode={freshnessMode}
            />
          </div>
        </div>
      )}

      {/* Inner tab bar */}
      {visibleTabs.length > 0 ? (
        <div
          className="flex gap-1 mb-5 overflow-x-auto pb-1 border-b border-[var(--border-primary)]"
          role="tablist"
          aria-label="Research sections"
        >
          {visibleTabs.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={resolvedActiveTab === key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-md transition whitespace-nowrap min-h-[44px] border-b-2 -mb-px ${
                resolvedActiveTab === key
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {resolvedActiveTab !== "compare" && symbol && !showCuratedOnlyState && hasResearchContext ? (
        <div className="mb-5">
          <ResearchSummaryStrip symbol={symbol} />
        </div>
      ) : null}

      {/* Tab panels with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={resolvedActiveTab}
          role="tabpanel"
          aria-label={`${resolvedActiveTab} panel`}
          variants={v.fadeInVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {resolvedActiveTab === "compare" ? (
            <ComparisonTab />
          ) : !symbol ? (
            <div className="text-center py-20">
              <p className="text-[var(--text-tertiary)] text-sm">
                Enter a stock symbol above to start researching.
              </p>
            </div>
          ) : showLoadingState ? (
            <div className="text-center py-20">
              <p className="text-[var(--text-tertiary)] text-sm">
                Loading curated research data for {symbol}…
              </p>
            </div>
          ) : showCuratedOnlyState ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--surface-secondary))] px-5 py-6 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Research is currently available for curated symbols only.
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {symbolError ?? `Try a symbol from the curated research universe instead of ${symbol}.`}
              </p>
            </div>
          ) : showResearchErrorState ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-error)_35%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--surface-secondary))] px-5 py-6 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Research data could not be loaded.
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {symbolError}
              </p>
            </div>
          ) : (
            <>
              {resolvedActiveTab === "overview" && (
                <ResearchOverview symbol={symbol} showNews={showNews} />
              )}
              {resolvedActiveTab === "financials" && <FinancialStatementsPanel symbol={symbol} />}
              {resolvedActiveTab === "growth" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              {resolvedActiveTab === "dcf" && <DCFPanel symbol={symbol} />}
              {resolvedActiveTab === "chart" && <PriceChartPanel symbol={symbol} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
