"use client";

import { startTransition, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownUp,
  Building2,
  ExternalLink,
  Layers,
  MapPin,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { formatUsdCompact, sortTechStartups } from "@/lib/techStartups";
import { relativeAge } from "@/lib/utils";
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
import { ValuationTreemap } from "./ValuationTreemap";
import "./tech-startup-tracker.css";

interface TechStartupClientProps {
  initialState: TechStartupRouteState;
  snapshot: TechStartupSnapshot;
}

const ROUND_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

function formatRoundDate(yearMonth: string): string {
  const date = new Date(`${yearMonth.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return yearMonth;
  return ROUND_FORMATTER.format(date);
}

function getSegments(snapshot: TechStartupSnapshot, kind: TechStartupSegmentKind): TechStartupSegment[] {
  return kind === "sector" ? snapshot.sectors : snapshot.stages;
}

function buildSegmentLookup(snapshot: TechStartupSnapshot) {
  return new Map(
    [...snapshot.sectors, ...snapshot.stages].map((segment) => [segment.key, segment])
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

export function TechStartupClient({ initialState, snapshot }: TechStartupClientProps) {
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

  // relativeAge() reads Date.now(), so the SSR markup and the first client
  // render can disagree by a minute. Compute it only after mount and render a
  // stable placeholder pre-mount so the hero meta stays hydration-safe.
  const [relativeUpdated, setRelativeUpdated] = useState("recently");
  const [sourceIsOverdue, setSourceIsOverdue] = useState(!snapshot.verified);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Compute the relative timestamp only after mount to avoid SSR/client hydration drift
    setRelativeUpdated(relativeAge(snapshot.generatedAt));
  }, [snapshot.generatedAt]);
  useEffect(() => {
    const sourceAgeMs = Date.now() - Date.parse(snapshot.asOf);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Freshness depends on the browser clock and must not create unstable SSR markup
    setSourceIsOverdue(
      !snapshot.verified ||
        !Number.isFinite(sourceAgeMs) ||
        sourceAgeMs > 180 * 24 * 60 * 60 * 1000
    );
  }, [snapshot.asOf, snapshot.verified]);

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
      selectedStartupId: resolvedState.selectedStartupId === startupId ? null : startupId,
    });
  }

  const lead = PROJECT_PRESS[TECH_STARTUP_ROUTE].lead;
  const standfirst =
    "I keep a curated, unverified read on notable private tech companies, grouped by sector and funding stage, and I wanted the treemap to do what a sorted table never can, which is show how concentrated the valuations actually are. A handful of companies worth well over $100B eat most of the space here, and everything else compresses down next to them.";
  const meta = `${snapshot.sourceLabel} · figures as of ${formatRoundDate(snapshot.asOf)} · updated ${relativeUpdated}`;

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Tech Startup Tracker"
        standfirst={standfirst}
        meta={meta}
        readouts={[
          {
            label: "Startups tracked",
            value: `${snapshot.totals.startups}`,
            detail: `${snapshot.totals.sectors} sectors, ${snapshot.totals.stages} stages`,
          },
          {
            label: "Combined valuation",
            value: formatUsdCompact(snapshot.totals.totalValuation),
            detail: `${formatUsdCompact(snapshot.totals.totalRaised)} total raised`,
          },
          {
            label: "Unicorns",
            value: `${snapshot.totals.unicornCount}`,
            detail: "valued at $1B or more",
          },
        ]}
      >
        <ValuationTreemap
          startups={filteredStartups}
          selectedId={selectedStartup?.id ?? null}
          onSelect={toggleStartup}
          sectorLabels={Object.fromEntries([...segmentLookup].map(([id, segment]) => [id, segment.label]))}
        />
      </Catalog97ProjectHero>

      <div className="c97-band" data-c97-surface="paper">
        <div className="c97-shell" style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
          {sourceIsOverdue ? (
            <p className="c97-prose" role="status" style={{ color: "var(--c97-warning)", fontSize: "var(--c97-fs-small)" }}>
              These private-company figures are past the review window or still
              unverified. I keep them visible as directional research, not current
              financial facts.
            </p>
          ) : null}
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
            {snapshot.disclaimer}
            {!snapshot.verified
              ? " Figures have not been individually verified against a single dated source, so treat them as directional."
              : ""}
          </p>
        </div>
      </div>

      <section
        className="c97-band c97-sheet"
        data-c97-surface="bone"
        data-seam="torn"
        aria-label="Startup filters"
      >
        <div className="c97-shell" style={{ display: "grid", gap: "var(--c97-sp-5)" }}>
          <h2 className="c97-poster-sm">The list</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div role="group" aria-label="Group startups by" className="c97-segmented">
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
                    className="min-h-[44px]"
                  >
                    <Icon aria-hidden="true" size={16} />
                    {TECH_STARTUP_KIND_LABELS[kind]}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="c97-kicker" style={{ marginBottom: 0 }}>
                <ArrowDownUp aria-hidden="true" size={14} style={{ display: "inline", marginRight: "4px" }} />
                Sort
              </span>
              <div className="c97-segmented">
                {TECH_STARTUP_SORT_OPTIONS.map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    aria-pressed={resolvedState.sort === sort}
                    onClick={() => setSort(sort)}
                    className="min-h-[44px]"
                  >
                    {TECH_STARTUP_SORT_LABELS[sort]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="c97-segmented">
            <button
              type="button"
              aria-pressed={resolvedState.segment === "all"}
              onClick={() => setSegment("all")}
              className="min-h-[44px]"
            >
              All {TECH_STARTUP_KIND_LABELS[resolvedState.kind].toLowerCase()}s
            </button>
            {segments.map((segment) => (
              <button
                key={segment.key}
                type="button"
                aria-pressed={resolvedState.segment === segment.key}
                onClick={() => setSegment(segment.key)}
                className="min-h-[44px]"
              >
                {segment.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="deckle">
        <div className="c97-shell">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
          </div>
        </div>
      </section>
    </>
  );
}

interface StartupTableProps {
  startups: TechStartup[];
  selectedStartupId: string | null;
  segmentLookup: Map<string, TechStartupSegment>;
  onToggleStartup: (startupId: string) => void;
}

function StartupTable({ startups, selectedStartupId, segmentLookup, onToggleStartup }: StartupTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="c97-table" style={{ minWidth: "820px" }}>
        <caption className="sr-only">
          Notable tech startups with valuation, total raised, latest funding round, and
          momentum score.
        </caption>
        <thead>
          <tr>
            <th scope="col">Startup</th>
            <th scope="col" data-align="end">
              Valuation
            </th>
            <th scope="col" data-align="end">
              Raised
            </th>
            <th scope="col">Latest round</th>
            <th scope="col" data-align="end">
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

function StartupRow({ startup, rank, isExpanded, sectorLabel, stageLabel, onToggle }: StartupRowProps) {
  const detailId = `tech-startup-row-${startup.id}`;

  return (
    <>
      {/* The row stays clickable for pointer users, but the accessible
          expand/collapse control is a real button on the name — role="button"
          on a <tr> breaks table semantics and nests the Visit link inside an
          interactive element. */}
      <tr onClick={onToggle} style={{ cursor: "pointer" }}>
        <td>
          <div className="flex gap-3">
            <span
              className="c97-mono"
              style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}
            >
              {rank}
            </span>
            <div className="min-w-0">
              <p className="mb-1">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={isExpanded ? detailId : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                  }}
                  className="c97-serif text-left"
                  style={{ fontWeight: 600, color: "var(--c97-ink)" }}
                >
                  {startup.name}
                </button>
              </p>
              <p className="mb-0 line-clamp-2" style={{ color: "var(--c97-ink-2)", maxWidth: "44rem" }}>
                {startup.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sectorLabel ? <span className="c97-chip">{sectorLabel}</span> : null}
                {stageLabel ? <span className="c97-chip">{stageLabel}</span> : null}
              </div>
            </div>
          </div>
        </td>
        <td data-align="end">
          <span className="c97-mono" style={{ fontWeight: 600 }}>
            {formatUsdCompact(startup.valuation)}
          </span>
        </td>
        <td data-align="end">
          <span className="c97-mono" style={{ fontWeight: 600 }}>
            {formatUsdCompact(startup.totalRaised)}
          </span>
        </td>
        <td style={{ color: "var(--c97-ink-2)" }}>
          <span className="block" style={{ fontWeight: 600, color: "var(--c97-ink)" }}>
            {startup.lastRound.stage}
          </span>
          <span className="block" style={{ fontSize: "var(--c97-fs-small)" }}>
            {formatUsdCompact(startup.lastRound.amount)} · {formatRoundDate(startup.lastRound.date)}
          </span>
        </td>
        <td data-align="end">
          <a
            href={startup.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex min-h-[44px] items-center gap-2"
            style={{ color: "var(--c97-ink)" }}
          >
            Visit
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={detailId}>
          <td colSpan={5}>
            <div
              className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]"
              style={{ padding: "var(--c97-sp-3) 0" }}
            >
              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
                  <div>
                    <dt className="c97-stat-label inline-flex items-center gap-1">
                      <MapPin aria-hidden="true" size={12} />
                      Headquarters
                    </dt>
                    <dd className="m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
                      {startup.headquarters}
                    </dd>
                  </div>
                  <div>
                    <dt className="c97-stat-label inline-flex items-center gap-1">
                      <Building2 aria-hidden="true" size={12} />
                      Founded
                    </dt>
                    <dd className="c97-mono m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
                      {startup.founded}
                    </dd>
                  </div>
                  <div>
                    <dt className="c97-stat-label inline-flex items-center gap-1">
                      <Users aria-hidden="true" size={12} />
                      Employees
                    </dt>
                    <dd className="c97-mono m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
                      {startup.employees}
                    </dd>
                  </div>
                </dl>
                <div>
                  <p className="c97-stat-label mb-2 inline-flex items-center gap-1">
                    <Tags aria-hidden="true" size={12} />
                    Focus
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {startup.tags.map((tag) => (
                      <span key={tag} className="c97-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="c97-stat-label mb-2">Notable investors</p>
                  <div className="flex flex-wrap gap-2">
                    {startup.notableInvestors.map((investor) => (
                      <span key={investor} className="c97-chip">
                        {investor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
                <div>
                  <dt className="c97-stat-label">Latest round</dt>
                  <dd className="m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
                    {startup.lastRound.stage}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Round size</dt>
                  <dd className="c97-mono m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
                    {formatUsdCompact(startup.lastRound.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Announced</dt>
                  <dd className="c97-mono m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
                    {formatRoundDate(startup.lastRound.date)}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Momentum</dt>
                  <dd className="c97-mono m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
                    {startup.momentumScore.toFixed(1)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="c97-stat-label">Round led by</dt>
                  <dd className="m-0 mt-1" style={{ color: "var(--c97-ink)" }}>
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

function SegmentSummary({ segments, startups, selectedSegment, onSelectSegment }: SegmentSummaryProps) {
  const startupById = new Map(startups.map((startup) => [startup.id, startup]));

  return (
    <aside className="c97-panel" aria-labelledby="tech-startup-segment-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="c97-kicker mb-1">Segments</p>
          <h2
            id="tech-startup-segment-heading"
            className="c97-serif"
            style={{ fontSize: "var(--c97-fs-h3)" }}
          >
            Snapshot leaders
          </h2>
        </div>
        <Activity aria-hidden="true" style={{ color: "var(--c97-ink-2)" }} size={20} />
      </div>
      <div className="space-y-2">
        {segments.map((segment) => {
          const topStartup = segment.topStartupId ? startupById.get(segment.topStartupId) : null;
          const isActive = selectedSegment === segment.key;
          return (
            <button
              key={segment.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectSegment(segment.key)}
              className={`block min-h-[64px] w-full text-left ${isActive ? "c97-offset" : ""}`}
              style={{
                background: "var(--c97-surface)",
                padding: "var(--c97-sp-2) var(--c97-sp-3)",
                border: `1px solid ${isActive ? "var(--c97-ink)" : "var(--c97-rule)"}`,
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span style={{ fontWeight: 600, color: "var(--c97-ink)" }}>{segment.label}</span>
                <span className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                  {formatUsdCompact(segment.totalValuation)}
                </span>
              </span>
              <span className="mt-1 block" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}>
                {segment.startupCount} {segment.startupCount === 1 ? "company" : "companies"}
                {topStartup ? ` · ${topStartup.name}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
