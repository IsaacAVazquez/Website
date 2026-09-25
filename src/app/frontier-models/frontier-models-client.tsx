"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import {
  filterFrontierModels,
  formatPriceUsd,
  formatTokenCount,
  PRICE_TIER_LABELS,
} from "@/lib/frontierModels";
import { frontierReadouts } from "./readouts";
import { FrontierModelsTable } from "./components/FrontierModelsTable";
import { FrontierCostContextChart } from "./components/FrontierCostContextChart";
import {
  buildFrontierModelsHref,
  FRONTIER_MODALITY_LABELS,
  FRONTIER_MODELS_ROUTE,
  normalizeFrontierModelsState,
  resolveFrontierModelsState,
} from "./frontier-models-state";
import type {
  FrontierModalityFilter,
  FrontierModelsRouteState,
  FrontierModelsSnapshot,
  FrontierPriceTier,
  FrontierProviderFilter,
  FrontierTierFilter,
} from "@/types/frontierModels";

interface FrontierModelsClientProps {
  initialState: FrontierModelsRouteState;
  snapshot: FrontierModelsSnapshot;
}

const MODALITY_FILTERS: FrontierModalityFilter[] = [
  "all",
  "text",
  "vision",
  "audio",
];

const TIER_FILTERS: FrontierTierFilter[] = [
  "all",
  "budget",
  "standard",
  "premium",
];

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function FrontierModelsClient({
  initialState,
  snapshot,
}: FrontierModelsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("provider") !== null ||
    searchParams.get("modality") !== null ||
    searchParams.get("tier") !== null ||
    searchParams.get("model") !== null;

  const routeState = hasManagedParams
    ? normalizeFrontierModelsState(searchParams)
    : initialState;
  const resolvedState = resolveFrontierModelsState(routeState, snapshot);

  const currentQuery = searchParams.toString();
  const currentHref = `${FRONTIER_MODELS_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
  const desiredHref = buildFrontierModelsHref(resolvedState, searchParams);

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: FrontierModelsRouteState) {
    const resolvedNext = resolveFrontierModelsState(nextState, snapshot);
    const href = buildFrontierModelsHref(resolvedNext, searchParams);
    if (href === currentHref) {
      return;
    }
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  const filteredModels = useMemo(
    () =>
      filterFrontierModels(snapshot.models, {
        provider: resolvedState.provider,
        modality: resolvedState.modality,
        priceTier: resolvedState.priceTier,
      }),
    [
      snapshot.models,
      resolvedState.provider,
      resolvedState.modality,
      resolvedState.priceTier,
    ]
  );

  const readouts = useMemo(() => frontierReadouts(snapshot.models), [snapshot.models]);

  const updatedAt = formatGeneratedAt(snapshot.generatedAt);
  const [reviewIsOverdue, setReviewIsOverdue] = useState(!snapshot.verified);
  useEffect(() => {
    const reviewAgeMs =
      Date.now() - Date.parse(snapshot.asOf ?? snapshot.generatedAt);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Freshness depends on the browser clock and must not create unstable SSR markup
    setReviewIsOverdue(
      !snapshot.verified ||
        !Number.isFinite(reviewAgeMs) ||
        reviewAgeMs > 45 * 24 * 60 * 60 * 1000
    );
  }, [snapshot.asOf, snapshot.generatedAt, snapshot.verified]);

  function handleSelectModel(id: string | null) {
    navigate({ ...resolvedState, selectedModelId: id });
  }

  const lead = PROJECT_PRESS[FRONTIER_MODELS_ROUTE].lead;
  const standfirst =
    "A curated table of leading large language models with context windows, pricing, and modality coverage. Side-by-side facts, no marketing.";
  const liveFactsNote = snapshot.liveFacts
    ? ` · facts auto-checked ${snapshot.liveFacts.checkedAt.slice(0, 10)} against ${snapshot.liveFacts.sources.join(" + ")}`
    : "";
  const dateMeta = `Curated by Isaac · data as of ${snapshot.asOf ?? snapshot.generatedAt.slice(0, 10)} · updated ${updatedAt}${!snapshot.verified ? " · independent review pending" : ""}${liveFactsNote}`;

  return (
    <div>
      <Catalog97ProjectHero
        ink={lead}
        title="Frontier Model Tracker"
        standfirst={standfirst}
        meta={dateMeta}
        readouts={[
          {
            label: "Models tracked",
            value: `${readouts.count}`,
            detail: `${snapshot.providers.length} providers`,
          },
          {
            label: "Cheapest input price",
            value: readouts.cheapest ? formatPriceUsd(readouts.cheapest.inputPricePerMTokens) : "—",
            detail: readouts.cheapest
              ? `${readouts.cheapest.providerLabel} ${readouts.cheapest.name}`
              : "No priced models",
          },
          {
            label: "Largest context window",
            value: readouts.largestContext ? formatTokenCount(readouts.largestContext.contextWindow) : "—",
            detail: readouts.largestContext
              ? `${readouts.largestContext.providerLabel} ${readouts.largestContext.name}`
              : "No models tracked",
          },
        ]}
      >
        {/* Provider colours are data and several vanish on pink, so the chart prints on a paper plate. */}
        <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
          <FrontierCostContextChart
            models={filteredModels}
            selectedModelId={resolvedState.selectedModelId}
            onSelectModel={handleSelectModel}
          />
        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          {reviewIsOverdue ? (
            <p
              className="c97-prose"
              role="status"
              style={{ marginBottom: "var(--c97-sp-5)", color: "var(--c97-warning)" }}
            >
              This dataset is outside its 45-day review window or still unverified. I would not
              use its prices or model availability for a purchase decision until the source list
              is reviewed.
            </p>
          ) : null}

          <h2 className="c97-poster-sm">The spec sheet</h2>

          <div style={{ marginTop: "var(--c97-sp-4)", display: "grid", gap: "var(--c97-sp-3)" }}>
            <FilterGroup
              label="Provider"
              options={[
                { id: "all", label: "All providers" },
                ...snapshot.providers.map((provider) => ({
                  id: provider.id,
                  label: `${provider.label} (${provider.count})`,
                })),
              ]}
              value={resolvedState.provider}
              onChange={(value) =>
                navigate({
                  ...resolvedState,
                  provider: value as FrontierProviderFilter,
                  selectedModelId: null,
                })
              }
            />
            <FilterGroup
              label="Modality"
              options={MODALITY_FILTERS.map((modality) => ({
                id: modality,
                label:
                  modality === "all"
                    ? "Any modality"
                    : FRONTIER_MODALITY_LABELS[modality],
              }))}
              value={resolvedState.modality}
              onChange={(value) =>
                navigate({
                  ...resolvedState,
                  modality: value as FrontierModalityFilter,
                  selectedModelId: null,
                })
              }
            />
            <FilterGroup
              label="Price tier"
              options={TIER_FILTERS.map((tier) => ({
                id: tier,
                label:
                  tier === "all"
                    ? "Any tier"
                    : PRICE_TIER_LABELS[tier as FrontierPriceTier],
              }))}
              value={resolvedState.priceTier}
              onChange={(value) =>
                navigate({
                  ...resolvedState,
                  priceTier: value as FrontierTierFilter,
                  selectedModelId: null,
                })
              }
            />
          </div>

          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-4)" }}>
            {filteredModels.length} of {snapshot.models.length} models shown
          </p>

          {filteredModels.length === 0 ? (
            <div style={{ marginTop: "var(--c97-sp-4)" }}>
              <EmptyPanel
                title="No models match those filters"
                description="Try widening the provider, modality, or price-tier filters to see more options."
              />
            </div>
          ) : (
            <div style={{ marginTop: "var(--c97-sp-4)" }}>
              <FrontierModelsTable
                models={filteredModels}
                selectedModelId={resolvedState.selectedModelId}
                onSelectModel={handleSelectModel}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface FilterGroupProps {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

function FilterGroup({ label, options, value, onChange }: FilterGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="c97-kicker" style={{ minWidth: "88px" }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.id)}
              className="min-h-[44px] border px-4 text-sm font-medium"
              style={
                isActive
                  ? { borderColor: "var(--c97-ink)", background: "var(--c97-ink)", color: "var(--c97-surface)" }
                  : { borderColor: "var(--c97-rule)", background: "var(--c97-field)", color: "var(--c97-ink-2)" }
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
