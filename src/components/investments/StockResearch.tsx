"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { StockSearch } from "./StockSearch";
import { FundamentalsPanel } from "./FundamentalsPanel";
import { FinancialStatementsPanel } from "./FinancialStatementsPanel";
import { ValuationRatiosPanel } from "./ValuationRatiosPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { GrowthPanel } from "./GrowthPanel";
import { TranscriptsPanel } from "./TranscriptsPanel";
import { IndustryPanel } from "./IndustryPanel";
import { DCFPanel } from "./DCFPanel";
import { NewsPanel } from "./NewsPanel";
import { ComparisonTab } from "./ComparisonTab";
import { PriceChartPanel } from "./PriceChartPanel";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import {
  fadeInVariants,
  getReducedMotionVariants,
} from "./animations";
import type { InvestmentsIndex } from "@/types/investment";

interface Props {
  initialSymbol?: string;
  portfolioSymbols?: string[];
}

type ResearchTab = "overview" | "financials" | "growth" | "valuation" | "industry" | "transcripts" | "dcf" | "chart" | "compare";

const TABS: { key: ResearchTab; label: string }[] = [
  { key: "overview",     label: "Overview" },
  { key: "financials",   label: "Financials" },
  { key: "growth",       label: "Growth" },
  { key: "valuation",    label: "Valuation" },
  { key: "industry",     label: "Industry" },
  { key: "transcripts",  label: "Transcripts" },
  { key: "dcf",          label: "DCF" },
  { key: "chart",        label: "Chart" },
  { key: "compare",      label: "Compare" },
];

export function StockResearch({ initialSymbol = "", portfolioSymbols = [] }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [activeTab, setActiveTab] = useState<ResearchTab>("overview");
  const [indexLastUpdated, setIndexLastUpdated] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const v = shouldReduceMotion ? getReducedMotionVariants() : { fadeInVariants };

  // Load index.json to get the last-updated date for research data
  useEffect(() => {
    fetch("/data/investments/index.json")
      .then((r) => r.json())
      .then((data: InvestmentsIndex) => {
        if (data.lastUpdated) setIndexLastUpdated(data.lastUpdated);
      })
      .catch(() => {});
  }, []);

  const isInPortfolio = symbol && portfolioSymbols.includes(symbol);

  return (
    <section aria-label="Stock research">
      {/* Search bar + portfolio badge + freshness (hidden when Compare tab is active) */}
      {activeTab !== "compare" && (
        <div className="flex items-start gap-3 flex-wrap mb-6">
          <StockSearch value={symbol} onChange={(s) => { setSymbol(s); setActiveTab("overview"); }} />
          {isInPortfolio && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium self-center" style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)", color: "var(--color-success)" }}>
              In portfolio
            </span>
          )}
          <div className="self-center ml-auto">
            <DataFreshnessIndicator lastUpdated={indexLastUpdated} />
          </div>
        </div>
      )}

      {/* Inner tab bar */}
      <div
        className="flex gap-1 mb-5 overflow-x-auto pb-1 border-b border-[var(--border-primary)]"
        role="tablist"
        aria-label="Research sections"
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 text-sm font-medium rounded-t-md transition whitespace-nowrap min-h-[44px] border-b-2 -mb-px ${
              activeTab === key
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          role="tabpanel"
          aria-label={`${activeTab} panel`}
          variants={v.fadeInVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {activeTab === "compare" ? (
            <ComparisonTab />
          ) : !symbol ? (
            <div className="text-center py-20">
              <p className="text-[var(--text-tertiary)] text-sm">
                Enter a stock symbol above to start researching.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FundamentalsPanel symbol={symbol} />
                  <div className="space-y-4">
                    <NewsPanel symbol={symbol} />
                  </div>
                </div>
              )}
              {activeTab === "financials" && <FinancialStatementsPanel symbol={symbol} />}
              {activeTab === "growth" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <GrowthPanel symbol={symbol} />
                  <ProfitabilityPanel symbol={symbol} />
                </div>
              )}
              {activeTab === "valuation" && <ValuationRatiosPanel symbol={symbol} />}
              {activeTab === "industry" && <IndustryPanel symbol={symbol} />}
              {activeTab === "transcripts" && <TranscriptsPanel symbol={symbol} />}
              {activeTab === "dcf" && <DCFPanel symbol={symbol} />}
              {activeTab === "chart" && <PriceChartPanel symbol={symbol} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
