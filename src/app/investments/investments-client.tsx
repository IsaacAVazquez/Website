"use client";

import React, { startTransition, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InvestmentsDashboard } from "@/components/investments/InvestmentsDashboard";
import {
  buildInvestmentsHref,
  type InvestmentsSearchState,
  normalizeInvestmentsState,
} from "./investments-state";
import type { InvestmentsTask, ResearchTab } from "./investments-state";
import styles from "./investments.module.css";

interface InvestmentsClientProps {
  initialState: InvestmentsSearchState;
  datasetLastUpdated?: string | null;
  datasetSymbolCount?: number;
  datasetFreshCount?: number;
  datasetStaleCount?: number;
  datasetFailedCount?: number;
}

export function InvestmentsClient({
  initialState,
  datasetLastUpdated = null,
  datasetSymbolCount = 0,
  datasetFreshCount = 0,
  datasetStaleCount = 0,
  datasetFailedCount = 0,
}: InvestmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasManagedParams =
    searchParams.get("symbol") !== null ||
    searchParams.get("section") !== null ||
    searchParams.get("task") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizeInvestmentsState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

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

    // The canonical href is built from the query alone, so the fragment the
    // link arrived with is put back on it.
    startTransition(() => {
      router.replace(`${canonicalHref}${window.location.hash}`, { scroll: false });
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

  function handleTaskChange(task: InvestmentsTask) {
    updateRouteState({ task });
  }

  return (
    <div
      className={styles.terminalScope}
      data-testid="investments-shell"
    >
      <InvestmentsDashboard
        task={routeState.task}
        onTaskChange={handleTaskChange}
        researchSymbol={routeState.symbol}
        researchTab={routeState.section}
        onResearchSymbolChange={handleSymbolChange}
        onResearchTabChange={handleTabChange}
        datasetLastUpdated={datasetLastUpdated}
        datasetSymbolCount={datasetSymbolCount}
        datasetFreshCount={datasetFreshCount}
        datasetStaleCount={datasetStaleCount}
        datasetFailedCount={datasetFailedCount}
      />
    </div>
  );
}
