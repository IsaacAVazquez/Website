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

  // Keep URL in sync with normalized route state. A clean visit with no
  // managed params keeps its clean URL; once managed (or legacy `view`)
  // params exist, rewrite only when the URL differs from the canonical href,
  // so the replace settles instead of looping on absent-vs-empty params.
  useEffect(() => {
    if (!hasManagedParams && searchParams.get("view") === null) {
      return;
    }

    const query = searchParams.toString();
    const currentHref = query ? `/investments?${query}` : "/investments";
    const canonicalHref = buildInvestmentsHref(routeState, searchParams);

    if (canonicalHref === currentHref) {
      return;
    }

    startTransition(() => {
      router.replace(canonicalHref, { scroll: false });
    });
  }, [hasManagedParams, routeState, router, searchParams]);

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
      className="home-page min-h-screen"
      aria-label="Investments dashboard"
      data-testid="investments-shell"
    >
      <div className="home-shell home-shell-investments home-section">
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
