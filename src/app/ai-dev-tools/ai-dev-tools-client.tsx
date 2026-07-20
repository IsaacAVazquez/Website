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

type SortKey = "curated" | "stars" | "recent" | "name";

const SORT_OPTIONS: FilterOption[] = [
  { id: "curated", label: "Curated order" },
  { id: "stars", label: "GitHub stars" },
  { id: "recent", label: "Recently shipped" },
  { id: "name", label: "Name (A–Z)" },
];

// Lifecycle signal surfaced as a small badge so a tool that's mid-pivot or
// enterprise-gated reads at a glance, not just in the detail panel.
const STATUS_BADGES: Record<
  AiDevTool["status"],
  { label: string; bg: string; fg: string }
> = {
  active: {
    label: "Active",
    bg: "color-mix(in srgb, var(--home-positive) 14%, var(--home-paper))",
    fg: "color-mix(in srgb, var(--home-positive) 55%, var(--home-ink))",
  },
  transition: {
    label: "In transition",
    bg: "color-mix(in srgb, var(--home-warning) 16%, var(--home-paper))",
    fg: "color-mix(in srgb, var(--home-warning) 50%, var(--home-ink))",
  },
  "enterprise-focused": {
    label: "Enterprise",
    bg: "var(--home-paper-alt)",
    fg: "var(--home-ink-muted)",
  },
};

function releaseTimeMs(tool: AiDevTool): number {
  if (!tool.latestRelease) return 0;
  const ms = new Date(tool.latestRelease).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function sortTools(tools: AiDevTool[], sort: SortKey): AiDevTool[] {
  if (sort === "curated") return tools;
  const copy = [...tools];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "stars":
      return copy.sort((a, b) => (b.githubStars ?? -1) - (a.githubStars ?? -1));
    case "recent":
      return copy.sort((a, b) => releaseTimeMs(b) - releaseTimeMs(a));
    default:
      return copy;
  }
}

// Days since the latest release → a freshness tone. Recent ships read as
// momentum; long gaps read as a watch-out.
function releaseFreshness(tool: AiDevTool, nowMs: number): { dot: string; title: string } {
  const ms = releaseTimeMs(tool);
  if (!ms) return { dot: "var(--home-rule)", title: "No dated release" };
  const days = Math.max(0, Math.round((nowMs - ms) / 86_400_000));
  if (days <= 30) return { dot: "var(--home-positive)", title: `Shipped ${days}d ago` };
  if (days <= 120) return { dot: "var(--home-ink-muted)", title: `Shipped ${days}d ago` };
  return { dot: "var(--home-warning)", title: `Last ship ${days}d ago` };
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

  const [sort, setSort] = useState<SortKey>("curated");

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

  const sortedTools = useMemo(() => sortTools(filteredTools, sort), [filteredTools, sort]);

  const maxStars = useMemo(
    () => sortedTools.reduce((max, tool) => Math.max(max, tool.githubStars ?? 0), 0),
    [sortedTools]
  );

  const selectedTool = useMemo(
    () => aiDevTools.find((tool) => tool.id === state.selectedToolId) ?? null,
    [state.selectedToolId]
  );
  const visibleDetailTool = selectedTool ?? sortedTools[0] ?? null;
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
            Curated snapshot · Updated {updatedAt} · I verify pricing and releases manually
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
          { label: "Open source", href: "/ai-dev-tools?source=open-source", icon: BrandGithub },
        ]}
      />

      <section className="home-card p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.6fr)]">
          <label className="flex min-h-[44px] items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm text-[var(--home-ink)]">
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 text-sm font-semibold text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)]"
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
            <FilterSelect
              label="Sort"
              value={sort}
              options={SORT_OPTIONS}
              onChange={(value) => setSort(value as SortKey)}
            />
          </div>

          {sortedTools.length === 0 ? (
            <EmptyPanel
              title="No tools match those filters"
              description="Try a wider category, pricing model, or search term."
            />
          ) : (
            <ToolDirectoryList
              tools={sortedTools}
              maxStars={maxStars}
              nowMs={renderedAtMs}
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
    <label className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 text-sm font-semibold text-[var(--home-ink-muted)]">
      <span className="text-2xs uppercase tracking-[0.16em]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] bg-transparent text-sm font-semibold text-[var(--home-ink)] focus:outline-none"
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

interface ToolDirectoryListProps {
  tools: AiDevTool[];
  maxStars: number;
  nowMs: number;
  selectedToolId: string | null;
  onSelect: (toolId: string) => void;
}

// A responsive directory of row-cards (replaces the old horizontally-scrolling
// table). Each card reflows from a single column on mobile to a three-up facts
// grid on larger screens, and encodes GitHub traction (relative bar), release
// freshness (dot), and lifecycle (badge) so the market is scannable at a glance.
function ToolDirectoryList({
  tools,
  maxStars,
  nowMs,
  selectedToolId,
  onSelect,
}: ToolDirectoryListProps) {
  return (
    <ul className="grid min-w-0 gap-3">
      {tools.map((tool) => {
        const isSelected = selectedToolId === tool.id;
        const badge = STATUS_BADGES[tool.status];
        const freshness = releaseFreshness(tool, nowMs);
        const starPct =
          maxStars > 0 && tool.githubStars
            ? Math.max(6, Math.round((tool.githubStars / maxStars) * 100))
            : 0;
        return (
          <li key={tool.id}>
            <button
              type="button"
              onClick={() => onSelect(tool.id)}
              aria-pressed={isSelected}
              className="w-full rounded-[var(--radius-2xl)] border bg-[var(--home-paper)] p-4 text-left transition-colors hover:bg-[var(--home-paper-alt)]"
              style={{
                borderColor: isSelected ? "var(--home-ink)" : "var(--home-rule)",
                boxShadow: isSelected ? "inset 3px 0 0 0 var(--home-signal)" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)]">
                    <ToolCategoryIcon category={tool.category} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-[var(--home-ink)]">
                        {tool.name}
                      </span>
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-3xs font-semibold uppercase tracking-[0.12em]"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                      {AI_DEV_TOOL_CATEGORY_LABELS[tool.category]} · {tool.company}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-semibold text-[var(--home-ink)]">
                    {formatGithubStars(tool.githubStars)}
                  </span>
                  <span className="mt-0.5 block text-3xs uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                    GH stars
                  </span>
                  {starPct > 0 ? (
                    <span className="mt-1 ml-auto block h-1 w-16 overflow-hidden rounded-full bg-[var(--home-rule)]">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${starPct}%`, background: "var(--home-signal)" }}
                      />
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid gap-3 border-t border-[var(--home-rule)] pt-3 sm:grid-cols-3">
                <div className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                    Pricing
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-[var(--home-ink)]">
                    {AI_DEV_TOOL_PRICING_LABELS[tool.pricingModel]}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-[var(--home-ink-muted)]">
                    {tool.pricingSummary}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                    Models
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-[var(--home-ink)]">
                    {AI_DEV_TOOL_MODEL_LABELS[tool.modelSupport]}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-[var(--home-ink-muted)]">
                    {tool.modelSummary}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                    Release
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-[var(--home-ink)]">
                    {AI_DEV_TOOL_CADENCE_LABELS[tool.releaseCadence]}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--home-ink-muted)]">
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: freshness.dot }}
                      title={freshness.title}
                      aria-hidden="true"
                    />
                    {formatReleaseDate(tool.latestRelease)}
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
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
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink)]">
            <ToolCategoryIcon category={tool.category} className="h-5 w-5" />
          </span>
          <div>
            <p className="mb-1 text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
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
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)]"
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
        <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
          Sources
        </p>
        <div className="flex flex-col gap-2">
          {tool.githubRepo ? (
            <a
              href={tool.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--home-ink)] transition-colors hover:text-[var(--home-signal)]"
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
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--home-ink)] transition-colors hover:text-[var(--home-signal)]"
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
    <div className="rounded-[var(--radius-xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-3">
      <p className="mb-1 text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
        {label}
      </p>
      <p className="mb-0 text-sm leading-6 text-[var(--home-ink)]">{value}</p>
    </div>
  );
}
