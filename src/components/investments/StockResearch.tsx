"use client";

import React, { useState } from "react";
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

interface Props {
  initialSymbol?: string;
  portfolioSymbols?: string[];
}

type ResearchTab = "overview" | "financials" | "growth" | "valuation" | "industry" | "transcripts" | "dcf";

const TABS: { key: ResearchTab; label: string }[] = [
  { key: "overview",     label: "Overview" },
  { key: "financials",   label: "Financials" },
  { key: "growth",       label: "Growth" },
  { key: "valuation",    label: "Valuation" },
  { key: "industry",     label: "Industry" },
  { key: "transcripts",  label: "Transcripts" },
  { key: "dcf",          label: "DCF" },
];

export function StockResearch({ initialSymbol = "", portfolioSymbols = [] }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [activeTab, setActiveTab] = useState<ResearchTab>("overview");

  const isInPortfolio = symbol && portfolioSymbols.includes(symbol);

  return (
    <section aria-label="Stock research">
      {/* Search bar + portfolio badge */}
      <div className="flex items-start gap-3 flex-wrap mb-6">
        <StockSearch value={symbol} onChange={(s) => { setSymbol(s); setActiveTab("overview"); }} />
        {isInPortfolio && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 self-center">
            In portfolio
          </span>
        )}
      </div>

      {!symbol ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-tertiary)] text-sm">
            Enter a stock symbol above to start researching.
          </p>
        </div>
      ) : (
        <>
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

          {/* Tab panels */}
          <div role="tabpanel" aria-label={`${activeTab} panel`}>
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
          </div>
        </>
      )}
    </section>
  );
}
