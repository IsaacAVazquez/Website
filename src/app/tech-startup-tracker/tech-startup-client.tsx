"use client";

import { ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
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

  const sourceLine = `${snapshot.sourceLabel} · figures as of ${formatAsOf(snapshot.asOf)} · updated ${relativeUpdated}`;
  const segmentLabels = Object.fromEntries(
    [...segmentLookup].map(([id, segment]) => [id, segment.label])
  );

  return (
    <div className="ts-root">
      <div className="c97-shell c97-frame ts-page">
        <header className="ts-head">
          <h1 className="ts-title">Tech Startup Tracker</h1>
          <p className="ts-lede">
            I keep a curated read on notable private tech companies by sector and funding stage. The
            treemap sizes each one by its disclosed valuation, which shows how few companies
            hold most of the value.
          </p>
        </header>

        <section className="ts-map" aria-labelledby="ts-map-heading">
          {/* The treemap groups by sector in both views, so the heading does too. */}
          <h2 id="ts-map-heading" className="sr-only">
            Valuations by sector
          </h2>
          <div className="ts-map-head">
            {/* The sector and stage filters sit above the treemap they redraw,
                so a choice shows its result in the same view. Sort only
                reorders the table, so it stays with the table below. */}
            <section aria-label="Startup filters" className="ts-filters">
              <div role="group" aria-label="Group startups by" className="ts-switch ts-switch--pair">
                {TECH_STARTUP_KIND_OPTIONS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={resolvedState.kind === kind}
                    title={`Group startups by ${TECH_STARTUP_KIND_LABELS[kind].toLowerCase()}`}
                    onClick={() => setKind(kind)}
                  >
                    {TECH_STARTUP_KIND_LABELS[kind]}
                  </button>
                ))}
              </div>

              <div role="group" aria-label="Filter by segment" className="ts-switch">
                <button
                  type="button"
                  aria-pressed={resolvedState.segment === "all"}
                  onClick={() => setSegment("all")}
                >
                  All {TECH_STARTUP_KIND_LABELS[resolvedState.kind].toLowerCase()}s
                </button>
                {segments.map((segment) => (
                  <button
                    key={segment.key}
                    type="button"
                    aria-pressed={resolvedState.segment === segment.key}
                    onClick={() => setSegment(segment.key)}
                  >
                    {segment.label}
                  </button>
                ))}
              </div>
            </section>

            {/* The source and as-of date print once, here. The short notice is
                the only live region, and it links to the full notice under the
                table, since a disclaimer never goes inside a collapsed block. */}
            <div className="ts-source">
              <p className="ts-source-line">{sourceLine}</p>
              {sourceIsOverdue ? (
                <p className="ts-warn" role="status">
                  {snapshot.verified
                    ? "These figures are past their six-month review window."
                    : "These figures are curated and unverified."}
                </p>
              ) : null}
              <a href={`#${DATA_NOTICE_ID}`} className="ts-notice-link">
                Read the full notice
              </a>
            </div>
          </div>

          <ValuationTreemap
            startups={filteredStartups}
            selectedId={selectedStartup?.id ?? null}
            onSelect={toggleStartup}
            sectorLabels={segmentLabels}
          />
        </section>

        <section className="ts-list" aria-labelledby="ts-list-heading">
          <div className="ts-list-head">
            <h2 id="ts-list-heading" className="ts-h2">
              {filteredStartups.length} {filteredStartups.length === 1 ? "company" : "companies"}
            </h2>
            <div className="ts-sort">
              <span className="ts-label" aria-hidden="true">
                Sort
              </span>
              <div role="group" aria-label="Sort startups" className="ts-switch">
                {TECH_STARTUP_SORT_OPTIONS.map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    aria-pressed={resolvedState.sort === sort}
                    onClick={() => setSort(sort)}
                  >
                    {TECH_STARTUP_SORT_LABELS[sort]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredStartups.length === 0 ? (
            <div className="ts-empty">
              <p className="ts-empty-title">No startups match this filter</p>
              <p>Try switching segments or widening back to the full sector or stage view.</p>
            </div>
          ) : (
            <StartupTable
              startups={filteredStartups}
              selectedStartupId={selectedStartup?.id ?? null}
              segmentLookup={segmentLookup}
              onToggleStartup={toggleStartup}
            />
          )}

          <div id={DATA_NOTICE_ID} className="ts-notice">
            <h2 className="ts-h3">About these figures</h2>
            {sourceIsOverdue ? (
              <p>
                These private-company figures are{" "}
                {snapshot.verified ? "past their six-month review window" : "unverified"}. I keep
                them visible as directional research, not current financial facts.
              </p>
            ) : null}
            <p>
              {snapshot.disclaimer}
              {!snapshot.verified
                ? " Figures have not been individually verified against a single dated source, so treat them as directional."
                : ""}
            </p>
          </div>
        </section>
      </div>
    </div>
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
      <table className="c97-table ts-table">
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
          expand/collapse control is a real button on the name, since
          role="button" on a <tr> breaks table semantics and nests the Visit
          link inside an interactive element. */}
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
                    <dt className="c97-stat-label">
                      Headquarters
                    </dt>
                    <dd style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      {startup.headquarters}
                    </dd>
                  </div>
                  <div>
                    <dt className="c97-stat-label">
                      Founded
                    </dt>
                    <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      {startup.founded}
                    </dd>
                  </div>
                  <div>
                    <dt className="c97-stat-label">
                      Employees
                    </dt>
                    <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0", marginTop: "var(--c97-sp-0)" }}>
                      {startup.employees}
                    </dd>
                  </div>
                </dl>
                <div>
                  <p className="c97-stat-label" style={{ marginBottom: "var(--c97-sp-1)" }}>
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
