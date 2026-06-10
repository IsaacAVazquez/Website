"use client";

import { startTransition, useEffect } from "react";
import {
  Activity,
  ArrowDownUp,
  Building2,
  CalendarClock,
  ExternalLink,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { MetricCard } from "@/components/football/MetricCard";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { HomeStatsPanel } from "@/components/home/HomeStatsPanel";
import { ChartBar, Briefcase, FileText } from "@/components/ui/ServerIcons";
import { formatUsdCompact, sortTechStartups } from "@/lib/techStartups";
import type {
  TechStartup,
  TechStartupRouteState,
  TechStartupSegment,
  TechStartupSegmentKind,
  TechStartupSnapshot,
  TechStartupSortKey,
} from "@/types/techStartup";
import {
  buildTechStartupHref,
  normalizeTechStartupState,
  resolveTechStartupState,
  TECH_STARTUP_KIND_LABELS,
  TECH_STARTUP_KIND_OPTIONS,
  TECH_STARTUP_ROUTE,
  TECH_STARTUP_SORT_LABELS,
  TECH_STARTUP_SORT_OPTIONS,
} from "./tech-startup-state";

interface TechStartupClientProps {
  initialState: TechStartupRouteState;
  snapshot: TechStartupSnapshot;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const ROUND_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return DATE_TIME_FORMATTER.format(date);
}

function formatRoundDate(yearMonth: string): string {
  const date = new Date(`${yearMonth.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return yearMonth;
  return ROUND_FORMATTER.format(date);
}

function relativeAge(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getSegments(
  snapshot: TechStartupSnapshot,
  kind: TechStartupSegmentKind
): TechStartupSegment[] {
  return kind === "sector" ? snapshot.sectors : snapshot.stages;
}

function buildSegmentLookup(snapshot: TechStartupSnapshot) {
  return new Map(
    [...snapshot.sectors, ...snapshot.stages].map((segment) => [
      segment.key,
      segment,
    ])
  );
}

function getStartupsForSegment(
  snapshot: TechStartupSnapshot,
  kind: TechStartupSegmentKind,
  segmentKey: string
): TechStartup[] {
  if (segmentKey === "all") {
    return [...snapshot.startups];
  }
  const segments = getSegments(snapshot, kind);
  const segment = segments.find((entry) => entry.key === segmentKey);
  if (!segment) return [];
  const allowed = new Set(segment.startupIds);
  return snapshot.startups.filter((startup) => allowed.has(startup.id));
}

export function TechStartupClient({
  initialState,
  snapshot,
}: TechStartupClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("segment") !== null ||
    searchParams.get("sort") !== null ||
    searchParams.get("startup") !== null;
  const routeState = hasManagedParams
    ? normalizeTechStartupState(searchParams)
    : initialState;
  const resolvedState = resolveTechStartupState(routeState, snapshot);
  const currentQuery = searchParams.toString();
  const currentHref = `${TECH_STARTUP_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
  const desiredHref = buildTechStartupHref(resolvedState, searchParams);

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: TechStartupRouteState) {
    const resolvedNext = resolveTechStartupState(nextState, snapshot);
    const href = buildTechStartupHref(resolvedNext, searchParams);
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  const segments = getSegments(snapshot, resolvedState.kind);
  const segmentLookup = buildSegmentLookup(snapshot);
  const filteredStartups = sortTechStartups(
    getStartupsForSegment(snapshot, resolvedState.kind, resolvedState.segment),
    resolvedState.sort
  );
  const selectedStartup = filteredStartups.find(
    (startup) => startup.id === resolvedState.selectedStartupId
  );
  const visibleRaised = filteredStartups.reduce(
    (sum, startup) => sum + startup.totalRaised,
    0
  );

  function setKind(kind: TechStartupSegmentKind) {
    navigate({ ...resolvedState, kind, segment: "all", selectedStartupId: null });
  }

  function setSegment(segment: string) {
    navigate({ ...resolvedState, segment, selectedStartupId: null });
  }

  function setSort(sort: TechStartupSortKey) {
    navigate({ ...resolvedState, sort });
  }

  function toggleStartup(startupId: string) {
    navigate({
      ...resolvedState,
      selectedStartupId:
        resolvedState.selectedStartupId === startupId ? null : startupId,
    });
  }

  return (
    <div className="home-shell home-section space-y-8">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="space-y-4">
          <p className="home-kicker mb-0">Market intelligence</p>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-[var(--home-ink)] sm:text-5xl">
            Tech Startup Tracker
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--home-ink-muted)]">
            A curated read on notable private tech companies — grouped by sector
            and funding stage, with valuations, total raised, the latest round,
            and a momentum score from a checked-in snapshot.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            {/* Relative to Date.now(), so server and client renders can
                differ by a minute — suppress the inevitable mismatch. */}
            <span
              suppressHydrationWarning
              className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3"
            >
              <RefreshCw aria-hidden="true" size={14} />
              Updated {relativeAge(snapshot.generatedAt)}
            </span>
            <span className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3">
              <CalendarClock aria-hidden="true" size={14} />
              Figures as of {formatRoundDate(snapshot.asOf)}
            </span>
          </div>
        </div>

        <section
          className="home-card p-5 sm:p-6"
          aria-labelledby="tech-startup-ledger-heading"
        >
          <p className="home-kicker mb-3" id="tech-startup-ledger-heading">
            Snapshot ledger
          </p>
          <dl className="space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--home-rule)] pb-3">
              <dt className="text-[var(--home-ink-muted)]">Generated</dt>
              <dd className="m-0 text-right font-semibold text-[var(--home-ink)]">
                {formatDate(snapshot.generatedAt)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--home-rule)] pb-3">
              <dt className="text-[var(--home-ink-muted)]">Source</dt>
              <dd className="m-0 text-right font-semibold text-[var(--home-ink)]">
                {snapshot.sourceLabel}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[var(--home-ink-muted)]">Combined valuation</dt>
              <dd className="m-0 text-right font-semibold text-[var(--home-ink)]">
                {formatUsdCompact(snapshot.totals.totalValuation)}
              </dd>
            </div>
          </dl>
        </section>
      </header>

      <HomeStatsPanel
        id="tech-startup-stats"
        title="Startup landscape at a glance"
        meta={`Updated ${relativeAge(snapshot.generatedAt)}`}
        cells={[
          {
            label: "Startups tracked",
            value: <span className="tabular-nums">{snapshot.totals.startups}</span>,
            sub: "Notable private companies",
          },
          {
            label: "Unicorns",
            value: <span className="tabular-nums">{snapshot.totals.unicornCount}</span>,
            sub: "Valued at $1B or more",
            tone: "good",
          },
          {
            label: "Combined valuation",
            value: formatUsdCompact(snapshot.totals.totalValuation),
            sub: "Disclosed post-money",
          },
          {
            label: "Combined raised",
            value: formatUsdCompact(snapshot.totals.totalRaised),
            sub: "Total disclosed funding",
          },
          {
            label: "Sectors",
            value: <span className="tabular-nums">{snapshot.totals.sectors}</span>,
            sub: "Industry segments",
          },
          {
            label: "Stages",
            value: <span className="tabular-nums">{snapshot.totals.stages}</span>,
            sub: "Funding-stage buckets",
          },
          {
            label: "Visible companies",
            value: <span className="tabular-nums">{filteredStartups.length}</span>,
            sub: `${TECH_STARTUP_KIND_LABELS[resolvedState.kind]} filter`,
          },
          {
            label: "Visible raised",
            value: formatUsdCompact(visibleRaised),
            sub: "Funding in current table",
          },
        ]}
        pills={[
          { label: "By sector", href: "/tech-startup-tracker", icon: ChartBar },
          { label: "By stage", href: "/tech-startup-tracker?view=stage", icon: Briefcase },
          { label: "Top valuations", href: "/tech-startup-tracker?sort=valuation", icon: FileText },
        ]}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Startups tracked"
          value={snapshot.totals.startups.toString()}
          detail={`${snapshot.totals.sectors} sectors across ${snapshot.totals.stages} funding stages`}
        />
        <MetricCard
          label="Combined valuation"
          value={formatUsdCompact(snapshot.totals.totalValuation)}
          detail={`${snapshot.totals.unicornCount} companies valued at $1B+`}
        />
        <MetricCard
          label="Visible set"
          value={filteredStartups.length.toString()}
          detail={`${TECH_STARTUP_KIND_LABELS[resolvedState.kind]} filter, ${TECH_STARTUP_SORT_LABELS[resolvedState.sort].toLowerCase()} sort`}
        />
        <MetricCard
          label="Visible raised"
          value={formatUsdCompact(visibleRaised)}
          detail="Total disclosed funding in the current table"
        />
      </section>

      <section className="home-card space-y-5 p-5 sm:p-6" aria-label="Startup filters">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Group startups by"
            className="inline-flex rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-1"
          >
            {TECH_STARTUP_KIND_OPTIONS.map((kind) => {
              const isActive = resolvedState.kind === kind;
              const Icon = kind === "sector" ? Layers : TrendingUp;
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={isActive}
                  title={`Group startups by ${TECH_STARTUP_KIND_LABELS[kind].toLowerCase()}`}
                  onClick={() => setKind(kind)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color,box-shadow] ${
                    isActive
                      ? "bg-[var(--home-paper)] text-[var(--home-ink)] shadow-sm"
                      : "text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  <Icon aria-hidden="true" size={16} />
                  {TECH_STARTUP_KIND_LABELS[kind]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
              <ArrowDownUp aria-hidden="true" size={14} />
              Sort
            </span>
            {TECH_STARTUP_SORT_OPTIONS.map((sort) => {
              const isActive = resolvedState.sort === sort;
              return (
                <button
                  key={sort}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSort(sort)}
                  className={`min-h-[44px] rounded-full border px-3 text-sm font-semibold transition-[background-color,border-color,color] ${
                    isActive
                      ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                      : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                  }`}
                >
                  {TECH_STARTUP_SORT_LABELS[sort]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={resolvedState.segment === "all"}
            onClick={() => setSegment("all")}
            className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] ${
              resolvedState.segment === "all"
                ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
            }`}
          >
            All {TECH_STARTUP_KIND_LABELS[resolvedState.kind].toLowerCase()}s
          </button>
          {segments.map((segment) => {
            const isActive = resolvedState.segment === segment.key;
            return (
              <button
                key={segment.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSegment(segment.key)}
                className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] ${
                  isActive
                    ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                    : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                }`}
              >
                {segment.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {filteredStartups.length === 0 ? (
          <EmptyPanel
            title="No startups match this filter"
            description="Try switching segments or widening back to the full sector or stage view."
          />
        ) : (
          <StartupTable
            startups={filteredStartups}
            selectedStartupId={selectedStartup?.id ?? null}
            segmentLookup={segmentLookup}
            onToggleStartup={toggleStartup}
          />
        )}
        <SegmentSummary
          segments={segments}
          startups={snapshot.startups}
          selectedSegment={resolvedState.segment}
          onSelectSegment={setSegment}
        />
      </section>

      <section
        className="home-card flex items-start gap-3 p-5 text-sm leading-6 text-[var(--home-ink-muted)] sm:p-6"
        aria-label="Data disclosure"
      >
        <Info aria-hidden="true" className="mt-0.5 flex-shrink-0" size={18} />
        <p className="m-0">
          {snapshot.disclaimer}
          {!snapshot.verified
            ? " Figures have not been individually verified against a single dated source — treat them as directional."
            : ""}
        </p>
      </section>
    </div>
  );
}

interface StartupTableProps {
  startups: TechStartup[];
  selectedStartupId: string | null;
  segmentLookup: Map<string, TechStartupSegment>;
  onToggleStartup: (startupId: string) => void;
}

function StartupTable({
  startups,
  selectedStartupId,
  segmentLookup,
  onToggleStartup,
}: StartupTableProps) {
  return (
    <div className="home-card overflow-hidden p-0">
      <div className="scroll-shadow-x overflow-x-auto">
        <table className="min-w-[900px] border-collapse text-sm">
          <caption className="sr-only">
            Notable tech startups with valuation, total raised, latest funding
            round, and momentum score.
          </caption>
          <thead>
            <tr className="border-b border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
              <th scope="col" className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Startup
              </th>
              <th scope="col" className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Valuation
              </th>
              <th scope="col" className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Raised
              </th>
              <th scope="col" className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Latest round
              </th>
              <th scope="col" className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Site
              </th>
            </tr>
          </thead>
          <tbody>
            {startups.map((startup, index) => {
              const isExpanded = startup.id === selectedStartupId;
              const sectorLabel = segmentLookup.get(startup.sector)?.label ?? null;
              const stageLabel = segmentLookup.get(startup.stage)?.label ?? null;
              return (
                <StartupRow
                  key={startup.id}
                  startup={startup}
                  rank={index + 1}
                  isExpanded={isExpanded}
                  sectorLabel={sectorLabel}
                  stageLabel={stageLabel}
                  onToggle={() => onToggleStartup(startup.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StartupRowProps {
  startup: TechStartup;
  rank: number;
  isExpanded: boolean;
  sectorLabel: string | null;
  stageLabel: string | null;
  onToggle: () => void;
}

function StartupRow({
  startup,
  rank,
  isExpanded,
  sectorLabel,
  stageLabel,
  onToggle,
}: StartupRowProps) {
  const detailId = `tech-startup-row-${startup.id}`;

  return (
    <>
      {/* The row stays clickable for pointer users, but the accessible
          expand/collapse control is a real button on the name — role="button"
          on a <tr> breaks table semantics and nests the Visit link inside an
          interactive element. */}
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-[var(--home-rule)] transition-[background-color] hover:bg-[var(--home-paper-alt)]"
      >
        <td className="px-4 py-4 align-top">
          <div className="flex gap-3">
            <span className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-xs font-semibold text-[var(--home-ink-muted)]">
              {rank}
            </span>
            <div className="min-w-0">
              <p className="mb-1 max-w-none leading-5">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={isExpanded ? detailId : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                  }}
                  className="text-left font-semibold text-[var(--home-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                >
                  {startup.name}
                </button>
              </p>
              <p className="mb-0 line-clamp-2 max-w-[44rem] text-sm leading-6 text-[var(--home-ink-muted)]">
                {startup.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sectorLabel ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-2.5 py-0.5 text-xs font-semibold text-[var(--home-ink-muted)]">
                    {sectorLabel}
                  </span>
                ) : null}
                {stageLabel ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] px-2.5 py-0.5 text-xs text-[var(--home-ink-muted)]">
                    {stageLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-right align-top">
          <span className="font-mono text-base font-semibold text-[var(--home-ink)]">
            {formatUsdCompact(startup.valuation)}
          </span>
        </td>
        <td className="px-4 py-4 text-right align-top">
          <span className="font-mono font-semibold text-[var(--home-ink)]">
            {formatUsdCompact(startup.totalRaised)}
          </span>
        </td>
        <td className="px-4 py-4 align-top text-[var(--home-ink-muted)]">
          <span className="block font-semibold text-[var(--home-ink)]">
            {startup.lastRound.stage}
          </span>
          <span className="block text-xs">
            {formatUsdCompact(startup.lastRound.amount)} ·{" "}
            {formatRoundDate(startup.lastRound.date)}
          </span>
        </td>
        <td className="px-4 py-4 text-right align-top">
          <a
            href={startup.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--home-rule)] px-3 text-sm font-semibold text-[var(--home-ink)] transition-[background-color,border-color,color] hover:border-[var(--home-ink)] hover:bg-[var(--home-paper-alt)]"
          >
            Visit
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={detailId} className="border-b border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
          <td colSpan={5} className="px-4 py-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      <MapPin aria-hidden="true" size={12} />
                      Headquarters
                    </dt>
                    <dd className="m-0 mt-1 text-[var(--home-ink)]">
                      {startup.headquarters}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      <Building2 aria-hidden="true" size={12} />
                      Founded
                    </dt>
                    <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
                      {startup.founded}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      <Users aria-hidden="true" size={12} />
                      Employees
                    </dt>
                    <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
                      {startup.employees}
                    </dd>
                  </div>
                </dl>
                <div>
                  <p className="mb-2 inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    <Tags aria-hidden="true" size={12} />
                    Focus
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {startup.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-[var(--home-rule)] px-2.5 py-1 text-xs text-[var(--home-ink-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Notable investors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {startup.notableInvestors.map((investor) => (
                      <span
                        key={investor}
                        className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-2.5 py-1 text-xs font-semibold text-[var(--home-ink-muted)]"
                      >
                        {investor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Latest round
                  </dt>
                  <dd className="m-0 mt-1 text-[var(--home-ink)]">
                    {startup.lastRound.stage}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Round size
                  </dt>
                  <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
                    {formatUsdCompact(startup.lastRound.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Announced
                  </dt>
                  <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
                    {formatRoundDate(startup.lastRound.date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Momentum
                  </dt>
                  <dd className="m-0 mt-1 font-mono text-[var(--home-ink)]">
                    {startup.momentumScore.toFixed(1)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Round led by
                  </dt>
                  <dd className="m-0 mt-1 text-[var(--home-ink)]">
                    {startup.lastRound.leadInvestors.join(", ")}
                  </dd>
                </div>
              </dl>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

interface SegmentSummaryProps {
  segments: TechStartupSegment[];
  startups: TechStartup[];
  selectedSegment: string;
  onSelectSegment: (segment: string) => void;
}

function SegmentSummary({
  segments,
  startups,
  selectedSegment,
  onSelectSegment,
}: SegmentSummaryProps) {
  const startupById = new Map(startups.map((startup) => [startup.id, startup]));

  return (
    <aside className="home-card p-5 sm:p-6" aria-labelledby="tech-startup-segment-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="home-kicker mb-1">Segments</p>
          <h2 id="tech-startup-segment-heading" className="text-lg font-semibold text-[var(--home-ink)]">
            Snapshot leaders
          </h2>
        </div>
        <Activity aria-hidden="true" className="text-[var(--home-ink-muted)]" size={20} />
      </div>
      <div className="space-y-2">
        {segments.map((segment) => {
          const topStartup = segment.topStartupId
            ? startupById.get(segment.topStartupId)
            : null;
          const isActive = selectedSegment === segment.key;
          return (
            <button
              key={segment.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectSegment(segment.key)}
              className={`block min-h-[64px] w-full rounded-[0.75rem] border px-3 py-3 text-left transition-[background-color,border-color,color] ${
                isActive
                  ? "border-[var(--home-ink)] bg-[var(--home-paper-alt)]"
                  : "border-[var(--home-rule)] hover:border-[var(--home-ink)] hover:bg-[var(--home-paper-alt)]"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[var(--home-ink)]">
                  {segment.label}
                </span>
                <span className="font-mono text-sm text-[var(--home-ink)]">
                  {formatUsdCompact(segment.totalValuation)}
                </span>
              </span>
              <span className="mt-1 block text-xs text-[var(--home-ink-muted)]">
                {segment.startupCount}{" "}
                {segment.startupCount === 1 ? "company" : "companies"}
                {topStartup ? ` · ${topStartup.name}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
