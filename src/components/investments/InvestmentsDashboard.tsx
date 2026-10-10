"use client";

import { Bookmark, ChartLine, ChartPie, CircleQuestionMark, Contrast, House, List, PiggyBank, ReceiptText, Search, Wallet } from "lucide-react";
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
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { formatCurrency, formatPercent } from "@/lib/investmentFormatting";
import { getClientInvestmentsIndex } from "@/lib/investmentsClientData";
import { buildInvestmentsPriceHealth } from "@/lib/investmentsPriceHealth";
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
// section link and a print of the page still reach all three. The order of the
// two that follow keeps the espresso sheets (portfolio and retirement) apart,
// with the chocolate research sheet or the paper note between them.
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
  if (!raw) return "—";
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
  const addHoldingRef = useRef<HTMLDivElement | null>(null);
  const researchSectionRef = useRef<HTMLDivElement | null>(null);
  const filterInputRef = useRef<HTMLInputElement | null>(null);

  // ⌘K / Ctrl+K focuses the holdings filter (matching the keyboard hint).
  // Leave the shortcut alone while the user is typing somewhere else, other
  // inputs keep their own behavior and the browser keeps its default.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
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
      // search overlay. Both listeners sat on window in the bubble phase, so
      // registration order decided the winner and the header won: pressing the
      // shortcut printed inside this filter opened site search on top of the
      // dashboard instead. A capture listener on window runs before every
      // bubble listener on window, so claiming the event here makes the badge
      // beside the input tell the truth.
      e.stopPropagation();
      filterInputRef.current?.focus();
      filterInputRef.current?.select();
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
  // first, in the order TASK_ORDER prints the sheets.
  const navItems: NavItem[] = useMemo(() => {
    const sections: Record<InvestmentsTask, NavItem[]> = {
      portfolio: [
        { id: "performance", label: "Performance", href: "#performance", icon: ChartLine },
        { id: "stats", label: "Portfolio stats", href: "#portfolio-stats", icon: Contrast },
        // The holdings ledger and the allocation chart only render once there is
        // at least one position, so on an empty portfolio these two jumped to
        // nothing. That is the exact state a first-time visitor arrives in.
        ...(enhancedHoldings.length > 0
          ? ([
              {
                id: "holdings",
                label: "Holdings",
                href: "#holdings-list",
                icon: List,
                pill: String(enhancedHoldings.length),
              },
              { id: "allocation", label: "Allocation", href: "#allocation", icon: ChartPie },
            ] as NavItem[])
          : []),
      ],
      research: [{ id: "research", label: "Research", href: "#research-section", icon: ReceiptText }],
      retirement: [{ id: "retirement", label: "Retirement", href: "#retirement", icon: PiggyBank }],
    };
    return [
      { id: "home", label: "Overview", href: "#hero", icon: House },
      ...TASK_ORDER[task].flatMap((id) => sections[id]),
    ];
  }, [enhancedHoldings.length, task]);

  // Marks the section under the upper middle of the viewport as current in
  // both navigations (aria-current). The hero card swaps its target element
  // once loading settles, so it re-observes then. Research is watched through
  // its outer band, because the inner #research-section is replaced when the
  // lazy workspace chunk resolves.
  const [activeSection, setActiveSection] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const researchBand = researchSectionRef.current;
    const targets = navItems
      .map((item) =>
        item.href === "#research-section" ? researchBand : document.getElementById(item.href.slice(1)),
      )
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setActiveSection(entry.target === researchBand ? "research-section" : entry.target.id);
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

  function handleSymbolPick(symbol: string) {
    onResearchSymbolChange(symbol);
    setTimeout(() => {
      researchSectionRef.current?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    }, 80);
  }

  // Keyed, so React moves a sheet when the task changes and keeps its state.
  const sheets = {
    portfolio: (
      <section
        key="portfolio"
        data-task="portfolio"
        data-c97-surface="espresso"
        className="c97-band c97-sheet"
        data-seam="torn"
      >
        {/* The terminal's sidebar, main column, and rail need more than the
            1080px page measure, so /investments is in WIDE_TOOL_ROUTES and
            every shell on the page, this one included, prints wide. */}
        <div className="c97-shell">
        {/* Section jumps for narrow viewports, where the sidebar is hidden.
            Same targets in the same order, so `navItems` stays the one source
            of truth and the two navigations cannot drift apart. Only one of the
            two is ever in the accessibility tree, since each is display:none at
            the other's widths. */}
        <nav className={styles.sectionRail} aria-label="Section navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={activeSection === item.href.slice(1) ? "true" : undefined}
              >
                <Icon size={15} aria-hidden="true" />
                {item.label}
                {item.pill ? (
                  <span className={styles.sectionRailPill}>{item.pill}</span>
                ) : null}
              </a>
            );
          })}
        </nav>

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
              {datasetSymbolCount} {datasetSymbolCount === 1 ? "security" : "securities"}
            </span>
          ) : null}
          {datasetFreshCount > 0 ? (
            <>
              <span className="invest-dataset-chip-divider" aria-hidden="true">·</span>
              <span>{datasetFreshCount} refreshed</span>
            </>
          ) : null}
          {datasetStaleCount > 0 ? (
            <>
              <span className="invest-dataset-chip-divider" aria-hidden="true">·</span>
              <span className="invest-dataset-chip-warn">
                {datasetStaleCount} using earlier snapshots
              </span>
            </>
          ) : null}
          {datasetFailedCount > 0 ? (
            <>
              <span className="invest-dataset-chip-divider" aria-hidden="true">·</span>
              <span className="invest-dataset-chip-warn">
                {datasetFailedCount} unavailable
              </span>
            </>
          ) : null}
          {/* The delayed count alone carries the whole universe when nothing
              is recent, so the chip never reads "0 recent price histories". */}
          {priceHealth && priceHealth.recentCount > 0 ? (
            <>
              <span className="invest-dataset-chip-divider" aria-hidden="true">·</span>
              <span>{priceHealth.recentCount} recent price histories</span>
            </>
          ) : null}
          {priceHealth && priceHealth.delayedCount > 0 ? (
            <>
              <span className="invest-dataset-chip-divider" aria-hidden="true">·</span>
              <span className="invest-dataset-chip-warn">
                {priceHealth.delayedCount} delayed histories
              </span>
            </>
          ) : null}
          <span className="invest-dataset-chip-spacer" />
          <span className="invest-dataset-chip-meta">Market quotes via Finnhub</span>
        </div>

        {error ? (
          <div
            role="alert"
            className="c97-panel text-sm"
            style={{ marginTop: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}
          >
            {/* A paper plate: on light espresso the chip's pale field and the pale warning ink measure about 1.1:1. */}
            <span data-c97-surface="paper" style={{ display: "contents" }}>
              <span className="c97-chip c97-chip-warning" style={{ marginInlineEnd: "var(--c97-sp-2)" }}>
                Quotes
              </span>
            </span>
            {error}
          </div>
        ) : null}

        {persistenceStatus === "memory-only" ? (
          <div
            role="status"
            className="c97-panel text-sm"
            style={{ marginTop: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}
          >
            {/* A paper plate: on light espresso the chip's pale field and the pale warning ink measure about 1.1:1. */}
            <span data-c97-surface="paper" style={{ display: "contents" }}>
              <span className="c97-chip c97-chip-warning" style={{ marginInlineEnd: "var(--c97-sp-2)" }}>
                Storage
              </span>
            </span>
            Portfolio changes are available in this tab, but browser storage is
            unavailable, so they may not remain after you close it.
          </div>
        ) : null}

        {/* data-empty lets the stylesheet print the add form first on a
            phone while there is nothing to summarize yet. */}
        <div className="invest-shell" data-testid="invest-shell" data-empty={isEmpty ? "" : undefined}>
          <aside className="invest-sidebar" aria-label="Investments navigation">
            <nav className="flex flex-col" style={{ gap: "var(--c97-sp-0)" }} aria-label="Section navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className="invest-nav-link"
                    aria-current={activeSection === item.href.slice(1) ? "true" : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                    {item.pill ? <span className="invest-nav-pill">{item.pill}</span> : null}
                  </a>
                );
              })}
            </nav>

            <div className="invest-sidebar-footer">
              <Bookmark size={16} aria-hidden="true" />
              <span>Local browser storage</span>
            </div>
          </aside>

          <div className="invest-main">
            <div className="invest-topbar">
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

              <DataFreshnessIndicator
                lastUpdated={lastUpdated}
                onRefresh={refetch}
                isRefreshing={isLoading}
              />
            </div>

            <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}>
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
                  portfolioSymbols={portfolioSymbols}
                />
              ) : (
                <div
                  className="c97-panel"
                  style={{ padding: "var(--c97-sp-6) var(--c97-sp-4)", textAlign: "center" }}
                >
                  <h2
                    className="text-sm font-semibold"
                    style={{ margin: "0 0 var(--c97-sp-2)", color: "var(--c97-ink)" }}
                  >
                    No positions yet
                  </h2>
                  <p
                    className="text-sm"
                    style={{ margin: "0 auto", maxInlineSize: "20rem", color: "var(--c97-label)" }}
                  >
                    Add your first stock with the Add a holding form. Holdings are saved in your browser and persist across visits.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="invest-rail" aria-label="Portfolio side panel">
            <section
              ref={addHoldingRef}
              id="add-holding"
              aria-label="Add a holding"
              className="invest-rail-target"
            >
              <p className="invest-rail-section-label">
                <Wallet size={12} aria-hidden="true" className="inline align-middle" style={{ marginRight: "var(--c97-sp-0)" }} />
                Add a holding
              </p>
              <AddStockForm onAdd={addHolding} />
            </section>

            {!isEmpty ? (
              <section id="allocation" className="invest-rail-target">
                <p className="invest-rail-section-label">Allocation</p>
                <AllocationChart holdings={enhancedHoldings} />
              </section>
            ) : null}

            {enhancedHoldings.some((holding) => holding.priceSource === "live") ? (
              <section className="invest-rail-movers">
                <p className="invest-rail-section-label">Latest movers</p>
                <ul className="invest-rail-mover-list">
                  {[...enhancedHoldings]
                    .filter((holding) => holding.priceSource === "live")
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

            <p className="mt-auto flex items-center text-2xs text-[var(--c97-ink-2)]" style={{ gap: "var(--c97-sp-1)" }}>
              <CircleQuestionMark size={14} aria-hidden="true" />
              Holdings live only in your browser. No logins, no cloud sync.
            </p>
          </aside>
        </div>
        </div>
      </section>
    ),
    // Research deep-dive, its own sheet below the terminal body. Symbol
    // comes from clicking "Research" on a holding row or the picker below.
    research: (
      <section
        key="research"
        data-task="research"
        ref={researchSectionRef}
        data-c97-surface="chocolate"
        className="c97-band c97-sheet"
        data-seam="torn"
        aria-label="Research deep dive"
      >
        <div className="c97-shell">
          <div className="invest-section-header">
            <div>
              <p className="invest-section-kicker">Deep dive</p>
              <h2 className="c97-poster-sm" style={{ marginTop: "var(--c97-sp-1)" }}>Research</h2>
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
            position={researchPosition}
          />
        </div>
      </section>
    ),
    note: (
      <div key="note" data-c97-surface="paper" className="c97-band c97-band-tight c97-sheet" data-seam="torn">
        <div className="c97-shell">
          <p
            role="note"
            className="c97-prose flex items-start text-2xs leading-6"
            style={{ gap: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
          >
            <CircleQuestionMark size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Research, valuations, and portfolio figures here are for general information
            and education only and are not investment, tax, or financial advice.
          </p>
        </div>
      </div>
    ),
    // Retirement planner, projects whether the portfolio + savings last
    // through retirement, with allocation-derived Monte Carlo. Offers the
    // live portfolio value as a one-click starting balance.
    retirement: (
      <section
        key="retirement"
        data-task="retirement"
        data-c97-surface="espresso"
        className="c97-band c97-sheet"
        data-seam="torn"
      >
        <div className="c97-shell">
          <RetirementPlanner portfolioValue={summary.totalValue > 0 ? summary.totalValue : undefined} />
        </div>
      </section>
    ),
  };
  const [first, second, third] = TASK_ORDER[task];

  return (
    <>
      <div id="hero">
        <Catalog97ProjectHero
          ink="blue"
          title="Investments"
          standfirst="I built this to track a portfolio, look into a curated set of companies, and run a retirement plan off the same allocation math. Holdings and plan inputs save only to your browser."
          meta={`Research data as of ${formatDatasetDate(datasetLastUpdated)} · Market quotes via Finnhub`}
        >
          <div
            data-c97-surface="espresso"
            className="c97-offset flex flex-col gap-[var(--c97-sp-2)] p-[var(--c97-sp-2)] sm:p-[var(--c97-sp-3)]"
          >
            {/* The three jobs this page does. The choice decides which
                workspace prints first, straight under this sheet. */}
            <div>
              <p id="invest-task-label" className="c97-kicker">
                Start with
              </p>
              <div role="group" aria-labelledby="invest-task-label" className="c97-segmented">
                {TASKS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={task === option.id}
                    onClick={() => onTaskChange?.(option.id)}
                    className="text-sm font-semibold"
                    style={{ minHeight: 44 }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {!isEmpty ? (
              <InstrumentTape
                className={styles.quoteTape}
                label={
                  <span className={styles.quoteTapeTag}>
                    {enhancedHoldings.some((h) => h.priceSource === "live")
                      ? "Live quotes"
                      : enhancedHoldings.some((h) => h.priceSource === "saved")
                        ? "Last saved prices"
                        : "Prices unavailable"}
                  </span>
                }
                items={tapeItems}
                ariaLabel="Holdings quote tape"
              />
            ) : (
              <p className="c97-mono" style={{ margin: 0, color: "var(--c97-ink-2)" }}>
                Add a holding below to see live quotes here.
              </p>
            )}
          </div>
        </Catalog97ProjectHero>
      </div>

      {[sheets[first], sheets[second], sheets.note, sheets[third]]}
    </>
  );
}
