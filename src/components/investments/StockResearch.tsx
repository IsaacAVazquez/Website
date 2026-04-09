"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import type { ResearchTab } from "@/app/investments/investments-state";

interface Props {
  symbol: string;
  activeTab: ResearchTab;
  onSymbolChange: (symbol: string) => void;
  onTabChange: (tab: ResearchTab) => void;
  portfolioSymbols?: string[];
}

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

function getCuratedOnlyMessage(symbol: string) {
  return `${symbol.toUpperCase()} is not in the current research set. Search by ticker or company name to pick an available symbol.`;
}

function getResearchErrorMessage(error: string | null) {
  if (!error) {
    return "Research data is temporarily unavailable. Try again shortly.";
  }

  if (/temporarily unavailable/i.test(error)) {
    return "Research data is temporarily unavailable. Try again shortly.";
  }

  return error;
}

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

export function StockResearch({
  symbol,
  activeTab,
  onSymbolChange,
  onTabChange,
  portfolioSymbols = [],
}: Props) {
  const [datasetLastUpdated, setDatasetLastUpdated] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const {
    error: symbolError,
    isLoading: symbolLoading,
    isNotFetched: symbolNotFetched,
    source,
    capabilities,
    lastUpdated: symbolLastUpdated,
    freshness: symbolFreshness,
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

  const hasResearchContext = source !== null && !symbolError;
  const visibleTabs = useMemo(
    () =>
      symbol && hasResearchContext
        ? TABS.filter((tab) => isTabAvailable(tab.key, capabilities))
        : [],
    [capabilities, hasResearchContext, symbol]
  );

  const isInPortfolio = symbol && portfolioSymbols.includes(symbol);
  const freshnessMode = "dataset";
  const freshnessLastUpdated =
    symbolFreshness?.snapshotBuiltAt ?? symbolLastUpdated ?? datasetLastUpdated;
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

  useEffect(() => {
    if (symbol && visibleTabs.length > 0 && !visibleTabs.some((tab) => tab.key === activeTab)) {
      onTabChange("overview");
    }
  }, [activeTab, onTabChange, symbol, visibleTabs]);

  return (
    <section aria-label="Stock research" className="space-y-6">
      {resolvedActiveTab !== "compare" && (
        <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Research Symbol
                </p>
                <StockSearch value={symbol} onChange={onSymbolChange} />
              </div>
              {isInPortfolio ? (
                <span
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full px-3 py-2 text-xs font-semibold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)",
                    color: "var(--color-success)",
                  }}
                >
                  In portfolio
                </span>
              ) : null}
            </div>

            <div className="justify-self-start xl:justify-self-end">
              <DataFreshnessIndicator
                lastUpdated={freshnessLastUpdated}
                mode={freshnessMode}
              />
            </div>
          </div>
        </div>
      )}

      {visibleTabs.length > 0 ? (
        <div
          className="flex gap-2 overflow-x-auto rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] p-2 shadow-[var(--shadow-sm)]"
          role="tablist"
          aria-label="Research sections"
        >
          {visibleTabs.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={resolvedActiveTab === key}
              onClick={() => onTabChange(key)}
              className={`min-h-[44px] whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                resolvedActiveTab === key
                  ? "bg-[var(--home-haze)] text-white"
                  : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {resolvedActiveTab !== "compare" && symbol && !showCuratedOnlyState && hasResearchContext ? (
        <div>
          <ResearchSummaryStrip symbol={symbol} />
        </div>
      ) : null}

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
            <div className="rounded-[28px] border border-dashed border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold text-[var(--home-ink)]">
                Start with a ticker symbol
              </p>
              <p className="mt-2 text-sm text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                Enter a stock symbol above to start researching.
              </p>
            </div>
          ) : showLoadingState ? (
            <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold text-[var(--home-ink)]">
                Loading research data…
              </p>
              <p className="mt-2 text-sm text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                Pulling the latest curated snapshot for {symbol.toUpperCase()}.
              </p>
            </div>
          ) : showCuratedOnlyState ? (
            <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--home-paper-alt))] px-5 py-6 text-center shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold text-[var(--home-ink)]">
                This symbol is not in the current research set.
              </p>
              <p className="mt-2 text-sm text-[var(--home-ink-muted)]">
                {getCuratedOnlyMessage(symbol)}
              </p>
            </div>
          ) : showResearchErrorState ? (
            <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--color-error)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--home-paper-alt))] px-5 py-6 text-center shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold text-[var(--home-ink)]">
                Research data is temporarily unavailable.
              </p>
              <p className="mt-2 text-sm text-[var(--home-ink-muted)]">
                {getResearchErrorMessage(symbolError)}
              </p>
            </div>
          ) : (
            <>
              {resolvedActiveTab === "overview" && (
                <ResearchOverview symbol={symbol} showNews={showNews} />
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
              {resolvedActiveTab === "dcf" && <DCFPanel symbol={symbol} />}
              {resolvedActiveTab === "chart" && <PriceChartPanel symbol={symbol} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
