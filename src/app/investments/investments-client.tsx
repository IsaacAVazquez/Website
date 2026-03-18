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
      <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const TABS: { key: InvestmentsView; label: string }[] = [
  { key: "research",  label: "Research" },
  { key: "portfolio", label: "My Portfolio" },
];

interface InvestmentsClientProps {
  initialState: InvestmentsSearchState;
}

export function InvestmentsClient({ initialState }: InvestmentsClientProps) {
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
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-primary)_10%,transparent),transparent_28%),linear-gradient(180deg,var(--surface-primary)_0%,color-mix(in_srgb,var(--surface-secondary)_65%,var(--surface-primary))_100%)]"
      aria-label="Investment research workspace"
      data-testid="investments-shell"
    >
      <div className={shellClassName}>
        <motion.div
          className="mb-8 rounded-[30px] border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_7%,var(--surface-elevated))_0%,var(--surface-elevated)_55%,color-mix(in_srgb,var(--color-success)_7%,var(--surface-elevated))_100%)] p-6 shadow-[var(--shadow-sm)] sm:p-8"
          variants={variants.fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-end">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Investment Analytics Platform
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Investment Research Platform
              </h1>
              <p className="mt-3 max-w-[68ch] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.95rem]">
                Public fintech product for curated equity research, portfolio analytics,
                valuation review, and structured decision support built around reusable data panels.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Workspace
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Research + portfolio
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Coverage
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Curated ticker universe
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Focus
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Fintech UX clarity
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div
          className="mb-8 inline-flex flex-wrap gap-2 rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-2 shadow-[var(--shadow-sm)] backdrop-blur"
          role="tablist"
          aria-label="Investments tabs"
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={routeState.view === key}
              onClick={() => updateRouteState({ view: key })}
              className={`min-h-[46px] rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                routeState.view === key
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={routeState.view}
            role="tabpanel"
            aria-label={`${routeState.view} panel`}
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
