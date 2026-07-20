"use client";

import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ResearchAssetHeader } from "./ResearchAssetHeader";
import { ResearchPosition } from "./ResearchPosition";
import { ResearchOverview } from "./ResearchOverview";
import { FinancialStatementsPanel } from "./FinancialStatementsPanel";
import { ValuationRatiosPanel } from "./ValuationRatiosPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { GrowthPanel } from "./GrowthPanel";
import { IndustryPanel } from "./IndustryPanel";
import { ComparisonTab } from "./ComparisonTab";
import { PriceChartPanel } from "./PriceChartPanel";
import {
  fadeInVariants,
  getReducedMotionVariants,
} from "./animations";
import { useStockData } from "@/hooks/useStockData";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
import type {
  CompanyInfo,
  EnhancedHolding,
  InvestmentCapabilities,
} from "@/types/investment";
import type { ResearchTab } from "@/app/investments/investments-state";

interface Props {
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

export function ResearchSection({
  symbol,
  activeTab,
  onTabChange,
  portfolioSymbols = [],
  position = null,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const {
    error: symbolError,
    isLoading: symbolLoading,
    isNotFetched: symbolNotFetched,
    source,
    capabilities,
  } = useStockData<CompanyInfo>(symbol || null, "info");

  const v = shouldReduceMotion ? getReducedMotionVariants() : { fadeInVariants };

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

  if (!symbol) {
    return (
      <section
        id="research-section"
        aria-label="Stock research"
        className="scroll-mt-28 rounded-[var(--radius-sm)] border border-dashed border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-12 text-center "
      >
        <p className="invest-rail-section-label">Research</p>
        <p className="text-sm font-semibold text-[var(--home-ink)]">
          Pick a holding to research
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--home-ink-muted)]">
          Click <strong className="text-[var(--home-ink)]">Research</strong> on any holding above
          to load the deep-dive view with fundamentals, valuation, growth, and a price chart.
        </p>
      </section>
    );
  }

  return (
    <section
      id="research-section"
      aria-label={`Research · ${symbol.toUpperCase()}`}
      className="scroll-mt-28 space-y-5"
    >
      {showLoadingState ? (
        <div className="rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-16 text-center ">
          <p className="text-sm font-semibold text-[var(--home-ink)]">
            Loading research data…
          </p>
          <p className="mt-2 text-sm text-[var(--home-ink-soft)]">
            Pulling the latest curated snapshot for {symbol.toUpperCase()}.
          </p>
        </div>
      ) : showCuratedOnlyState ? (
        <div className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--home-warning)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-warning)_10%,var(--home-paper-alt))] px-5 py-6 text-center ">
          <p className="text-sm font-semibold text-[var(--home-ink)]">
            This symbol is not in the current research set.
          </p>
          <p className="mt-2 text-sm text-[var(--home-ink-muted)]">
            {getCuratedOnlyMessage(symbol)}
          </p>
        </div>
      ) : showResearchErrorState ? (
        <div className="rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--home-negative)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_8%,var(--home-paper-alt))] px-5 py-6 text-center ">
          <p className="text-sm font-semibold text-[var(--home-ink)]">
            Research data is temporarily unavailable.
          </p>
          <p className="mt-2 text-sm text-[var(--home-ink-muted)]">
            {getResearchErrorMessage(symbolError)}
          </p>
        </div>
      ) : (
        <>
          <ResearchAssetHeader
            symbol={symbol}
            isInPortfolio={isInPortfolio}
            portfolioShares={position?.shares ?? null}
          />

          {position ? <ResearchPosition position={position} /> : null}

          {visibleTabs.length > 0 ? (
            <div
              className="flex gap-2 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-2 "
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
                  className={`min-h-[40px] whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold transition ${
                    resolvedActiveTab === key
                      ? "bg-[var(--home-ink)] text-[var(--home-paper)]"
                      : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={resolvedActiveTab}
              id={`research-panel-${resolvedActiveTab}`}
              role="tabpanel"
              aria-labelledby={`research-tab-${resolvedActiveTab}`}
              variants={v.fadeInVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
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
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
