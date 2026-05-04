"use client";

import { startTransition, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import { ChartBar, FileText } from "@/components/ui/ServerIcons";
import {
  filterFrontierModels,
  formatTokenCount,
  medianContextWindow,
  PRICE_TIER_LABELS,
} from "@/lib/frontierModels";
import { FrontierModelsTable } from "./components/FrontierModelsTable";
import { FrontierCostContextChart } from "./components/FrontierCostContextChart";
import {
  buildFrontierModelsHref,
  FRONTIER_MODALITY_LABELS,
  FRONTIER_MODELS_VIEW_LABELS,
  FRONTIER_MODELS_VIEW_OPTIONS,
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
  FrontierView,
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
  const currentHref = `/frontier-models${currentQuery ? `?${currentQuery}` : ""}`;
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

  const median = useMemo(
    () => medianContextWindow(snapshot.models),
    [snapshot.models]
  );

  const visionCount = useMemo(
    () => snapshot.models.filter((m) => m.modalities.includes("vision")).length,
    [snapshot.models]
  );
  const audioCount = useMemo(
    () => snapshot.models.filter((m) => m.modalities.includes("audio")).length,
    [snapshot.models]
  );
  const openWeightCount = useMemo(
    () =>
      snapshot.models.filter(
        (m) => m.provider === "meta" || m.provider === "deepseek" || m.provider === "mistral"
      ).length,
    [snapshot.models]
  );
  const budgetTier = snapshot.priceTiers.find((t) => t.id === "budget")?.count ?? 0;
  const premiumTier = snapshot.priceTiers.find((t) => t.id === "premium")?.count ?? 0;

  const updatedAt = formatGeneratedAt(snapshot.generatedAt);

  const frontierCells: HomeStatsCell[] = [
    {
      label: "Models tracked",
      value: <span className="tabular-nums">{snapshot.models.length}</span>,
      sub: "Across listed providers",
    },
    {
      label: "Providers covered",
      value: <span className="tabular-nums">{snapshot.providers.length}</span>,
      sub: "Anthropic, OpenAI, Google, etc.",
    },
    {
      label: "Median context window",
      value: <span className="tabular-nums">{formatTokenCount(median)}</span>,
      sub: "Tokens, half the field at or above",
    },
    {
      label: "Budget tier",
      value: <span className="tabular-nums">{budgetTier}</span>,
      sub: "Sub-$1/M input pricing",
    },
    {
      label: "Premium tier",
      value: <span className="tabular-nums">{premiumTier}</span>,
      sub: "Top of the price ladder",
    },
    {
      label: "Vision-capable",
      value: <span className="tabular-nums">{visionCount}</span>,
      sub: "Models that accept images",
    },
    {
      label: "Audio-capable",
      value: <span className="tabular-nums">{audioCount}</span>,
      sub: "Models that handle audio",
    },
    {
      label: "Open-weight models",
      value: <span className="tabular-nums">{openWeightCount}</span>,
      sub: "Meta, DeepSeek, Mistral",
    },
  ];

  function handleSelectModel(id: string | null) {
    navigate({ ...resolvedState, selectedModelId: id });
  }

  return (
    <div className="home-shell home-section space-y-8">
      <header className="space-y-3">
        <p className="home-kicker">Modern tech</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--home-ink)] sm:text-4xl">
          Frontier Model Tracker
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[var(--home-ink-muted)]">
          A curated table of leading large language models with context windows,
          pricing, and modality coverage. Side-by-side facts, no marketing.
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
          Curated by Isaac · Refreshed manually · Updated {updatedAt}
        </p>
      </header>

      <HomeStatsPanel
        id="frontier-models-stats"
        title="Frontier models at a glance"
        meta={`Updated ${updatedAt}`}
        cells={frontierCells}
        pills={[
          { label: "Table", href: "/frontier-models", icon: FileText },
          { label: "Chart", href: "/frontier-models?view=chart", icon: ChartBar },
        ]}
      />

      <section className="space-y-3">
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
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Frontier model view"
          className="inline-flex rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-1"
        >
          {FRONTIER_MODELS_VIEW_OPTIONS.map((view) => {
            const isActive = resolvedState.view === view;
            return (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() =>
                  navigate({ ...resolvedState, view: view as FrontierView })
                }
                className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[var(--home-paper)] text-[var(--home-ink)] shadow-sm"
                    : "text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                }`}
              >
                {FRONTIER_MODELS_VIEW_LABELS[view]}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-[var(--home-ink-muted)]">
          {filteredModels.length} of {snapshot.models.length} models shown
        </p>
      </section>

      {filteredModels.length === 0 ? (
        <EmptyPanel
          title="No models match those filters"
          description="Try widening the provider, modality, or price-tier filters to see more options."
        />
      ) : resolvedState.view === "chart" ? (
        <FrontierCostContextChart
          models={filteredModels}
          selectedModelId={resolvedState.selectedModelId}
          onSelectModel={handleSelectModel}
        />
      ) : (
        <FrontierModelsTable
          models={filteredModels}
          selectedModelId={resolvedState.selectedModelId}
          onSelectModel={handleSelectModel}
        />
      )}
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
      <span className="min-w-[88px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
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
              className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                  : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
