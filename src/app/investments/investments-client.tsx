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

  // Keep URL in sync with normalized route state. We compare the canonical
  // href against the current querystring so we only navigate when something
  // genuinely needs normalizing. Comparing raw params field-by-field is a trap:
  // an absent param reads back as `null` while the normalized state uses
  // empty-string/default values (e.g. `symbol: ""`, `section: "overview"`), so
  // `null === ""` is never true and the effect would `router.replace` on every
  // render — each replace yields a fresh `searchParams` reference, re-firing the
  // effect and spinning `startTransition` forever.
  useEffect(() => {
    const desiredHref = buildInvestmentsHref(routeState, searchParams);
    const currentHref = `/investments?${searchParams.toString()}`;
    if (desiredHref === currentHref) {
      return;
    }

    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
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
