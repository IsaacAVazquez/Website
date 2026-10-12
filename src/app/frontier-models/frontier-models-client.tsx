"use client";

import { useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useClientNow } from "@/hooks/useClientNow";
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
import { useRouteSync } from "@/hooks/useRouteSync";
import { formatLongUtcDate } from "@/lib/date-formatters";
import "./frontier-models.css";

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

const SPEC_SHEET_ID = "frontier-spec-sheet";
const REVIEW_WINDOW_MS = 45 * 24 * 60 * 60 * 1000;

const TIER_FILTERS: FrontierTierFilter[] = [
  "all",
  "budget",
  "standard",
  "premium",
];

export function FrontierModelsClient({
  initialState,
  snapshot,
}: FrontierModelsClientProps) {
  const searchParams = useSearchParams();

  const hasManagedParams =
    searchParams.get("provider") !== null ||
    searchParams.get("modality") !== null ||
    searchParams.get("tier") !== null ||
    searchParams.get("model") !== null;

  const routeState = hasManagedParams
    ? normalizeFrontierModelsState(searchParams)
    : initialState;
  const resolvedState = resolveFrontierModelsState(routeState, snapshot);

  const desiredHref = buildFrontierModelsHref(resolvedState, searchParams);

  const pushHref = useRouteSync(FRONTIER_MODELS_ROUTE, desiredHref);

  function navigate(nextState: FrontierModelsRouteState) {
    const resolvedNext = resolveFrontierModelsState(nextState, snapshot);
    const href = buildFrontierModelsHref(resolvedNext, searchParams);
    pushHref(href);
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

  const asOf = snapshot.asOf ?? snapshot.generatedAt.slice(0, 10);
  const updatedAt = formatLongUtcDate(snapshot.generatedAt);
  // `now` is null on the server and during hydration, so the review window
  // reads as still open until the browser clock can say otherwise.
  const now = useClientNow();
  const reviewIsOverdue =
    !snapshot.verified || (now !== null && !(now - Date.parse(asOf) <= REVIEW_WINDOW_MS));

  function handleSelectModel(id: string | null) {
    navigate({ ...resolvedState, selectedModelId: id });
  }

  // Provider is the filter most visits use, so it stays in view. Modality and
  // price tier sit one action away, and open on their own whenever either is
  // set, so an active filter is never hidden.
  const hasExtraFilter = resolvedState.modality !== "all" || resolvedState.priceTier !== "all";
  const [extraFiltersOpen, setExtraFiltersOpen] = useState(hasExtraFilter);

  const liveFactsNote = snapshot.liveFacts
    ? ` · facts auto-checked ${snapshot.liveFacts.checkedAt.slice(0, 10)} against ${snapshot.liveFacts.sources.join(" + ")} · ${snapshot.liveFacts.updated} changed by the check, ${snapshot.liveFacts.confirmed} matched, ${snapshot.liveFacts.curatedOnly} not found in either catalog`
    : "";
  const asOfLine = `Snapshot built ${updatedAt}${liveFactsNote}`;

  return (
    <div className="fm-root">
      <div className="c97-shell c97-frame fm-page">
        <header className="fm-head">
          <h1 className="fm-title">Frontier Model Tracker</h1>
          <p className="fm-lede">
            A curated table of leading large language models with context windows, pricing, and
            modality coverage, set side by side without the marketing.
            {readouts.cheapest && readouts.largestContext
              ? ` The cheapest input price is ${formatPriceUsd(readouts.cheapest.inputPricePerMTokens)} per million tokens (${readouts.cheapest.providerLabel} ${readouts.cheapest.name}), and the largest context window is ${formatTokenCount(readouts.largestContext.contextWindow)} tokens (${readouts.largestContext.providerLabel} ${readouts.largestContext.name}).`
              : ""}
          </p>
          <p className="fm-asof">{asOfLine}</p>
          <p className="fm-disclosure">
            {/* The disclosure keeps the original meta line's words, as one sentence. */}
            {`Curated by hand, facts as of ${formatLongUtcDate(asOf)}${snapshot.verified ? "" : ", independent review pending"}.`}{" "}
            <a href={`#${SPEC_SHEET_ID}`} className="fm-jump">
              Jump to the spec sheet
            </a>
          </p>
        </header>

        <section className="fm-chart" aria-label="Price against context window">
          <FrontierCostContextChart
            models={filteredModels}
            selectedModelId={resolvedState.selectedModelId}
            onSelectModel={handleSelectModel}
          />
        </section>

        <section id={SPEC_SHEET_ID} className="fm-sheet" aria-labelledby="fm-sheet-heading">
          <div className="fm-toolbar">
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
            <details
              className="fm-more"
              open={extraFiltersOpen || hasExtraFilter}
              onToggle={(event) => setExtraFiltersOpen(event.currentTarget.open)}
            >
              <summary>
                <span data-when="closed">More filters</span>
                <span data-when="open">Fewer filters</span>
              </summary>
              <div className="fm-more-body">
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
            </details>
          </div>

          <div className="fm-sheet-head">
            <h2 id="fm-sheet-heading" className="fm-h2">
              The spec sheet
            </h2>
            <p className="fm-count">
              {filteredModels.length} of {snapshot.models.length} models shown
            </p>
          </div>

          {reviewIsOverdue ? (
            <p className="fm-warn" role="status">
              This dataset is outside its 45-day review window or still unverified. I would not
              use its prices or model availability for a purchase decision until the source list
              is reviewed.
            </p>
          ) : null}

          {filteredModels.length === 0 ? (
            <div className="fm-empty">
              <p className="fm-empty-title">No models match those filters</p>
              <p>Try widening the provider, modality, or price-tier filters to see more options.</p>
            </div>
          ) : (
            <FrontierModelsTable
              models={filteredModels}
              selectedModelId={resolvedState.selectedModelId}
              onSelectModel={handleSelectModel}
            />
          )}
        </section>
      </div>
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
  const labelId = useId();
  return (
    <div className="fm-group">
      <span id={labelId} className="fm-label">
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="fm-switch">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
