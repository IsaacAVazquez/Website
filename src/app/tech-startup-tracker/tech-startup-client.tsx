"use client";

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
import { useSearchParams } from "next/navigation";
import { EmptyPanel } from "@/components/football/EmptyPanel";
import {
  Catalog97HeroReadouts,
  Catalog97ProjectHero,
} from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { useClientNow } from "@/hooks/useClientNow";
import { formatUsdCompact, sortTechStartups } from "@/lib/techStartups";
import { relativeAge } from "@/lib/utils";
import { DATE_ONLY_TIME_ZONE, formatDateTime } from "@/lib/date-formatters";
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
import { useRouteSync } from "@/hooks/useRouteSync";

interface TechStartupClientProps {
  initialState: TechStartupRouteState;
  snapshot: TechStartupSnapshot;
}

// yearMonth is a date-only "YYYY-MM" value, so it's pinned to UTC to keep
// its calendar month instead of rolling back a day in western zones.
const ROUND_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});

// asOf is a date-only "YYYY-MM-DD" value, pinned to UTC for the same reason.
const AS_OF_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});

const DATA_NOTICE_ID = "startup-data-notice";
const REVIEW_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

function formatRoundDate(yearMonth: string): string {
  const date = new Date(`${yearMonth.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return yearMonth;
  return ROUND_FORMATTER.format(date);
}

/** The full as-of date, or the value as given when it is not a date. */
function formatAsOf(asOf: string): string {
  const date = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return asOf;
  return AS_OF_FORMATTER.format(date);
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
  const desiredHref = buildTechStartupHref(resolvedState, searchParams);

  const pushHref = useRouteSync(TECH_STARTUP_ROUTE, desiredHref);

  // `now` is null on the server and during hydration, so the age prints as
  // an absolute time first and the review window reads as still open until
  // the browser clock can say otherwise.
  const now = useClientNow();
  const relativeUpdated =
    now === null ? formatDateTime(snapshot.generatedAt) : relativeAge(snapshot.generatedAt, now);
  const sourceIsOverdue =
    !snapshot.verified ||
    (now !== null && !(now - Date.parse(snapshot.asOf) <= REVIEW_WINDOW_MS));

  function navigate(nextState: TechStartupRouteState) {
    const resolvedNext = resolveTechStartupState(nextState, snapshot);
    const href = buildTechStartupHref(resolvedNext, searchParams);
    pushHref(href);
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
    "I keep a curated, unverified read on notable private tech companies, grouped by sector and funding stage, and the treemap shows how concentrated the valuations actually are, since the few companies valued above $100B take up most of the space.";
  const meta = `${snapshot.sourceLabel} · figures as of ${formatAsOf(snapshot.asOf)} · updated ${relativeUpdated}`;
  const disclosedValuations = snapshot.startups.filter((startup) => startup.valuation !== null).length;

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Tech Startup Tracker"
        standfirst={standfirst}
        meta={meta}
      >
        {/* The sector and stage filters sit above the treemap they redraw, so
            a choice shows its result in the same view. Sort only reorders the
            table, so it stays with the table below. The three figures print
            after the treemap, which keeps the first filter a screen higher on
            a phone. */}
        <div className="flex flex-col" style={{ gap: "var(--c97-sp-4)" }}>
          <section
            aria-label="Startup filters"
            className="flex flex-col"
            style={{ gap: "var(--c97-sp-3)" }}
          >
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

            <div role="group" aria-label="Filter by segment" className="c97-segmented">
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
          </section>

          <ValuationTreemap
            startups={filteredStartups}
            selectedId={selectedStartup?.id ?? null}
            onSelect={toggleStartup}
            sectorLabels={Object.fromEntries([...segmentLookup].map(([id, segment]) => [id, segment.label]))}
          />

          <Catalog97HeroReadouts
            readouts={[
              {
                label: "Startups tracked",
                value: `${snapshot.totals.startups}`,
                detail: `${snapshot.totals.sectors} sectors, ${snapshot.totals.stages} stages`,
              },
              {
                label: "Combined valuation",
                value: formatUsdCompact(snapshot.totals.totalValuation),
                detail: `across the ${disclosedValuations} of ${snapshot.totals.startups} with a disclosed valuation · ${formatUsdCompact(snapshot.totals.totalRaised)} total raised`,
              },
              {
                label: "Unicorns",
                value: `${snapshot.totals.unicornCount}`,
                detail: "valued at $1B or more",
              },
            ]}
          />
        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell flex flex-col" style={{ gap: "var(--c97-sp-3)" }}>
          <div className="flex flex-wrap items-center justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <h2 className="c97-poster-sm">The list</h2>
            <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <span className="c97-kicker" style={{ marginBottom: 0 }}>
                <ArrowDownUp aria-hidden="true" size={14} style={{ display: "inline", marginRight: "4px" }} />
                Sort
              </span>
              <div role="group" aria-label="Sort startups" className="c97-segmented">
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

          {/* The short form of the data notice sits beside the figures. The
              full notice prints in the open under the list, since a
              disclaimer never goes inside a collapsed block. */}
          <div className="flex flex-wrap items-center" style={{ columnGap: "var(--c97-sp-2)" }}>
            {sourceIsOverdue ? (
              <p
                className="c97-prose"
                role="status"
                style={{ color: "var(--c97-warning)", fontSize: "var(--c97-fs-small)" }}
              >
                {snapshot.verified
                  ? "These figures are past their six-month review window."
                  : "These figures are curated and unverified."}
              </p>
            ) : (
              <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                Curated figures as of {formatAsOf(snapshot.asOf)}.
              </p>
            )}
            <a href={`#${DATA_NOTICE_ID}`} className="c97-btn-ghost">
              Read the full notice
            </a>
          </div>

          <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]" style={{ gap: "var(--c97-sp-3)" }}>
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

          <div
            id={DATA_NOTICE_ID}
            className="flex flex-col"
            style={{ gap: "var(--c97-sp-1)", scrollMarginTop: "var(--c97-sp-6)" }}
          >
            <h2 className="c97-serif c97-h3">About these figures</h2>
            {sourceIsOverdue ? (
              <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                These private-company figures are{" "}
                {snapshot.verified ? "past their six-month review window" : "unverified"}. I keep
                them visible as directional research, not current financial facts.
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
    <div className="overflow-x-auto" role="region" aria-label="Startup table (scrolls sideways)" tabIndex={0}>
      {/* Below lg the table prints the company and its valuation, and the
          other columns move into the row's expansion. */}
      <table className="c97-table lg:min-w-[820px]">
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
            <th scope="col" data-align="end" className="hidden lg:table-cell">
              Raised
            </th>
            <th scope="col" className="hidden lg:table-cell">Latest round</th>
            <th scope="col" data-align="end" className="hidden lg:table-cell">
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
          <div className="flex" style={{ gap: "var(--c97-sp-1)" }}>
            <span
              className="c97-mono"
              style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)" }}
            >
              {rank}
            </span>
            <div className="min-w-0">
              <p style={{ marginBottom: "var(--c97-sp-0)" }}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={isExpanded ? detailId : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                  }}
                  className="c97-serif inline-flex min-h-[44px] items-center text-left"
                  style={{ fontWeight: 600, color: "var(--c97-ink)", overflowWrap: "anywhere" }}
                >
                  {startup.name}
                </button>
              </p>
              <p className="line-clamp-1 lg:line-clamp-2" style={{ color: "var(--c97-ink-2)", maxWidth: "44rem", marginBottom: "0" }}>
                {startup.description}
              </p>
              <div className="hidden flex-wrap lg:flex" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-0)" }}>
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
        <td data-align="end" className="hidden lg:table-cell">
          <span className="c97-mono" style={{ fontWeight: 600 }}>
            {formatUsdCompact(startup.totalRaised)}
          </span>
        </td>
        <td style={{ color: "var(--c97-ink-2)" }} className="hidden lg:table-cell">
          <span className="block" style={{ fontWeight: 600, color: "var(--c97-ink)" }}>
            {startup.lastRound.stage}
          </span>
          <span className="block" style={{ fontSize: "var(--c97-fs-small)" }}>
            {formatUsdCompact(startup.lastRound.amount)} · {formatRoundDate(startup.lastRound.date)}
          </span>
        </td>
        <td data-align="end" className="hidden lg:table-cell">
          <a
            href={startup.website}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex min-h-[44px] items-center"
            style={{ gap: "var(--c97-sp-1)", color: "var(--c97-ink)" }}
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
              className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]"
              style={{ gap: "var(--c97-sp-2)", padding: "var(--c97-sp-3) 0" }}
            >
              <div className="flex flex-col" style={{ gap: "var(--c97-sp-2)" }}>
                {/* The sector and stage chips, the total raised, and the site
                    link print here only under lg, where the row hides them. */}
                <div className="flex flex-wrap lg:hidden" style={{ gap: "var(--c97-sp-0)" }}>
                  {sectorLabel ? <span className="c97-chip">{sectorLabel}</span> : null}
                  {stageLabel ? <span className="c97-chip">{stageLabel}</span> : null}
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-3" style={{ rowGap: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)" }}>
                  <div className="lg:hidden">
                    <dt className="c97-stat-label">Total raised</dt>
                    <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      {formatUsdCompact(startup.totalRaised)}
                    </dd>
                  </div>
                  <div>
                    <dt className="c97-stat-label inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                      <MapPin aria-hidden="true" size={12} />
                      Headquarters
                    </dt>
                    <dd style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      {startup.headquarters}
                    </dd>
                  </div>
                  <div>
                    <dt className="c97-stat-label inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                      <Building2 aria-hidden="true" size={12} />
                      Founded
                    </dt>
                    <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      {startup.founded}
                    </dd>
                  </div>
                  <div>
                    <dt className="c97-stat-label inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                      <Users aria-hidden="true" size={12} />
                      Employees
                    </dt>
                    <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      {startup.employees}
                    </dd>
                  </div>
                </dl>
                <div>
                  <p className="c97-stat-label inline-flex items-center" style={{ marginBottom: "var(--c97-sp-1)", gap: "var(--c97-sp-0)" }}>
                    <Tags aria-hidden="true" size={12} />
                    Focus
                  </p>
                  <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                    {startup.tags.map((tag) => (
                      <span key={tag} className="c97-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="c97-stat-label" style={{ marginBottom: "var(--c97-sp-1)" }}>Notable investors</p>
                  <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                    {startup.notableInvestors.map((investor) => (
                      <span key={investor} className="c97-chip">
                        {investor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-2" style={{ rowGap: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)" }}>
                <div>
                  <dt className="c97-stat-label">Latest round</dt>
                  <dd style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                    {startup.lastRound.stage}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Round size</dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                    {formatUsdCompact(startup.lastRound.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Announced</dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                    {formatRoundDate(startup.lastRound.date)}
                  </dd>
                </div>
                <div>
                  <dt className="c97-stat-label">Momentum</dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                    {startup.momentumScore.toFixed(1)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="c97-stat-label">Round led by</dt>
                  <dd style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                    {startup.lastRound.leadInvestors.join(", ") || "No lead named"}
                  </dd>
                </div>
                {startup.lastRound.sourceUrl ? (
                  <div className="col-span-2">
                    <dt className="c97-stat-label">Round source</dt>
                    <dd style={{ margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      <a
                        href={startup.lastRound.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="c97-link inline-flex min-h-[44px] items-center" style={{ gap: "var(--c97-sp-1)" }}
                      >
                        {new URL(startup.lastRound.sourceUrl).hostname.replace(/^www\./, "")}
                        <ExternalLink aria-hidden="true" size={14} />
                      </a>
                    </dd>
                  </div>
                ) : null}
                <div className="col-span-2 lg:hidden">
                  <dt className="c97-stat-label">Site</dt>
                  <dd style={{ margin: "0", marginTop: "var(--c97-sp-0)" }}>
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noreferrer"
                      className="c97-link inline-flex min-h-[44px] items-center"
                      style={{ gap: "var(--c97-sp-1)" }}
                    >
                      Visit
                      <ExternalLink aria-hidden="true" size={14} />
                    </a>
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
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
        <div>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Segments</p>
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
      <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
        {segments.map((segment) => {
          const topStartup = segment.topStartupId ? startupById.get(segment.topStartupId) : null;
          const isActive = selectedSegment === segment.key;
          return (
            <button
              key={segment.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectSegment(segment.key)}
              className={`c97-segment-leader block min-h-[64px] w-full text-left ${isActive ? "c97-offset" : ""}`}
              style={{
                background: "var(--c97-surface)",
                padding: "var(--c97-sp-2) var(--c97-sp-3)",
                border: `1px solid ${isActive ? "var(--c97-ink)" : "var(--c97-rule)"}`,
              }}
            >
              <span className="flex items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                <span className="c97-segment-leader-name" style={{ fontWeight: 600 }}>{segment.label}</span>
                <span className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                  {formatUsdCompact(segment.totalValuation)}
                </span>
              </span>
              <span className="block" style={{ color: "var(--c97-ink-2)", fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-0)" }}>
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
