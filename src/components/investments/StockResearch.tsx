"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  IconChartArcs3,
  IconChartLine,
  IconCircleHalf,
  IconHome,
  IconList,
  IconReportMoney,
} from "@tabler/icons-react";
import { ResearchAssetHeader } from "./ResearchAssetHeader";
import { ResearchOverview } from "./ResearchOverview";
import { FinancialStatementsPanel } from "./FinancialStatementsPanel";
import { ValuationRatiosPanel } from "./ValuationRatiosPanel";
import { ProfitabilityPanel } from "./ProfitabilityPanel";
import { GrowthPanel } from "./GrowthPanel";
import { IndustryPanel } from "./IndustryPanel";
import { ComparisonTab } from "./ComparisonTab";
import { PriceChartPanel } from "./PriceChartPanel";
import { StockSearch } from "./StockSearch";
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
  { key: "chart",        label: "Chart" },
  { key: "compare",      label: "Compare" },
];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: IconHome },
  { id: "performance", label: "Performance", icon: IconChartLine, href: "?view=portfolio#performance" },
  { id: "stats", label: "Portfolio stats", icon: IconCircleHalf, href: "?view=portfolio#portfolio-stats" },
  { id: "holdings", label: "My holdings", icon: IconList, href: "?view=portfolio#holdings-list" },
  { id: "allocation", label: "Allocation", icon: IconChartArcs3, href: "?view=portfolio#allocation" },
] as const;

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

export function StockResearch({
  symbol,
  activeTab,
  onSymbolChange,
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
    (t) => onTabChange(t.key),
  );
  const handleAllTabsKeyDown = useTablistKeyboard(
    TABS,
    (t) => onTabChange(t.key),
  );

  // Compare tab is full-width with no asset header
  if (resolvedActiveTab === "compare") {
    return (
      <div className="invest-shell" data-testid="invest-research-shell">
        <ResearchSidebar activeNavId="overview" />
        <div className="invest-main">
          <ResearchTopbar
            symbol={symbol}
            onSymbolChange={onSymbolChange}
            crumbTrail="Compare"
          />
          <div
            className="mb-4 flex gap-2 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-2 "
            role="tablist"
            aria-label="Research sections"
          >
            {TABS.map(({ key, label }, index) => (
              <button
                key={key}
                id={`research-tab-${key}`}
                role="tab"
                aria-selected={resolvedActiveTab === key}
                aria-controls={`research-panel-${key}`}
                tabIndex={resolvedActiveTab === key ? 0 : -1}
                onKeyDown={(e) => handleAllTabsKeyDown(e, index)}
                onClick={() => onTabChange(key)}
                className={`min-h-[44px] whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold transition ${
                  resolvedActiveTab === key
                    ? "bg-[var(--home-signal)] text-white"
                    : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id={`research-panel-${resolvedActiveTab}`}
            role="tabpanel"
            aria-labelledby={`research-tab-${resolvedActiveTab}`}
          >
            <ComparisonTab />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invest-shell" data-testid="invest-research-shell">
      <ResearchSidebar activeNavId="overview" />

      <div className="invest-main">
        <ResearchTopbar
          symbol={symbol}
          onSymbolChange={onSymbolChange}
          crumbTrail={symbol ? symbol.toUpperCase() : "Pick a ticker"}
        />

        <div className="space-y-5">
          {!symbol ? (
            <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-16 text-center ">
              <p className="text-sm font-semibold text-[var(--home-ink)]">
                Start with a ticker symbol
              </p>
              <p className="mt-2 text-sm text-[var(--home-ink-soft)]">
                Search a ticker or company name in the bar above to start researching.
              </p>
            </div>
          ) : showLoadingState ? (
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
              />

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
                  {resolvedActiveTab === "chart" && <PriceChartPanel symbol={symbol} />}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResearchSidebar({ activeNavId }: { activeNavId: string }) {
  return (
    <aside className="invest-sidebar" aria-label="Investments navigation">
      <div className="invest-brand">
        <div className="invest-brand-iv" aria-hidden="true">IV</div>
        <div className="invest-brand-name">
          Isaac Vazquez
          <small>Investments</small>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5" aria-label="Section navigation">
        <a href="?view=portfolio#hero" className="invest-nav-link">
          <IconHome size={18} aria-hidden="true" />
          Portfolio home
        </a>
        <span
          className="invest-nav-link is-active"
          aria-current="true"
        >
          <IconReportMoney size={18} aria-hidden="true" />
          Research
        </span>
        {NAV_ITEMS.filter((it) => it.id !== "overview").map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.id} href={item.href ?? "#"} className="invest-nav-link">
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="invest-sidebar-footer">
        <span>{activeNavId === "overview" ? "Curated snapshots" : "—"}</span>
      </div>
    </aside>
  );
}

function ResearchTopbar({
  symbol,
  onSymbolChange,
  crumbTrail,
}: {
  symbol: string;
  onSymbolChange: (s: string) => void;
  crumbTrail: string;
}) {
  return (
    <div className="invest-topbar">
      <div>
        <p className="invest-crumbs">
          Investments / Research / <strong>{crumbTrail}</strong>
        </p>
        <h1>Research</h1>
      </div>

      <div className="research-topbar-search">
        <StockSearch value={symbol} onChange={onSymbolChange} />
      </div>

      <div className="flex items-center gap-2">
        <span className="invest-avatar" aria-hidden="true">IV</span>
      </div>
    </div>
  );
}
