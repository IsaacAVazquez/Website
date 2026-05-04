"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Boxes,
  Cloud,
  ExternalLink,
  PanelsTopLeft,
  RotateCcw,
  Search,
  Terminal,
} from "lucide-react";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import { BrandGithub, ChartBar, FileText, Briefcase, Database } from "@/components/ui/ServerIcons";
import {
  AI_DEV_TOOL_CADENCE_LABELS,
  AI_DEV_TOOL_CATEGORY_LABELS,
  AI_DEV_TOOL_MODEL_LABELS,
  AI_DEV_TOOL_PRICING_LABELS,
  AI_DEV_TOOL_SOURCE_LABELS,
  AI_DEV_TOOLS_GENERATED_AT,
  aiDevTools,
  filterAiDevTools,
  formatGithubStars,
  formatReleaseDate,
  type AiDevTool,
  type AiDevToolCategory,
  type AiDevToolModelSupport,
  type AiDevToolPricingModel,
  type AiDevToolSourceStatus,
} from "./ai-dev-tools-data";
import {
  buildAiDevToolsHref,
  DEFAULT_AI_DEV_TOOLS_STATE,
  normalizeAiDevToolsState,
  type AiDevToolsRouteState,
} from "./ai-dev-tools-state";

interface AiDevToolsClientProps {
  initialState: AiDevToolsRouteState;
}

type FilterOption = {
  id: string;
  label: string;
};

const categoryOptions: FilterOption[] = [
  { id: "all", label: "All categories" },
  ...Array.from(new Set(aiDevTools.map((tool) => tool.category))).map((category) => ({
    id: category,
    label: AI_DEV_TOOL_CATEGORY_LABELS[category],
  })),
];

const pricingOptions: FilterOption[] = [
  { id: "all", label: "Any pricing" },
  ...Array.from(new Set(aiDevTools.map((tool) => tool.pricingModel))).map((pricing) => ({
    id: pricing,
    label: AI_DEV_TOOL_PRICING_LABELS[pricing],
  })),
];

const modelOptions: FilterOption[] = [
  { id: "all", label: "Any model setup" },
  ...Array.from(new Set(aiDevTools.map((tool) => tool.modelSupport))).map((model) => ({
    id: model,
    label: AI_DEV_TOOL_MODEL_LABELS[model],
  })),
];

const sourceOptions: FilterOption[] = [
  { id: "all", label: "Any source model" },
  ...Array.from(new Set(aiDevTools.map((tool) => tool.sourceStatus))).map((source) => ({
    id: source,
    label: AI_DEV_TOOL_SOURCE_LABELS[source],
  })),
];

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface ToolCategoryIconProps {
  category: AiDevToolCategory;
  className?: string;
}

function ToolCategoryIcon({ category, className = "h-4 w-4" }: ToolCategoryIconProps) {
  switch (category) {
    case "cloud-agent":
      return <Cloud aria-hidden="true" className={className} />;
    case "terminal-agent":
      return <Terminal aria-hidden="true" className={className} />;
    case "review-ci":
      return <Boxes aria-hidden="true" className={className} />;
    case "ide":
    case "editor-extension":
    case "enterprise-platform":
    default:
      return <PanelsTopLeft aria-hidden="true" className={className} />;
  }
}

export function AiDevToolsClient({ initialState }: AiDevToolsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasManagedParams =
    searchParams.get("category") !== null ||
    searchParams.get("pricing") !== null ||
    searchParams.get("model") !== null ||
    searchParams.get("source") !== null ||
    searchParams.get("q") !== null ||
    searchParams.get("tool") !== null;

  const state = hasManagedParams
    ? normalizeAiDevToolsState(searchParams)
    : initialState;

  const currentQuery = searchParams.toString();
  const currentHref = `/ai-dev-tools${currentQuery ? `?${currentQuery}` : ""}`;
  const desiredHref = buildAiDevToolsHref(state);

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: AiDevToolsRouteState) {
    const href = buildAiDevToolsHref(nextState);
    if (href === currentHref) {
      return;
    }
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  const filteredTools = useMemo(
    () =>
      filterAiDevTools(aiDevTools, {
        category: state.category,
        pricing: state.pricing,
        model: state.model,
        source: state.source,
        query: state.query,
      }),
    [state.category, state.model, state.pricing, state.query, state.source]
  );

  const selectedTool = useMemo(
    () => aiDevTools.find((tool) => tool.id === state.selectedToolId) ?? null,
    [state.selectedToolId]
  );
  const visibleDetailTool = selectedTool ?? filteredTools[0] ?? null;
  const openOrPublicCount = aiDevTools.filter(
    (tool) => tool.sourceStatus !== "proprietary"
  ).length;
  const multiModelCount = aiDevTools.filter(
    (tool) =>
      tool.modelSupport === "curated-multi-model" ||
      tool.modelSupport === "byok-multi-provider" ||
      tool.modelSupport === "local-models"
  ).length;
  const pricedCount = aiDevTools.filter((tool) => tool.pricingSummary.length > 0).length;
  const ideEditorCount = aiDevTools.filter(
    (tool) => tool.category === "ide" || tool.category === "editor-extension"
  ).length;
  const cloudAgentCount = aiDevTools.filter((tool) => tool.category === "cloud-agent").length;
  const terminalAgentCount = aiDevTools.filter((tool) => tool.category === "terminal-agent").length;

  const [renderedAtMs] = useState<number>(() => Date.now());
  const latestReleaseAge = useMemo(() => {
    let mostRecent = 0;
    for (const tool of aiDevTools) {
      if (!tool.latestRelease) continue;
      const t = new Date(tool.latestRelease).getTime();
      if (Number.isFinite(t) && t > mostRecent) mostRecent = t;
    }
    if (mostRecent === 0) return "—";
    const days = Math.max(0, Math.round((renderedAtMs - mostRecent) / (1000 * 60 * 60 * 24)));
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  }, [renderedAtMs]);

  const updatedAt = formatGeneratedAt(AI_DEV_TOOLS_GENERATED_AT);

  const aiDevCells: HomeStatsCell[] = [
    {
      label: "Tools tracked",
      value: <span className="tabular-nums">{aiDevTools.length}</span>,
      sub: "Across categories and pricing tiers",
    },
    {
      label: "Open or public",
      value: <span className="tabular-nums">{openOrPublicCount}</span>,
      sub: "Public repo or open source",
    },
    {
      label: "Multi-model",
      value: <span className="tabular-nums">{multiModelCount}</span>,
      sub: "Curated, BYOK, or local models",
    },
    {
      label: "Priced",
      value: <span className="tabular-nums">{pricedCount}</span>,
      sub: "With current pricing notes",
    },
    {
      label: "IDE or editor extensions",
      value: <span className="tabular-nums">{ideEditorCount}</span>,
      sub: "Live inside the editor",
    },
    {
      label: "Cloud agents",
      value: <span className="tabular-nums">{cloudAgentCount}</span>,
      sub: "Run autonomously off-machine",
    },
    {
      label: "Terminal agents",
      value: <span className="tabular-nums">{terminalAgentCount}</span>,
      sub: "Driven from the command line",
    },
    {
      label: "Latest release age",
      value: latestReleaseAge,
      sub: "Most recent ship date",
    },
  ];

  function updateFilter(partial: Partial<AiDevToolsRouteState>) {
    const clearsSelection =
      partial.category !== undefined ||
      partial.pricing !== undefined ||
      partial.model !== undefined ||
      partial.source !== undefined ||
      partial.query !== undefined;

    navigate({
      ...state,
      ...partial,
      selectedToolId: clearsSelection
        ? null
        : partial.selectedToolId ?? state.selectedToolId,
    });
  }

  function resetFilters() {
    navigate(DEFAULT_AI_DEV_TOOLS_STATE);
  }

  return (
    <div className="home-shell home-section space-y-8">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.55fr)] lg:items-end">
        <div className="space-y-3">
          <p className="home-kicker mb-0">Modern tech</p>
          <h1 className="mb-0 text-3xl font-semibold text-[var(--home-ink)] sm:text-5xl">
            AI Dev Tool Ecosystem
          </h1>
          <p className="mb-0 max-w-3xl text-base leading-7 text-[var(--home-ink-muted)]">
            I wanted a cleaner way to compare the coding-agent market. This directory
            tracks the tools people actually argue about, with pricing, model access,
            GitHub traction, and release velocity in one place.
          </p>
          <p className="mb-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
            Curated snapshot · Updated {updatedAt}
          </p>
        </div>
        <div className="home-card p-5">
          <p className="mb-2 text-sm font-semibold text-[var(--home-ink)]">
            Market read
          </p>
          <p className="mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
            The split is no longer autocomplete versus chat. The real split is editor
            control, terminal control, cloud autonomy, and how directly each product
            exposes model economics.
          </p>
        </div>
      </header>

      <HomeStatsPanel
        id="ai-dev-tools-stats"
        title="AI dev tools at a glance"
        meta={`Updated ${updatedAt}`}
        cells={aiDevCells}
        pills={[
          { label: "All tools", href: "/ai-dev-tools", icon: ChartBar },
          { label: "Cloud agents", href: "/ai-dev-tools?category=cloud-agent", icon: Database },
          { label: "Terminal agents", href: "/ai-dev-tools?category=terminal-agent", icon: FileText },
          { label: "Editor extensions", href: "/ai-dev-tools?category=editor-extension", icon: Briefcase },
          { label: "GitHub", href: "https://github.com/", icon: BrandGithub, external: true },
        ]}
      />

      <section className="home-card p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.6fr)]">
          <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm text-[var(--home-ink)]">
            <Search aria-hidden="true" className="h-4 w-4 text-[var(--home-ink-muted)]" />
            <span className="sr-only">Search tools</span>
            <input
              value={state.query}
              onChange={(event) => updateFilter({ query: event.target.value })}
              placeholder="Search tools, models, surfaces"
              className="min-h-[44px] w-full bg-transparent text-sm text-[var(--home-ink)] placeholder:text-[var(--home-ink-muted)] focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Category"
              value={state.category}
              options={categoryOptions}
              onChange={(value) =>
                updateFilter({ category: value as AiDevToolCategory | "all" })
              }
            />
            <FilterSelect
              label="Pricing"
              value={state.pricing}
              options={pricingOptions}
              onChange={(value) =>
                updateFilter({ pricing: value as AiDevToolPricingModel | "all" })
              }
            />
            <FilterSelect
              label="Models"
              value={state.model}
              options={modelOptions}
              onChange={(value) =>
                updateFilter({ model: value as AiDevToolModelSupport | "all" })
              }
            />
            <FilterSelect
              label="Source"
              value={state.source}
              options={sourceOptions}
              onChange={(value) =>
                updateFilter({ source: value as AiDevToolSourceStatus | "all" })
              }
            />
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 text-sm font-semibold text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)]"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.65fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="mb-0 text-sm font-semibold text-[var(--home-ink-muted)]">
              {filteredTools.length} of {aiDevTools.length} tools shown
            </p>
          </div>

          {filteredTools.length === 0 ? (
            <EmptyPanel
              title="No tools match those filters"
              description="Try a wider category, pricing model, or search term."
            />
          ) : (
            <ToolDirectoryTable
              tools={filteredTools}
              selectedToolId={visibleDetailTool?.id ?? null}
              onSelect={(toolId) => navigate({ ...state, selectedToolId: toolId })}
            />
          )}
        </div>

        <ToolDetail tool={visibleDetailTool} />
      </section>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 text-sm font-semibold text-[var(--home-ink-muted)]">
      <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[36px] bg-transparent text-sm font-semibold text-[var(--home-ink)] focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ToolDirectoryTableProps {
  tools: AiDevTool[];
  selectedToolId: string | null;
  onSelect: (toolId: string) => void;
}

function ToolDirectoryTable({
  tools,
  selectedToolId,
  onSelect,
}: ToolDirectoryTableProps) {
  return (
    <div className="home-card min-w-0 overflow-hidden p-0">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[58rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
              {["Tool", "Pricing", "Models", "Stars", "Release cadence"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => {
              const isSelected = selectedToolId === tool.id;
              return (
                <tr
                  key={tool.id}
                  className={`cursor-pointer border-b border-[var(--home-rule)] transition-colors hover:bg-[var(--home-paper-alt)] ${
                    isSelected ? "bg-[var(--home-paper-alt)]" : ""
                  }`}
                  onClick={() => onSelect(tool.id)}
                >
                  <td className="min-w-[17rem] px-4 py-4 align-top">
                    <button
                      type="button"
                      className="flex min-h-[44px] w-full items-start gap-3 text-left"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(tool.id);
                      }}
                    >
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink-muted)]">
                        <ToolCategoryIcon category={tool.category} />
                      </span>
                      <span>
                        <span className="block text-base font-semibold text-[var(--home-ink)]">
                          {tool.name}
                        </span>
                        <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                          {AI_DEV_TOOL_CATEGORY_LABELS[tool.category]}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="min-w-[15rem] px-4 py-4 align-top text-[var(--home-ink-muted)]">
                    <span className="font-semibold text-[var(--home-ink)]">
                      {AI_DEV_TOOL_PRICING_LABELS[tool.pricingModel]}
                    </span>
                    <span className="mt-1 block leading-6">{tool.pricingSummary}</span>
                  </td>
                  <td className="min-w-[16rem] px-4 py-4 align-top text-[var(--home-ink-muted)]">
                    <span className="font-semibold text-[var(--home-ink)]">
                      {AI_DEV_TOOL_MODEL_LABELS[tool.modelSupport]}
                    </span>
                    <span className="mt-1 block leading-6">{tool.modelSummary}</span>
                  </td>
                  <td className="px-4 py-4 align-top font-mono text-[var(--home-ink)]">
                    {formatGithubStars(tool.githubStars)}
                  </td>
                  <td className="min-w-[12rem] px-4 py-4 align-top text-[var(--home-ink-muted)]">
                    <span className="font-semibold text-[var(--home-ink)]">
                      {AI_DEV_TOOL_CADENCE_LABELS[tool.releaseCadence]}
                    </span>
                    <span className="mt-1 block">
                      {formatReleaseDate(tool.latestRelease)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ToolDetail({ tool }: { tool: AiDevTool | null }) {
  if (!tool) {
    return (
      <aside className="home-card min-w-0 p-5">
        <p className="mb-0 text-sm text-[var(--home-ink-muted)]">
          No tool is selected.
        </p>
      </aside>
    );
  }

  return (
    <aside className="home-card h-fit min-w-0 p-5 xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink)]">
            <ToolCategoryIcon category={tool.category} className="h-5 w-5" />
          </span>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
              {tool.company}
            </p>
            <h2 className="mb-0 text-2xl font-semibold text-[var(--home-ink)]">
              {tool.name}
            </h2>
          </div>
        </div>
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${tool.name}`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)]"
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>

      <p className="mt-4 mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">
        {tool.tagline}
      </p>

      <div className="mt-5 grid gap-3">
        <DetailRow label="Pricing" value={tool.pricingSummary} />
        <DetailRow label="Models" value={tool.modelSummary} />
        <DetailRow label="Stars" value={formatGithubStars(tool.githubStars)} />
        <DetailRow label="Release" value={tool.releaseSummary} />
        <DetailRow label="Best for" value={tool.bestFor} />
        <DetailRow label="Watch" value={tool.watchOut} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tool.surfaces.map((surface) => (
          <span
            key={surface}
            className="inline-flex rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-1 text-xs font-semibold text-[var(--home-ink-muted)]"
          >
            {surface}
          </span>
        ))}
      </div>

      <div className="mt-5 border-t border-[var(--home-rule)] pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
          Sources
        </p>
        <div className="flex flex-col gap-2">
          {tool.githubRepo ? (
            <a
              href={tool.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--home-ink)] transition-colors hover:text-[var(--home-haze)]"
            >
              <BrandGithub aria-hidden="true" className="h-4 w-4" />
              GitHub repo
            </a>
          ) : null}
          {tool.sourceUrls.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--home-ink)] transition-colors hover:text-[var(--home-haze)]"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
        {label}
      </p>
      <p className="mb-0 text-sm leading-6 text-[var(--home-ink)]">{value}</p>
    </div>
  );
}
