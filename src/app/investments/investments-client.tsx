"use client";

import React, { lazy, Suspense, startTransition, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useInvestments } from "@/hooks/useInvestments";
import {
  containerVariants,
  itemVariants,
  fadeInVariants,
  getReducedMotionVariants,
} from "@/components/investments/animations";
import { InvestmentsFreshnessBanner } from "@/components/investments/InvestmentsFreshnessBanner";
import {
  buildInvestmentsHref,
  type InvestmentsSearchState,
  normalizeInvestmentsState,
  type InvestmentsView,
} from "./investments-state";

const PortfolioTracker = lazy(() =>
  import("@/components/investments/PortfolioTracker").then((m) => ({ default: m.PortfolioTracker }))
);
const StockResearch = lazy(() =>
  import("@/components/investments/StockResearch").then((m) => ({ default: m.StockResearch }))
);

function TabFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--home-haze)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const TABS: { key: InvestmentsView; label: string }[] = [
  { key: "research",  label: "Research" },
  { key: "portfolio", label: "My Portfolio" },
];

interface InvestmentsClientProps {
  initialState: InvestmentsSearchState;
  datasetLastUpdated?: string | null;
  datasetSymbolCount?: number;
  datasetFailedCount?: number;
}

export function InvestmentsClient({
  initialState,
  datasetLastUpdated = null,
  datasetSymbolCount = 0,
  datasetFailedCount = 0,
}: InvestmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { holdings } = useInvestments();
  const portfolioSymbols = holdings.map((h) => h.symbol);
  const shouldReduceMotion = useReducedMotion();
  const shellClassName =
    "mx-auto w-full max-w-[1680px] px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12";

  const variants = shouldReduceMotion ? getReducedMotionVariants() : { containerVariants, itemVariants, fadeInVariants };
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("symbol") !== null ||
    searchParams.get("section") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizeInvestmentsState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  // Clear researched symbol when user navigates away from this page
  useEffect(() => {
    return () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has("symbol")) {
        params.delete("symbol");
        const next = "/investments" + (params.toString() ? "?" + params.toString() : "");
        window.history.replaceState(null, "", next);
      }
    };
  }, []);

  useEffect(() => {
    if (
      searchParams.get("view") === routeState.view &&
      searchParams.get("symbol") === routeState.symbol &&
      searchParams.get("section") === routeState.section
    ) {
      return;
    }

    startTransition(() => {
      router.replace(buildInvestmentsHref(routeState, searchParams), { scroll: false });
    });
  }, [routeState, router, searchParams]);

  function updateRouteState(
    nextState: Partial<InvestmentsSearchState>,
    options?: { replace?: boolean }
  ) {
    const href = buildInvestmentsHref(
      {
        ...routeState,
        ...nextState,
      },
      searchParams
    );

    startTransition(() => {
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    });
  }

  function handleResearch(symbol: string) {
    updateRouteState({
      view: "research",
      symbol,
    });
  }

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--home-haze)_10%,transparent),transparent_28%),linear-gradient(180deg,var(--home-paper)_0%,color-mix(in_srgb,var(--home-paper-alt)_65%,var(--home-paper))_100%)]"
      aria-label="Investment research workspace"
      data-testid="investments-shell"
    >
      <div className={shellClassName}>
        <motion.div
          className="mb-6"
          variants={variants.fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="home-kicker">Investment Research</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--home-ink)] sm:text-4xl">
            Investment Research Platform
          </h1>
          <p className="mt-2 max-w-[64ch] text-sm leading-6 text-[var(--home-ink-muted)]">
            I built this to stress-test investment theses in one place. Company snapshots, valuation history, and a portfolio tracker that lives in your browser with no logins or cloud sync.
          </p>
        </motion.div>

        <InvestmentsFreshnessBanner
          lastUpdated={datasetLastUpdated}
          symbolCount={datasetSymbolCount}
          failedCount={datasetFailedCount}
        />

        <div
          className="mb-8 inline-flex flex-wrap gap-2 rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))]/90 p-2 shadow-[var(--shadow-sm)] backdrop-blur"
          role="tablist"
          aria-label="Investments tabs"
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              id={`investments-tab-${key}`}
              role="tab"
              aria-selected={routeState.view === key}
              aria-controls={`investments-panel-${key}`}
              tabIndex={routeState.view === key ? 0 : -1}
              onClick={() => updateRouteState({ view: key })}
              className={`min-h-[46px] rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                routeState.view === key
                  ? "bg-[var(--home-haze)] text-white shadow-[var(--shadow-sm)]"
                  : "text-[var(--home-ink-muted)] hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={routeState.view}
            id={`investments-panel-${routeState.view}`}
            role="tabpanel"
            aria-labelledby={`investments-tab-${routeState.view}`}
            className="w-full"
            variants={variants.fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Suspense fallback={<TabFallback />}>
              {routeState.view === "portfolio" && <PortfolioTracker onResearch={handleResearch} />}
              {routeState.view === "research" && (
                <StockResearch
                  symbol={routeState.symbol}
                  activeTab={routeState.section}
                  onSymbolChange={(symbol) =>
                    updateRouteState({
                      view: "research",
                      symbol,
                    })
                  }
                  onTabChange={(section) =>
                    updateRouteState({
                      view: "research",
                      section,
                    })
                  }
                  portfolioSymbols={portfolioSymbols}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
