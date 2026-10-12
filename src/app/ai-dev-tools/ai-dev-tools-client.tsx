"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, RotateCcw, Search, X } from "lucide-react";
import { BrandGithub } from "@/components/ui/ServerIcons";
import { useClientNow } from "@/hooks/useClientNow";
import { formatLongUtcDate } from "@/lib/date-formatters";
import { SurfaceMap } from "./SurfaceMap";
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
  AI_DEV_TOOLS_ROUTE,
  buildAiDevToolsHref,
  DEFAULT_AI_DEV_TOOLS_STATE,
  normalizeAiDevToolsState,
  type AiDevToolsRouteState,
} from "./ai-dev-tools-state";
import { useModal } from "@/hooks/useModal";

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

// Lifecycle signal printed as a word beside the name, so a tool that's
// mid-pivot or enterprise-gated reads at a glance, not just in the drawer.
const STATUS_LABELS: Record<AiDevTool["status"], string> = {
  active: "Active",
  transition: "In transition",
  "enterprise-focused": "Enterprise",
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
function releaseFreshness(tool: AiDevTool, nowMs: number | null): { dot: "none" | "recent" | "steady" | "stale"; title: string } {
  const ms = releaseTimeMs(tool);
  if (!ms) return { dot: "none", title: "No dated release" };
  if (nowMs === null) {
    return { dot: "none", title: `Released ${formatReleaseDate(tool.latestRelease)}` };
  }
  const days = Math.max(0, Math.round((nowMs - ms) / 86_400_000));
  if (days <= 30) return { dot: "recent", title: `Shipped ${days}d ago` };
  if (days <= 120) return { dot: "steady", title: `Shipped ${days}d ago` };
  return { dot: "stale", title: `Last ship ${days}d ago` };
}

/**
 * The filters live in the URL, and every change is a plain history replace.
 * The router syncs useSearchParams from the native call, so a change never
 * waits on a server render of this page the way router.replace did. An href
 * the bar already shows is left alone.
 */
function replaceHref(href: string) {
  if (href === `${window.location.pathname}${window.location.search}`) return;
  window.history.replaceState(null, "", href);
}

/** Opening a tool's drawer is the one change that gets a history entry, so Back closes it. */
function pushHref(href: string) {
  if (href === `${window.location.pathname}${window.location.search}`) return;
  window.history.pushState(null, "", href);
}

/** The URL as the bar shows it now, since useSearchParams follows a replace through a transition. */
function readBarState(): AiDevToolsRouteState {
  return normalizeAiDevToolsState(new URLSearchParams(window.location.search));
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

  const currentQuery = searchParams.toString();
  const currentHref = currentQuery ? `${AI_DEV_TOOLS_ROUTE}?${currentQuery}` : AI_DEV_TOOLS_ROUTE;
  const canonicalHref = buildAiDevToolsHref(state);
  useEffect(() => {
    if (hasManagedParams && currentHref !== canonicalHref) replaceHref(canonicalHref);
  }, [canonicalHref, currentHref, hasManagedParams]);

  const [sort, setSort] = useState<SortKey>("curated");

  // The search box keeps its own text, since a field read from the URL
  // snapped back between keystrokes while the router caught up. The URL
  // follows the field after a pause, reading the rest of the state from the
  // bar at that moment so a filter picked inside the pause is kept, and
  // every click carries the field's text. Back or forward is the one URL
  // change the page did not write, so it alone re-seeds the field.
  const [query, setQuery] = useState(state.query);
  useEffect(() => {
    const id = window.setTimeout(
      () => replaceHref(buildAiDevToolsHref({ ...readBarState(), query })),
      250
    );
    return () => window.clearTimeout(id);
  }, [query]);
  useEffect(() => {
    const reseed = () => setQuery(readBarState().query);
    window.addEventListener("popstate", reseed);
    return () => window.removeEventListener("popstate", reseed);
  }, []);

  function navigate(partial: Partial<AiDevToolsRouteState>) {
    replaceHref(buildAiDevToolsHref({ ...state, query, ...partial }));
  }

  const filteredTools = useMemo(
    () =>
      filterAiDevTools(aiDevTools, {
        category: state.category,
        pricing: state.pricing,
        model: state.model,
        source: state.source,
        query,
      }),
    [state.category, state.model, state.pricing, query, state.source]
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
  const now = useClientNow();
  const updatedAt = formatLongUtcDate(AI_DEV_TOOLS_GENERATED_AT);

  function updateFilter(partial: Partial<AiDevToolsRouteState>) {
    navigate({ ...partial, selectedToolId: null });
  }

  function resetFilters() {
    setQuery("");
    navigate(DEFAULT_AI_DEV_TOOLS_STATE);
  }

  const [view, setView] = useState<"list" | "map">("list");
  const handleSelectTool = (toolId: string) =>
    pushHref(buildAiDevToolsHref({ ...state, query, selectedToolId: toolId }));
  const surfaceMapProps = {
    tools: sortedTools,
    categories: categoryOptions.slice(1).map((option) => option.id),
    pricing: pricingOptions.slice(1).map((option) => option.id),
    selectedToolId: selectedTool?.id ?? null,
    onSelect: handleSelectTool,
  };

  return (
    <div className="adt-root">
      <div className="c97-shell c97-frame adt-page">
        <header className="adt-head">
          <h1 className="adt-title">AI Dev Tool Ecosystem</h1>
          <p className="adt-lede">
            A hand-kept directory of the coding assistants and agents people argue about, with
            pricing, model access, GitHub traction, and release cadence side by side.
          </p>
        </header>

        <section className="adt-directory" aria-labelledby="dev-tools-directory">
          <h2 id="dev-tools-directory" className="sr-only">
            The directory
          </h2>
          <div className="adt-toolbar">
            <label className="adt-search">
              <Search aria-hidden="true" size={16} />
              <span className="sr-only">Search tools</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools, models, surfaces"
              />
            </label>
            <div className="adt-filters">
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
              <button type="button" onClick={resetFilters} className="adt-reset">
                <RotateCcw aria-hidden="true" size={16} />
                Reset
              </button>
            </div>
          </div>

          <div className="adt-meta">
            <p className="adt-count">
              {filteredTools.length} of {aiDevTools.length} tools shown
            </p>
            <p className="adt-disclosure">
              Curated by hand, figures as of {updatedAt}
              {AI_DEV_TOOLS_VERIFIED
                ? "."
                : ", not yet independently verified, so treat them as directional."}
            </p>
            <div className="adt-view">
              <FilterSelect
                label="Sort"
                value={sort}
                options={SORT_OPTIONS}
                onChange={(value) => setSort(value as SortKey)}
              />
              <div role="group" aria-label="Directory view" className="adt-switch">
                <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
                  List
                </button>
                <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>
                  Map
                </button>
              </div>
            </div>
          </div>

          {sortedTools.length === 0 ? (
            <div className="adt-empty">
              <p className="adt-empty-title">No tools match those filters</p>
              <p>Try a wider category, pricing model, or search term.</p>
            </div>
          ) : view === "list" ? (
            <ToolDirectoryList
              tools={sortedTools}
              maxStars={maxStars}
              nowMs={now}
              selectedToolId={selectedTool?.id ?? null}
              onSelect={handleSelectTool}
            />
          ) : (
            <div className="adt-map">
              {/* The two-axis grid needs about 960px, so a narrower screen gets the
                  same map as a list grouped by category, and the stylesheet shows one. */}
              <SurfaceMap layout="grid" {...surfaceMapProps} />
              <SurfaceMap layout="list" {...surfaceMapProps} />
            </div>
          )}
        </section>
      </div>

      <ToolDrawer
        tool={selectedTool}
        onClose={() => navigate({ selectedToolId: null })}
      />
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
    <label className="adt-select">
      <span className="adt-select-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
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

// One ruled row per tool, each row a button that opens the drawer. From 900px
// the facts line up under one header; below that each fact carries its label.
function ToolDirectoryList({
  tools,
  maxStars,
  nowMs,
  selectedToolId,
  onSelect,
}: ToolDirectoryListProps) {
  return (
    <div className="adt-list">
      <div className="adt-list-head" aria-hidden="true">
        <span>Tool</span>
        <span>Pricing</span>
        <span>Models</span>
        <span>Release</span>
        <span className="adt-end">GitHub stars</span>
      </div>
      <ul className="adt-rows">
        {tools.map((tool) => {
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
                aria-pressed={selectedToolId === tool.id}
                className="adt-row"
              >
                <span className="adt-cell adt-cell--name">
                  <span className="adt-name">
                    {tool.name}
                    <span className="adt-badge" data-status={tool.status}>
                      {STATUS_LABELS[tool.status]}
                    </span>
                  </span>
                  <span className="adt-sub">
                    {AI_DEV_TOOL_CATEGORY_LABELS[tool.category]} · {tool.company}
                  </span>
                </span>
                <span className="adt-cell">
                  <span className="adt-cell-label">Pricing</span>
                  <span className="adt-fact">{AI_DEV_TOOL_PRICING_LABELS[tool.pricingModel]}</span>
                  <span className="adt-note">{tool.pricingSummary}</span>
                </span>
                <span className="adt-cell">
                  <span className="adt-cell-label">Models</span>
                  <span className="adt-fact">{AI_DEV_TOOL_MODEL_LABELS[tool.modelSupport]}</span>
                  <span className="adt-note">{tool.modelSummary}</span>
                </span>
                <span className="adt-cell">
                  <span className="adt-cell-label">Release</span>
                  <span className="adt-fact">{AI_DEV_TOOL_CADENCE_LABELS[tool.releaseCadence]}</span>
                  <span className="adt-note adt-date">
                    <span className="adt-dot" data-tone={freshness.dot} title={freshness.title} aria-hidden="true" />
                    {formatReleaseDate(tool.latestRelease)}
                  </span>
                </span>
                <span className="adt-cell adt-cell--stars">
                  <span className="adt-cell-label">GitHub stars</span>
                  <span className="adt-stars">{formatGithubStars(tool.githubStars)}</span>
                  {starPct > 0 ? (
                    <span className="adt-meter" aria-hidden="true">
                      <span style={{ width: `${starPct}%` }} />
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
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
    <div className="c97-enter-fade adt-drawer-layer">
      <button
        type="button"
        aria-label="Close tool detail"
        onClick={onClose}
        className="adt-scrim"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${tool.name} detail`}
        tabIndex={-1}
        className="c97-enter-slide-x adt-drawer"
      >
        <div className="adt-drawer-head">
          <div className="adt-drawer-title">
            <p className="adt-sub">
              {AI_DEV_TOOL_CATEGORY_LABELS[tool.category]} · {tool.company}
            </p>
            <h2 className="adt-h2">{tool.name}</h2>
          </div>
          <div className="adt-drawer-actions">
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${tool.name}`}
              className="adt-icon-button"
            >
              <ExternalLink aria-hidden="true" size={16} />
            </a>
            <button type="button" onClick={onClose} aria-label="Close" className="adt-icon-button">
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </div>

        <p className="adt-tagline">{tool.tagline}</p>

        <dl className="adt-details">
          <DetailRow label="Pricing" value={tool.pricingSummary} />
          <DetailRow label="Models" value={tool.modelSummary} />
          <DetailRow label="Stars" value={formatGithubStars(tool.githubStars)} />
          <DetailRow label="Release" value={tool.releaseSummary} />
          <DetailRow label="Best for" value={tool.bestFor} />
          <DetailRow label="Watch" value={tool.watchOut} />
        </dl>

        <p className="adt-surfaces">
          {tool.surfaces.map((surface) => (
            <span key={surface} className="adt-surface">
              {surface}
            </span>
          ))}
        </p>

        <div className="adt-sources">
          <p className="adt-cell-label adt-sources-label">Sources</p>
          {tool.githubRepo ? (
            <a href={tool.githubRepo} target="_blank" rel="noopener noreferrer" className="adt-source">
              <BrandGithub aria-hidden="true" className="adt-source-icon" />
              GitHub repo
            </a>
          ) : null}
          {tool.sourceUrls.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="adt-source"
            >
              <ExternalLink aria-hidden="true" size={16} />
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="adt-detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
