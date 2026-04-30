"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ResearchAssetHeader } from "./ResearchAssetHeader";
import { ResearchOverview } from "./ResearchOverview";
import { FinancialStatementsPanel } from "./FinancialStatementsPanel";
import { ValuationRatiosPanel } from "./ValuationRatiosPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { GrowthPanel } from "./GrowthPanel";
import { IndustryPanel } from "./IndustryPanel";
import { DCFPanel } from "./DCFPanel";
import { ComparisonTab } from "./ComparisonTab";
import { PriceChartPanel } from "./PriceChartPanel";
import {
  fadeInVariants,
  getReducedMotionVariants,
} from "./animations";
import { useStockData } from "@/hooks/useStockData";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
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
    case "dcf":         return capabilities.dcf === true;
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
}: Props) {
  const [, setDatasetLastUpdated] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const {
    error: symbolError,
    isLoading: symbolLoading,
    isNotFetched: symbolNotFetched,
    source,
    capabilities,
  } = useStockData<CompanyInfo>(symbol || null, "info");

  const v = shouldReduceMotion ? getReducedMotionVariants() : { fadeInVariants };

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
    (t) => t.key,
    (t) => onTabChange(t.key),
  );

  if (!symbol) {
    return (
      <section
        id="research-section"
        aria-label="Stock research"
        className="scroll-mt-28 rounded-[28px] border border-dashed border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-12 text-center shadow-[var(--shadow-sm)]"
      >
        <p className="invest-rail-section-label">Research</p>
        <p className="text-sm font-semibold text-[var(--home-ink)]">
          Pick a holding to research
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--home-ink-muted)]">
          Click <strong className="text-[var(--home-ink)]">Research</strong> on any holding above
          to load the deep-dive view with fundamentals, valuation, growth, DCF, and a price chart.
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
        <div className="rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
          <p className="text-sm font-semibold text-[var(--home-ink)]">
            Loading research data…
          </p>
          <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
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
          <ResearchAssetHeader symbol={symbol} isInPortfolio={isInPortfolio} />

          {visibleTabs.length > 0 ? (
            <div
              className="flex gap-2 overflow-x-auto rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-2 shadow-[var(--shadow-sm)]"
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
                  className={`min-h-[40px] whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition ${
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
              {resolvedActiveTab === "dcf" && <DCFPanel symbol={symbol} />}
              {resolvedActiveTab === "chart" && <PriceChartPanel symbol={symbol} />}
              {resolvedActiveTab === "compare" && <ComparisonTab />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
