"use client";

import { ChartLine, Contrast, House, List, PiggyBank, Plus, ReceiptText, Search } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PortfolioSummary } from "./PortfolioSummary";
import { AddStockForm } from "./AddStockForm";
import { AllocationChart } from "./AllocationChart";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";
import { HoldingsTable } from "./HoldingsTable";
import { ResearchSection } from "./ResearchSection";
import { StockSearch } from "./StockSearch";
import { RetirementPlanner } from "./retirement/RetirementPlanner";
import { useInvestments } from "@/hooks/useInvestments";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { InvestmentsTask, ResearchTab } from "@/app/investments/investments-state";
import { InstrumentTape, type InstrumentTapeItem } from "@/components/editorial/InstrumentTape";
import { formatCurrency, formatPercent } from "@/lib/investmentFormatting";
import { getClientInvestmentsIndex } from "@/lib/investmentsClientData";
import { buildInvestmentsPriceHealth, countQuoteSources } from "@/lib/investmentsPriceHealth";
import { holdingColor } from "./holdingPalette";
import type { InvestmentsPriceHealth } from "@/types/investment";
import styles from "@/app/investments/investments.module.css";

interface Props {
  /** The workspace printed first, kept in the URL as ?task=. */
  task?: InvestmentsTask;
  onTaskChange?: (task: InvestmentsTask) => void;
  researchSymbol: string;
  researchTab: ResearchTab;
  onResearchSymbolChange: (symbol: string) => void;
  onResearchTabChange: (tab: ResearchTab) => void;
  datasetLastUpdated?: string | null;
  datasetSymbolCount?: number;
  datasetFreshCount?: number;
  datasetStaleCount?: number;
  datasetFailedCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  pill?: string;
}

const TASKS: { id: InvestmentsTask; label: string }[] = [
  { id: "portfolio", label: "Portfolio" },
  { id: "research", label: "Research" },
  { id: "retirement", label: "Retirement" },
];

// The chosen workspace prints first and the other two follow it, so every
// section link and a print of the page still reach all three.
const TASK_ORDER: Record<InvestmentsTask, InvestmentsTask[]> = {
  portfolio: ["portfolio", "research", "retirement"],
  research: ["research", "portfolio", "retirement"],
  retirement: ["retirement", "research", "portfolio"],
};

// `raw` is the index snapshot's `lastUpdated`, a full instant ("2026-09-15T01:03:45+00:00"),
// not a bare date. It prints in UTC, the day the build stamped it, which the
// server and every browser agree on. Unpinned, this was the "Sep 15" (server,
// UTC) vs "Sep 14" (a Pacific browser) hydration mismatch.
function formatDatasetDate(raw: string | null | undefined): string {
  if (!raw) return "an unknown date";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function InvestmentsDashboard({
  task = "portfolio",
  onTaskChange,
  researchSymbol,
  researchTab,
  onResearchSymbolChange,
  onResearchTabChange,
  datasetLastUpdated,
  datasetSymbolCount = 0,
  datasetFreshCount = 0,
  datasetStaleCount = 0,
  datasetFailedCount = 0,
}: Props) {
  const {
    enhancedHoldings,
    summary,
    isLoading,
    error,
    lastUpdated,
    snapshots,
    persistenceStatus,
    addHolding,
    updateHolding,
    removeHolding,
    refetch,
  } = useInvestments();
  const reduceMotion = useReducedMotion();
  const scrollBehavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";

  const [searchQuery, setSearchQuery] = useState("");
  // The index's own priceHealth was counted when the snapshots were built, so
  // it goes on calling a price recent for as long as that build is deployed.
  // This counts the same dates against the day the page is read.
  const [priceHealth, setPriceHealth] = useState<InvestmentsPriceHealth | null>(null);
  useEffect(() => {
    let cancelled = false;
    getClientInvestmentsIndex()
      .then((index) => {
        if (cancelled) return;
        setPriceHealth(
          buildInvestmentsPriceHealth(
            (index.entries ?? []).map((entry) => entry.priceAsOf),
            new Date().toISOString(),
          ),
        );
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);
  const addHoldingRef = useRef<HTMLElement | null>(null);
  const researchSectionRef = useRef<HTMLElement | null>(null);
  const filterInputRef = useRef<HTMLInputElement | null>(null);

  // ⌘K / Ctrl+K focuses the holdings filter (matching the keyboard hint).
  // Leave the shortcut alone while the user is typing somewhere else, and on
  // an empty portfolio, where there is no filter and site search keeps it.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      if (!filterInputRef.current) return;
      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT") &&
        target !== filterInputRef.current;
      if (isEditable) return;
      e.preventDefault();
      // Catalog97Header binds Cmd/Ctrl+K on window as well, for the site-wide
      // search overlay. A capture listener on window runs before every bubble
      // listener on window, so claiming the event here makes the badge beside
      // the filter tell the truth.
      e.stopPropagation();
      filterInputRef.current.focus();
      filterInputRef.current.select();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

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

  const researchPosition = useMemo(
    () => enhancedHoldings.find((h) => h.symbol === researchSymbol) ?? null,
    [enhancedHoldings, researchSymbol],
  );

  const isEmpty = enhancedHoldings.length === 0;

  // Quote tape uses only live/saved market prices. Cost basis is an accounting
  // input and should never masquerade as a quote.
  const tapeItems: InstrumentTapeItem[] = useMemo(
    () =>
      enhancedHoldings.map((h) => {
        const positive = h.dayChangePercent >= 0;
        return {
          key: h.symbol,
          content: (
            <span className={styles.quote}>
              <span className={styles.quoteSym} style={{ borderLeft: `3px solid ${holdingColor(h.symbol, portfolioSymbols)}`, paddingLeft: "var(--c97-sp-1)" }}>
                {h.symbol}
              </span>
              <span className={styles.quotePx}>
                {h.priceSource === "costBasis" ? "Price unavailable" : formatCurrency(h.currentPrice)}
              </span>
              {h.priceSource === "live" ? (
                <span className={positive ? "text-[var(--c97-positive)]" : "text-[var(--c97-negative)]"}>
                  {formatPercent(h.dayChangePercent)}
                </span>
              ) : null}
            </span>
          ),
        };
      }),
    [enhancedHoldings, portfolioSymbols],
  );

  // The links follow the page, so they list the chosen workspace's sections
  // first, in the order TASK_ORDER prints them.
  const navItems: NavItem[] = useMemo(() => {
    const sections: Record<InvestmentsTask, NavItem[]> = {
      portfolio: [
        { id: "performance", label: "Performance", href: "#performance", icon: ChartLine },
        // The stats row and the allocation chart only render once there is a
        // position, so on an empty portfolio these would jump to nothing.
        ...(isEmpty
          ? []
          : ([{ id: "stats", label: "Portfolio stats", href: "#portfolio-stats", icon: Contrast }] as NavItem[])),
        {
          id: "holdings",
          label: "Holdings",
          href: "#holdings-list",
          icon: List,
          pill: isEmpty ? undefined : String(enhancedHoldings.length),
        },
      ],
      research: [{ id: "research", label: "Research", href: "#research-section", icon: ReceiptText }],
      retirement: [{ id: "retirement", label: "Retirement", href: "#retirement", icon: PiggyBank }],
    };
    return [
      { id: "home", label: "Overview", href: "#hero", icon: House },
      ...TASK_ORDER[task].flatMap((id) => sections[id]),
    ];
  }, [enhancedHoldings.length, isEmpty, task]);

  // Marks the section under the upper middle of the viewport as current
  // (aria-current). The hero card swaps its target element once loading
  // settles, so it re-observes then. Research is watched through its outer
  // pane, because the inner #research-section is replaced when the lazy
  // workspace chunk resolves.
  const [activeSection, setActiveSection] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const researchPane = researchSectionRef.current;
    const targets = navItems
      .map((item) =>
        item.href === "#research-section" ? researchPane : document.getElementById(item.href.slice(1)),
      )
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setActiveSection(entry.target === researchPane ? "research-section" : entry.target.id);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navItems, isLoading]);

  function focusAddHolding() {
    if (addHoldingRef.current) {
      addHoldingRef.current.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      // The form starts closed and only renders its inputs once opened, so open
      // it first when there is nothing to focus yet.
      if (!addHoldingRef.current.querySelector("input")) {
        addHoldingRef.current
          .querySelector<HTMLButtonElement>('button[aria-label="Add holding"]')
          ?.click();
      }
      setTimeout(() => addHoldingRef.current?.querySelector("input")?.focus(), 200);
    }
  }

  function handleResearch(symbol: string) {
    onResearchSymbolChange(symbol);
    setTimeout(() => {
      researchSectionRef.current?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    }, 80);
  }

  const quoteSources = useMemo(() => countQuoteSources(enhancedHoldings), [enhancedHoldings]);
  const quoteState =
    quoteSources.live > 0 ? "Live quotes" : quoteSources.saved > 0 ? "Last saved prices" : "Prices unavailable";

  // Keyed, so React moves a workspace when the task changes and keeps its state.
  const workspaces = {
    portfolio: (
      <section key="portfolio" data-task="portfolio" aria-label="Portfolio" className={styles.workspace}>
        {/* data-empty lets the stylesheet print the add form first on a
            phone while there is nothing to summarize yet. */}
        <div className="invest-shell" data-testid="invest-shell" data-empty={isEmpty ? "" : undefined}>
          <div className="invest-main">
            <PortfolioSummary
              summary={summary}
              holdings={enhancedHoldings}
              snapshots={snapshots}
              isLoading={isLoading}
              quoteSources={quoteSources}
            />

            <HoldingsTable
              holdings={filteredHoldings}
              onUpdate={updateHolding}
              onRemove={removeHolding}
              onResearch={handleResearch}
              portfolioSymbols={portfolioSymbols}
              emptyMessage={
                isEmpty
                  ? "No positions yet. Add one with Add holding and it lands here, priced from the latest quote."
                  : undefined
              }
              toolbar={
                isEmpty ? null : (
                  <label className="invest-search">
                    <Search size={14} aria-hidden="true" />
                    <input
                      ref={filterInputRef}
                      type="search"
                      aria-label="Filter holdings"
                      placeholder="Filter holdings…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="invest-search-kbd" aria-hidden="true">⌘K</span>
                  </label>
                )
              }
            />
          </div>

          <aside className="invest-rail" aria-label="Portfolio side panel">
            <section ref={addHoldingRef} id="add-holding" aria-label="Add a holding" className="invest-rail-target">
              <AddStockForm onAdd={addHolding} />
              <p className="invest-rail-note">
                Holdings save only in this browser, with no login and no cloud sync.
              </p>
            </section>

            {!isEmpty ? (
              <section id="allocation" className="invest-rail-target">
                <AllocationChart holdings={enhancedHoldings} />
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    ),
    // Research deep dive. The symbol comes from Research on a holding row or
    // the picker in this pane's header.
    research: (
      <section
        key="research"
        data-task="research"
        ref={researchSectionRef}
        data-c97-surface="chocolate"
        className={`${styles.workspace} ${styles.researchPane}`}
        aria-label="Research deep dive"
      >
        <div className="invest-section-header">
          <h2 className="invest-section-title">Research</h2>
          <div className="invest-section-search">
            <StockSearch value={researchSymbol} onChange={handleResearch} />
          </div>
        </div>

        <ResearchSection
          symbol={researchSymbol}
          activeTab={researchTab}
          onTabChange={onResearchTabChange}
          portfolioSymbols={portfolioSymbols}
          position={researchPosition}
        />
      </section>
    ),
    // Retirement planner, projects whether the portfolio + savings last
    // through retirement, with allocation-derived Monte Carlo. Offers the
    // live portfolio value as a one-click starting balance.
    retirement: (
      <section key="retirement" data-task="retirement" className={styles.workspace} aria-label="Retirement">
        <RetirementPlanner portfolioValue={summary.totalValue > 0 ? summary.totalValue : undefined} />
      </section>
    ),
  };

  const sourceParts = [
    datasetSymbolCount > 0
      ? `Curated research snapshot of ${datasetSymbolCount} ${datasetSymbolCount === 1 ? "security" : "securities"}`
      : "Curated research snapshot",
    datasetFreshCount > 0 ? `${datasetFreshCount} refreshed` : null,
    datasetStaleCount > 0 ? `${datasetStaleCount} using earlier snapshots` : null,
    datasetFailedCount > 0 ? `${datasetFailedCount} unavailable` : null,
    // The delayed count alone carries the whole universe when nothing is
    // recent, so the line never reads "0 recent price histories".
    priceHealth && priceHealth.recentCount > 0 ? `${priceHealth.recentCount} recent price histories` : null,
    priceHealth && priceHealth.delayedCount > 0 ? `${priceHealth.delayedCount} delayed histories` : null,
    "market quotes via Finnhub",
  ].filter(Boolean);

  return (
    <div className="c97-shell c97-frame">
      <header id="hero" className={styles.titleBar}>
        <h1 className={styles.title}>Investments</h1>
        {/* The three jobs this page does. The choice decides which workspace
            prints first, straight under the quotes. */}
        <span id="invest-task-label" className="sr-only">Start with</span>
        <div role="group" aria-labelledby="invest-task-label" className={styles.taskSwitch}>
          {TASKS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={task === option.id}
              onClick={() => onTaskChange?.(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={styles.titleStatus}>
          <span>Research data as of {formatDatasetDate(datasetLastUpdated)}</span>
          {isEmpty ? null : (
            <DataFreshnessIndicator lastUpdated={lastUpdated} onRefresh={refetch} isRefreshing={isLoading} />
          )}
        </div>
        <button type="button" className={`invest-ghost ${styles.titleAdd}`} onClick={focusAddHolding}>
          <Plus size={14} aria-hidden="true" />
          {/* Its own name, since the form's toggle owns "Add holding" and the
              two share the desktop first screen. */}
          Add a holding
        </button>
      </header>

      <div className={styles.tapeStrip}>
        {isEmpty ? (
          <p className={styles.tapeEmpty}>
            <span className={styles.quoteTapeTag}>Quotes</span>
            Quotes for your holdings print here once you add one.
          </p>
        ) : (
          <InstrumentTape
            label={<span className={styles.quoteTapeTag}>{quoteState}</span>}
            items={tapeItems}
            ariaLabel="Holdings quote tape"
          />
        )}
      </div>

      {error ? (
        <p role="alert" className={styles.notice}>
          <span className={styles.noticeTag}>Quotes</span>
          {error}
        </p>
      ) : null}

      {persistenceStatus === "memory-only" ? (
        <p role="status" className={styles.notice}>
          <span className={styles.noticeTag}>Storage</span>
          Portfolio changes are available in this tab, but browser storage is
          unavailable, so they may not remain after you close it.
        </p>
      ) : null}

      <div className={styles.terminal}>
        {/* One navigation. A column beside the workspaces on a wide screen and
            a sticky scroll rail on a phone, from the same element, so there is
            never a second copy to drift or to hide from assistive tech. */}
        <nav className={styles.sectionRail} aria-label="Section navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={activeSection === item.href.slice(1) ? "true" : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
                {item.pill ? <span className={styles.sectionRailPill}>{item.pill}</span> : null}
              </a>
            );
          })}
        </nav>

        <div className={styles.workspaces}>{TASK_ORDER[task].map((id) => workspaces[id])}</div>
      </div>

      <footer className={styles.terminalFoot}>
        <p role="note">
          Research, valuations, and portfolio figures here are for general information
          and education only and are not investment, tax, or financial advice.
        </p>
        <p>{sourceParts.join(", ")}.</p>
      </footer>
    </div>
  );
}
