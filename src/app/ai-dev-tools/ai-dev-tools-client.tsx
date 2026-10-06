"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, RotateCcw, Search, X } from "lucide-react";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { BrandGithub } from "@/components/ui/ServerIcons";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { useClientNow } from "@/hooks/useClientNow";
import { formatLongUtcDate } from "@/lib/date-formatters";
import { SurfaceMap, ToolCategoryIcon } from "./SurfaceMap";
import {
  AI_DEV_TOOL_CADENCE_LABELS,
  AI_DEV_TOOL_CATEGORY_LABELS,
  AI_DEV_TOOL_MODEL_LABELS,
  AI_DEV_TOOL_PRICING_LABELS,
  AI_DEV_TOOL_SOURCE_LABELS,
  AI_DEV_TOOLS_GENERATED_AT,
  AI_DEV_TOOLS_VERIFIED,
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
import { useModal } from "@/hooks/useModal";
import { useRouteSync } from "@/hooks/useRouteSync";

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

type SortKey = "curated" | "stars" | "recent" | "name";

const SORT_OPTIONS: FilterOption[] = [
  { id: "curated", label: "Curated order" },
  { id: "stars", label: "GitHub stars" },
  { id: "recent", label: "Recently shipped" },
  { id: "name", label: "Name (A to Z)" },
];

// Lifecycle signal surfaced as a small badge so a tool that's mid-pivot or
// enterprise-gated reads at a glance, not just in the detail panel.
const STATUS_BADGES: Record<
  AiDevTool["status"],
  { label: string; bg: string; fg: string }
> = {
  active: {
    label: "Active",
    bg: "color-mix(in srgb, var(--c97-positive) 14%, var(--c97-surface))",
    fg: "color-mix(in srgb, var(--c97-positive) 55%, var(--c97-ink))",
  },
  transition: {
    label: "In transition",
    bg: "color-mix(in srgb, var(--c97-warning) 16%, var(--c97-surface))",
    fg: "color-mix(in srgb, var(--c97-warning) 50%, var(--c97-ink))",
  },
  "enterprise-focused": {
    label: "Enterprise",
    bg: "var(--c97-field)",
    fg: "var(--c97-ink-2)",
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
// momentum; long gaps read as a watch-out. `nowMs` is null while
// useClientNow() hasn't resolved yet (server render and first hydration
// pass), so the dot stays neutral and the title shows the absolute date
// instead of a day count that could disagree between server and client.
function releaseFreshness(tool: AiDevTool, nowMs: number | null): { dot: string; title: string } {
  const ms = releaseTimeMs(tool);
  if (!ms) return { dot: "var(--c97-rule)", title: "No dated release" };
  if (nowMs === null) {
    return { dot: "var(--c97-rule)", title: `Released ${formatReleaseDate(tool.latestRelease)}` };
  }
  const days = Math.max(0, Math.round((nowMs - ms) / 86_400_000));
  if (days <= 30) return { dot: "var(--c97-positive)", title: `Shipped ${days}d ago` };
  if (days <= 120) return { dot: "var(--c97-ink-2)", title: `Shipped ${days}d ago` };
  return { dot: "var(--c97-warning)", title: `Last ship ${days}d ago` };
}

export function AiDevToolsClient({ initialState }: AiDevToolsClientProps) {
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

  const desiredHref = buildAiDevToolsHref(state);

  const pushHref = useRouteSync("/ai-dev-tools", desiredHref);

  function navigate(nextState: AiDevToolsRouteState) {
    const href = buildAiDevToolsHref(nextState);
    pushHref(href);
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
  const openSourceCount = aiDevTools.filter((tool) => tool.sourceStatus === "open-source").length;

  const now = useClientNow();
  const mostRecentTool = useMemo(
    () =>
      aiDevTools.reduce<AiDevTool | null>((newest, tool) => {
        if (!tool.latestRelease) return newest;
        if (!newest || releaseTimeMs(tool) > releaseTimeMs(newest)) return tool;
        return newest;
      }, null),
    []
  );
  const latestReleaseAge = useMemo(() => {
    if (!mostRecentTool) return "—";
    if (now === null) return formatReleaseDate(mostRecentTool.latestRelease);
    const days = Math.max(
      0,
      Math.round((now - releaseTimeMs(mostRecentTool)) / (1000 * 60 * 60 * 24))
    );
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  }, [mostRecentTool, now]);

  const updatedAt = formatLongUtcDate(AI_DEV_TOOLS_GENERATED_AT);

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

  const lead = PROJECT_PRESS["/ai-dev-tools"].lead;
  const standfirst =
    "I wanted a cleaner way to compare the coding-agent market, and the split I care about now runs along editor control, terminal control, cloud autonomy, and how directly each product exposes its own model economics. This directory tracks the tools people actually argue about, with pricing, model access, GitHub traction, and release velocity in one place. I keep the entries by hand, so every figure is as of the snapshot date and each entry links to the pages it came from.";
  const handleSelectTool = (toolId: string) => navigate({ ...state, selectedToolId: toolId });
  const surfaceMapProps = {
    tools: aiDevTools,
    categories: categoryOptions.slice(1).map((option) => option.id),
    pricing: pricingOptions.slice(1).map((option) => option.id),
    selectedToolId: selectedTool?.id ?? null,
    onSelect: handleSelectTool,
  };

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="AI Dev Tool Ecosystem"
        standfirst={standfirst}
        meta={`Curated snapshot · figures as of ${updatedAt}${AI_DEV_TOOLS_VERIFIED ? "" : " · not yet independently verified, so treat them as directional"}`}
        // The standfirst and figures fill a phone's first screen, so one link goes straight to the directory.
        action={<a href="#dev-tools-directory" className="c97-btn-ghost">Jump to the directory</a>}
        readouts={[
          {
            label: "Tools tracked",
            value: `${aiDevTools.length}`,
            detail: "Across categories and pricing tiers",
          },
          {
            label: "Open source",
            value: `${openSourceCount}`,
            detail: "No proprietary license",
          },
          {
            label: "Most recent release",
            value: latestReleaseAge,
            detail: mostRecentTool?.name ?? "No dated release yet",
          },
        ]}
      >
        {/* The two-axis grid. Below 960px the same map prints as a list after the directory. */}
        <SurfaceMap layout="grid" {...surfaceMapProps} />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="flex flex-col c97-shell" style={{ gap: "var(--c97-sp-3)" }}>
          <h2 id="dev-tools-directory" className="c97-poster-sm" style={{ scrollMarginTop: "var(--c97-sp-4)" }}>The directory</h2>

          <div className="grid lg:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.6fr)]" style={{ gap: "var(--c97-sp-2)" }}>
            <label className="flex min-h-[44px] items-center border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-sm text-[var(--c97-ink)]" style={{ paddingInline: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
              <Search aria-hidden="true" className="h-4 w-4 text-[var(--c97-ink-2)]" />
              <span className="sr-only">Search tools</span>
              <input
                value={state.query}
                onChange={(event) => updateFilter({ query: event.target.value })}
                placeholder="Search tools, models, surfaces"
                className="min-h-[44px] w-full bg-transparent text-sm text-[var(--c97-ink)] placeholder:text-[var(--c97-ink-2)]"
              />
            </label>
            <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
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
                className="inline-flex min-h-[44px] items-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-sm font-semibold text-[var(--c97-ink-2)] transition-colors hover:text-[var(--c97-ink)]" style={{ paddingInline: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-col min-w-0" style={{ gap: "var(--c97-sp-2)" }}>
            <div className="flex flex-wrap items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
              <p className="text-sm font-semibold text-[var(--c97-ink-2)]" style={{ marginBottom: "0" }}>
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
                nowMs={now}
                selectedToolId={selectedTool?.id ?? null}
                onSelect={handleSelectTool}
              />
            )}
          </div>

          <div className="c97-surface-map-narrow flex-col" style={{ gap: "var(--c97-sp-2)" }}>
            <h2 className="c97-poster-sm">By category and pricing</h2>
            <SurfaceMap layout="list" {...surfaceMapProps} />
          </div>
        </div>
      </section>

      <ToolDrawer
        tool={selectedTool}
        onClose={() => navigate({ ...state, selectedToolId: null })}
      />
    </>
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
    <label className="inline-flex min-h-[44px] items-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-sm font-semibold text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
      <span className="text-2xs uppercase tracking-[0.16em]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] bg-transparent text-sm font-semibold text-[var(--c97-ink)]"
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
  nowMs: number | null;
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
    <ul className="grid min-w-0" style={{ gap: "var(--c97-sp-1)" }}>
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
              className="w-full border bg-[var(--c97-surface)] text-left transition-colors hover:bg-[var(--c97-field)]"
              style={{
                padding: "var(--c97-sp-2)",
                borderColor: isSelected ? "var(--c97-ink)" : "var(--c97-rule)",
                boxShadow: isSelected ? "inset 3px 0 0 0 var(--c97-accent)" : undefined,
              }}
            >
              <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                <div className="flex min-w-0 items-start" style={{ gap: "var(--c97-sp-1)" }}>
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-[var(--c97-ink-2)]">
                    <ToolCategoryIcon category={tool.category} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
                      <span className="text-base font-semibold text-[var(--c97-ink)]">
                        {tool.name}
                      </span>
                      <span
                        className="inline-flex py-0.5 text-3xs font-semibold uppercase tracking-[0.12em]"
                        style={{ paddingInline: "var(--c97-sp-1)", background: badge.bg, color: badge.fg }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-ink-2)]">
                      {AI_DEV_TOOL_CATEGORY_LABELS[tool.category]} · {tool.company}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-semibold text-[var(--c97-ink)]">
                    {formatGithubStars(tool.githubStars)}
                  </span>
                  <span className="mt-0.5 block text-3xs uppercase tracking-[0.16em] text-[var(--c97-ink-2)]">
                    GH stars
                  </span>
                  {starPct > 0 ? (
                    <span className="ml-auto block h-1 w-16 overflow-hidden bg-[var(--c97-rule)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                      <span
                        className="block h-full"
                        style={{ width: `${starPct}%`, background: "var(--c97-accent)" }}
                      />
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid border-t border-[var(--c97-rule)] sm:grid-cols-3" style={{ paddingTop: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                <div className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-ink-2)]">
                    Pricing
                  </span>
                  <span className="block text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                    {AI_DEV_TOOL_PRICING_LABELS[tool.pricingModel]}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-[var(--c97-ink-2)]">
                    {tool.pricingSummary}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-ink-2)]">
                    Models
                  </span>
                  <span className="block text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                    {AI_DEV_TOOL_MODEL_LABELS[tool.modelSupport]}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-[var(--c97-ink-2)]">
                    {tool.modelSummary}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-ink-2)]">
                    Release
                  </span>
                  <span className="block text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                    {AI_DEV_TOOL_CADENCE_LABELS[tool.releaseCadence]}
                  </span>
                  <span className="mt-0.5 flex items-center text-xs text-[var(--c97-ink-2)]" style={{ gap: "var(--c97-sp-0)" }}>
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0"
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

/**
 * A tool's detail as a named drawer, opened from a directory row or a map
 * plate so it prints over whichever one was pressed. It follows `ClubDrawer`:
 * a sheet from the bottom on a phone and a rail on the right from 640px, with
 * `useModal` holding focus and handing it back to the opener on close.
 */
function ToolDrawer({ tool, onClose }: { tool: AiDevTool | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, Boolean(tool), onClose, { resetKey: tool?.id });

  if (!tool) return null;

  return (
    <div className="c97-enter-fade fixed inset-0 z-[var(--c97-z-drawer)] flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        aria-label="Close tool detail"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        style={{ background: "color-mix(in srgb, var(--c97-ink) 34%, transparent)" }}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${tool.name} detail`}
        tabIndex={-1}
        data-c97-surface="paper"
        className="c97-enter-slide-x relative max-h-[88dvh] w-full overflow-y-auto border border-[var(--c97-rule)] outline-none sm:h-full sm:max-h-none sm:w-[27rem]"
        style={{ padding: "var(--c97-sp-2)" }}
      >
        <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
          <div className="flex min-w-0 items-start" style={{ gap: "var(--c97-sp-1)" }}>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-[var(--c97-ink)]">
              <ToolCategoryIcon category={tool.category} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-ink-2)]" style={{ marginBottom: "var(--c97-sp-0)" }}>
                {tool.company}
              </p>
              <h2 className="c97-serif c97-h3">{tool.name}</h2>
            </div>
          </div>
          <div className="flex shrink-0" style={{ gap: "var(--c97-sp-1)" }}>
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${tool.name}`}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-[var(--c97-ink-2)] transition-colors hover:text-[var(--c97-ink)]"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-[var(--c97-ink-2)] transition-colors hover:text-[var(--c97-ink)]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)", marginBottom: "0" }}>
          {tool.tagline}
        </p>

        <div className="grid" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
          <DetailRow label="Pricing" value={tool.pricingSummary} />
          <DetailRow label="Models" value={tool.modelSummary} />
          <DetailRow label="Stars" value={formatGithubStars(tool.githubStars)} />
          <DetailRow label="Release" value={tool.releaseSummary} />
          <DetailRow label="Best for" value={tool.bestFor} />
          <DetailRow label="Watch" value={tool.watchOut} />
        </div>

        <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
          {tool.surfaces.map((surface) => (
            <span
              key={surface}
              className="inline-flex border border-[var(--c97-rule)] bg-[var(--c97-field)] text-xs font-semibold text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-0)" }}
            >
              {surface}
            </span>
          ))}
        </div>

        <div className="border-t border-[var(--c97-rule)]" style={{ paddingTop: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}>
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-ink-2)]" style={{ marginBottom: "var(--c97-sp-1)" }}>
            Sources
          </p>
          <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
            {tool.githubRepo ? (
              <a
                href={tool.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--c97-ink)] transition-colors hover:text-[var(--c97-accent)]" style={{ gap: "var(--c97-sp-1)" }}
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
                className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--c97-ink)] transition-colors hover:text-[var(--c97-accent)]" style={{ gap: "var(--c97-sp-1)" }}
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                {source.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-1)" }}>
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--c97-ink-2)]" style={{ marginBottom: "var(--c97-sp-0)" }}>
        {label}
      </p>
      <p className="text-sm leading-6 text-[var(--c97-ink)]" style={{ marginBottom: "0" }}>{value}</p>
    </div>
  );
}
