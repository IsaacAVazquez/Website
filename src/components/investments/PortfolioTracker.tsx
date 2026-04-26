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
import { useInvestments } from "@/hooks/useInvestments";

interface Props {
  onResearch: (symbol: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  pill?: string;
}

export function PortfolioTracker({ onResearch }: Props) {
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
  const [activeSection, setActiveSection] = useState("home");
  const addHoldingRef = useRef<HTMLDivElement | null>(null);

  const filteredHoldings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enhancedHoldings;
    return enhancedHoldings.filter(
      (h) =>
        h.symbol.toLowerCase().includes(q) ||
        (h.name ?? "").toLowerCase().includes(q),
    );
  }, [enhancedHoldings, searchQuery]);

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
      { id: "performance", label: "Performance", href: "#performance-chart", icon: IconChartLine },
      { id: "stats", label: "Portfolio stats", href: "#portfolio-stats", icon: IconCircleHalf },
      { id: "research", label: "Research", href: "#research-tools", icon: IconReportMoney },
    ],
    [enhancedHoldings.length],
  );

  function focusAddHolding() {
    setActiveSection("add");
    if (addHoldingRef.current) {
      addHoldingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const input = addHoldingRef.current.querySelector("input");
      if (input instanceof HTMLInputElement) {
        // Defer focus a tick so smooth scroll initiates first.
        setTimeout(() => input.focus(), 200);
      }
    }
  }

  return (
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
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className="invest-nav-link"
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActiveSection(item.id)}
              >
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

      <main className="invest-main" id="hero">
        <div className="invest-topbar">
          <div>
            <p className="invest-crumbs">Investments / <strong>Portfolio</strong></p>
            <h1>Portfolio</h1>
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

        {error ? (
          <div className="mb-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--home-paper-alt))] px-4 py-3 text-sm text-[var(--home-ink-muted)]">
            {error}
          </div>
        ) : null}

        <div className="space-y-5">
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
              onResearch={onResearch}
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
      </main>

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

        <section
          id="research-tools"
          className="scroll-mt-28 rounded-[18px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_60%,var(--home-elev-mix))] p-4"
        >
          <p className="invest-rail-section-label">Research</p>
          <p className="text-[12.5px] leading-relaxed text-[var(--home-ink-muted)]">
            Click <strong className="text-[var(--home-ink)]">Research</strong> on any
            holding to open the deep-dive view — fundamentals, valuation history, news,
            and price chart with cost-basis overlay.
          </p>
        </section>

        <p className="mt-auto flex items-center gap-2 text-[11.5px] text-[var(--home-ink-muted)]">
          <IconHelp size={14} aria-hidden="true" />
          Holdings live only in your browser — no logins, no cloud sync.
        </p>
      </aside>
    </div>
  );
}
