"use client";

import React, { startTransition, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InvestmentsDashboard } from "@/components/investments/InvestmentsDashboard";
import {
  buildInvestmentsHref,
  type InvestmentsSearchState,
  normalizeInvestmentsState,
} from "./investments-state";
import type { ResearchTab } from "./investments-state";

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
  const shellClassName =
    "mx-auto w-full max-w-[1680px] px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12";

  const hasManagedParams =
    searchParams.get("symbol") !== null ||
    searchParams.get("section") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizeInvestmentsState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  // Clear researched symbol when user navigates away from this page so the
  // next visit doesn't auto-load a stale ticker.
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

  // Keep URL in sync with normalized route state.
  useEffect(() => {
    if (
      searchParams.get("symbol") === routeState.symbol &&
      searchParams.get("section") === routeState.section
    ) {
      return;
    }

    startTransition(() => {
      router.replace(buildInvestmentsHref(routeState, searchParams), { scroll: false });
    });
  }, [routeState, router, searchParams]);

  function updateRouteState(nextState: Partial<InvestmentsSearchState>) {
    const href = buildInvestmentsHref(
      {
        ...routeState,
        ...nextState,
      },
      searchParams
    );

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleSymbolChange(symbol: string) {
    updateRouteState({ symbol });
  }

  function handleTabChange(section: ResearchTab) {
    updateRouteState({ section });
  }

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--home-haze)_10%,transparent),transparent_28%),linear-gradient(180deg,var(--home-paper)_0%,color-mix(in_srgb,var(--home-paper-alt)_65%,var(--home-paper))_100%)]"
      aria-label="Investments dashboard"
      data-testid="investments-shell"
    >
      <div className={shellClassName}>
        <InvestmentsDashboard
          researchSymbol={routeState.symbol}
          researchTab={routeState.section}
          onResearchSymbolChange={handleSymbolChange}
          onResearchTabChange={handleTabChange}
          datasetLastUpdated={datasetLastUpdated}
          datasetSymbolCount={datasetSymbolCount}
          datasetFailedCount={datasetFailedCount}
        />
      </div>
    </section>
  );
}
