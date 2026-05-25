"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  IconBookmark,
  IconChartArcs3,
  IconChartLine,
  IconCircleHalf,
  IconHelp,
  IconHome,
  IconList,
  IconReportMoney,
  IconSearch,
  IconWallet,
} from "@tabler/icons-react";
import { PortfolioSummary } from "./PortfolioSummary";
import { AddStockForm } from "./AddStockForm";
import { AllocationChart } from "./AllocationChart";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { HoldingsTable } from "./HoldingsTable";
import { ResearchSection } from "./ResearchSection";
import { StockSearch } from "./StockSearch";
import { useInvestments } from "@/hooks/useInvestments";
import type { ResearchTab } from "@/app/investments/investments-state";

interface Props {
  researchSymbol: string;
  researchTab: ResearchTab;
  onResearchSymbolChange: (symbol: string) => void;
  onResearchTabChange: (tab: ResearchTab) => void;
  datasetLastUpdated?: string | null;
  datasetSymbolCount?: number;
  datasetFailedCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  pill?: string;
}

function formatDatasetDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function InvestmentsDashboard({
  researchSymbol,
  researchTab,
  onResearchSymbolChange,
  onResearchTabChange,
  datasetLastUpdated,
  datasetSymbolCount = 0,
  datasetFailedCount = 0,
}: Props) {
  const {
    enhancedHoldings,
    summary,
    isLoading,
    error,
    lastUpdated,
    snapshots,
    addHolding,
    updateHolding,
    removeHolding,
    refetch,
  } = useInvestments();

  const [searchQuery, setSearchQuery] = useState("");
  const addHoldingRef = useRef<HTMLDivElement | null>(null);
  const researchSectionRef = useRef<HTMLDivElement | null>(null);

  const filteredHoldings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enhancedHoldings;
    return enhancedHoldings.filter(
      (h) =>
        h.symbol.toLowerCase().includes(q) ||
        (h.name ?? "").toLowerCase().includes(q),
    );
  }, [enhancedHoldings, searchQuery]);

  const portfolioSymbols = useMemo(
    () => enhancedHoldings.map((h) => h.symbol),
    [enhancedHoldings],
  );

  const isEmpty = enhancedHoldings.length === 0;

  const navItems: NavItem[] = useMemo(
    () => [
      { id: "home", label: "Overview", href: "#hero", icon: IconHome },
      {
        id: "holdings",
        label: "Holdings",
        href: "#holdings-list",
        icon: IconList,
        pill: enhancedHoldings.length > 0 ? String(enhancedHoldings.length) : undefined,
      },
      { id: "allocation", label: "Allocation", href: "#allocation", icon: IconChartArcs3 },
      { id: "stats", label: "Portfolio stats", href: "#portfolio-stats", icon: IconCircleHalf },
      { id: "performance", label: "Performance", href: "#hero", icon: IconChartLine },
      { id: "research", label: "Research", href: "#research-section", icon: IconReportMoney },
    ],
    [enhancedHoldings.length],
  );

  function focusAddHolding() {
    if (addHoldingRef.current) {
      addHoldingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const input = addHoldingRef.current.querySelector("input");
      if (input instanceof HTMLInputElement) {
        setTimeout(() => input.focus(), 200);
      }
    }
  }

  function handleResearch(symbol: string) {
    onResearchSymbolChange(symbol);
    setTimeout(() => {
      researchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleSymbolPick(symbol: string) {
    onResearchSymbolChange(symbol);
    setTimeout(() => {
      researchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  return (
    <div className="invest-page-stack">
    <div className="invest-shell" data-testid="invest-shell">
      <aside className="invest-sidebar" aria-label="Investments navigation">
        <div className="invest-brand">
          <div className="invest-brand-iv" aria-hidden="true">IV</div>
          <div className="invest-brand-name">
            Isaac Vazquez
            <small>Investments</small>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5" aria-label="Section navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.id} href={item.href} className="invest-nav-link">
                <Icon size={18} aria-hidden="true" />
                {item.label}
                {item.pill ? <span className="invest-nav-pill">{item.pill}</span> : null}
              </a>
            );
          })}
        </nav>

        <div className="invest-sidebar-footer">
          <IconBookmark size={16} aria-hidden="true" />
          <span>Local browser storage</span>
        </div>
      </aside>

      <div className="invest-main" id="hero">
        <div className="invest-topbar">
          <div>
            <p className="invest-crumbs">Investments / <strong>Dashboard</strong></p>
            <h1>Investments</h1>
          </div>

          <label className="invest-search" aria-label="Filter holdings">
            <IconSearch size={14} aria-hidden="true" />
            <input
              type="search"
              placeholder="Filter holdings…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="invest-search-kbd" aria-hidden="true">⌘K</span>
          </label>

          <div className="flex items-center gap-2">
            <DataFreshnessIndicator
              lastUpdated={lastUpdated}
              onRefresh={refetch}
              isRefreshing={isLoading}
            />
            <span className="invest-avatar" aria-hidden="true">IV</span>
          </div>
        </div>

        {/* Compact dataset freshness chip */}
        <div className="invest-dataset-chip" role="status" aria-live="polite">
          <span className="invest-dataset-chip-dot" aria-hidden="true" />
          <span>
            <strong>Curated snapshot</strong> · {formatDatasetDate(datasetLastUpdated)}
          </span>
          {datasetSymbolCount > 0 ? (
            <span className="invest-dataset-chip-divider" aria-hidden="true">·</span>
          ) : null}
          {datasetSymbolCount > 0 ? (
            <span>
              {datasetSymbolCount} {datasetSymbolCount === 1 ? "company" : "companies"}
            </span>
          ) : null}
          {datasetFailedCount > 0 ? (
            <>
              <span className="invest-dataset-chip-divider" aria-hidden="true">·</span>
              <span className="invest-dataset-chip-warn">
                {datasetFailedCount} pending
              </span>
            </>
          ) : null}
          <span className="invest-dataset-chip-spacer" />
          <span className="invest-dataset-chip-meta">Live prices via Finnhub</span>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--home-paper-alt))] px-4 py-3 text-sm text-[var(--home-ink-muted)]">
            {error}
          </div>
        ) : null}

        <div className="mt-5 space-y-5">
          <PortfolioSummary
            summary={summary}
            holdings={enhancedHoldings}
            snapshots={snapshots}
            isLoading={isLoading}
            onAddHolding={focusAddHolding}
            onRefresh={refetch}
            lastUpdated={lastUpdated}
          />

          {!isEmpty ? (
            <HoldingsTable
              holdings={filteredHoldings}
              onUpdate={updateHolding}
              onRemove={removeHolding}
              onResearch={handleResearch}
            />
          ) : (
            <div className="rounded-[28px] border border-dashed border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-6 py-16 text-center shadow-[var(--shadow-sm)]">
              <p className="mb-2 text-sm font-semibold text-[var(--home-ink)]">
                No positions yet
              </p>
              <p className="mx-auto max-w-xs text-sm text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]">
                Add your first stock using the form on the right. Holdings are saved in your browser and persist across visits.
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="invest-rail" aria-label="Portfolio side panel">
        <section ref={addHoldingRef} id="add-holding" className="scroll-mt-28">
          <p className="invest-rail-section-label">
            <IconWallet size={12} aria-hidden="true" className="mr-1.5 inline align-middle" />
            Add a holding
          </p>
          <AddStockForm onAdd={addHolding} />
        </section>

        {!isEmpty ? (
          <section id="allocation" className="scroll-mt-28">
            <p className="invest-rail-section-label">Allocation</p>
            <AllocationChart holdings={enhancedHoldings} />
          </section>
        ) : null}

        {!isEmpty ? (
          <section className="invest-rail-movers">
            <p className="invest-rail-section-label">Today's movers</p>
            <ul className="invest-rail-mover-list">
              {[...enhancedHoldings]
                .sort(
                  (a, b) =>
                    Math.abs(b.dayChangePercent) - Math.abs(a.dayChangePercent),
                )
                .slice(0, 4)
                .map((h) => {
                  const positive = h.dayChangePercent >= 0;
                  const showName =
                    h.name && h.name.toUpperCase() !== h.symbol.toUpperCase();
                  return (
                    <li key={h.symbol}>
                      <button
                        type="button"
                        className="invest-rail-mover"
                        onClick={() => handleResearch(h.symbol)}
                      >
                        <span className="invest-rail-mover-sym">{h.symbol}</span>
                        <span className="invest-rail-mover-name">
                          {showName ? h.name : ""}
                        </span>
                        <span
                          className={
                            positive
                              ? "invest-rail-mover-delta pos"
                              : "invest-rail-mover-delta neg"
                          }
                        >
                          {positive ? "+" : "−"}
                          {Math.abs(h.dayChangePercent).toFixed(2)}%
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ) : null}

        <p className="mt-auto flex items-center gap-2 text-[11.5px] text-[var(--home-ink-muted)]">
          <IconHelp size={14} aria-hidden="true" />
          Holdings live only in your browser — no logins, no cloud sync.
        </p>
      </aside>
    </div>

    {/* Research deep-dive — full width below the shell so it doesn't leave
        the rail empty next to a long single-asset view. Symbol comes from
        clicking "Research" on a holding row or the picker below. */}
    <section
      ref={researchSectionRef}
      className="invest-research-band"
      aria-label="Research deep dive"
    >
      <div className="invest-section-header">
        <div>
          <p className="invest-section-kicker">Deep dive</p>
          <h2 className="invest-section-title">Research</h2>
        </div>
        <div className="invest-section-search">
          <StockSearch value={researchSymbol} onChange={handleSymbolPick} />
        </div>
      </div>

      <ResearchSection
        symbol={researchSymbol}
        activeTab={researchTab}
        onTabChange={onResearchTabChange}
        portfolioSymbols={portfolioSymbols}
      />
    </section>
    </div>
  );
}
