"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import { Activity, AlertTriangle, ExternalLink, Layers3 } from "lucide-react";
import type {
  EarthquakeRouteState,
  EarthquakeSummary,
  EarthquakeView,
  QuakeEvent,
} from "@/types/earthquake";
import {
  buildEarthquakeHref,
  EARTHQUAKE_ROUTE,
  EARTHQUAKE_VIEW_LABELS,
  EARTHQUAKE_VIEW_OPTIONS,
  normalizeEarthquakeState,
} from "./earthquake-state";
import { EarthquakeSignature, EpicentrePlot } from "./EarthquakeSignature";
import { seismogramSpikes } from "./seismogram";
import { useClientNow } from "@/hooks/useClientNow";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
import "./earthquake-pulse.css";
import { useRouteSync } from "@/hooks/useRouteSync";
import { formatStableDateTime } from "@/lib/date-formatters";

interface EarthquakeClientProps {
  initialState: EarthquakeRouteState;
  summary: EarthquakeSummary;
}

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

// USGS reports quake time in UTC and the row already labels it "UTC", so this
// stays pinned to UTC rather than the display zone. `hourCycle` rather than
// `hour12: false`, which prints midnight as "24:05" on Node 20 and "00:05" in
// browsers.
const CLOCK_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

// The UTC day the clock above belongs to, for a list that runs past one day.
const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

function formatMagnitude(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `M${value.toFixed(1)}`;
}

function formatTimeAgo(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "Unknown";
  }
  const diffMs = then - now;
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 60) {
    return RELATIVE_FORMATTER.format(diffMin, "minute");
  }
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) {
    return RELATIVE_FORMATTER.format(diffHr, "hour");
  }
  return RELATIVE_FORMATTER.format(Math.round(diffHr / 24), "day");
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) {
    return "Unavailable";
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : `${formatStableDateTime(TIME_FORMATTER, date)} UTC`;
}

function formatDepth(depthKm: number): string {
  return `${Math.round(depthKm)} km`;
}

function depthLabel(depthKm: number): string {
  if (depthKm < 70) return "Shallow";
  if (depthKm < 300) return "Intermediate";
  return "Deep";
}

function formatCoordinates(lat: number, lon: number): string {
  const ns = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
  const ew = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
  return `${ns}, ${ew}`;
}

/** Seismic intensity ramp — neutral at the low end, red at the top. */
function magnitudeColor(mag: number): string {
  if (mag >= 7) return "var(--c97-negative)";
  if (mag >= 6)
    return "color-mix(in srgb, var(--c97-negative) 70%, var(--c97-warning))";
  if (mag >= 5) return "var(--c97-warning)";
  if (mag >= 4)
    return "color-mix(in srgb, var(--c97-warning) 65%, var(--c97-ink-2))";
  return "var(--c97-ink-2)";
}

function magnitudeTint(mag: number): string {
  const base = magnitudeColor(mag);
  return `color-mix(in srgb, ${base} 12%, var(--c97-field))`;
}

function getRowStyle(isSelected: boolean, mag: number): CSSProperties {
  if (isSelected) {
    return {
      background: magnitudeTint(mag),
      borderColor: `color-mix(in srgb, ${magnitudeColor(mag)} 36%, var(--c97-rule))`,
    };
  }

  return {
    background: "transparent",
    borderColor: "var(--c97-rule)",
  };
}

function MagnitudeBadge({ mag }: { mag: number }) {
  return (
    <span
      className="inline-flex min-w-[58px] flex-col items-center justify-center border"
      style={{
        paddingInline: "var(--c97-sp-1)",
        paddingBlock: "var(--c97-sp-1)",
        borderColor: `color-mix(in srgb, ${magnitudeColor(mag)} 38%, var(--c97-rule))`,
        background: magnitudeTint(mag),
      }}
    >
      <span
        className="text-xl leading-none tabular-nums"
        style={{
          fontFamily: "var(--c97-font-body)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: magnitudeColor(mag),
        }}
      >
        {mag.toFixed(1)}
      </span>
      <span
        className="text-3xs uppercase tracking-[0.14em]"
        style={{ color: "var(--c97-ink-2)", fontFamily: "var(--c97-font-body)", marginTop: "var(--c97-sp-0)" }}
      >
        Mag
      </span>
    </span>
  );
}

function QuakeRow({
  quake,
  isSelected,
  isOpen,
  showDate,
  onSelect,
  now,
}: {
  quake: QuakeEvent;
  /** The quake marked on the trace and the plot, which is the newest one until another is picked. */
  isSelected: boolean;
  /** Whether this row's detail is printed under it. */
  isOpen: boolean;
  /** The 24-hour log reads on the clock alone; a longer list needs the day too. */
  showDate: boolean;
  onSelect: (id: string) => void;
  now: number | null;
}) {
  const time = new Date(quake.time);
  return (
    <button
      type="button"
      onClick={() => onSelect(quake.id)}
      aria-expanded={isOpen}
      data-selected={isSelected || undefined}
      className="eq-quake-log-row"
      style={getRowStyle(isSelected, quake.magnitude)}
    >
      <span className="eq-quake-log-time">
        {showDate ? <span>{DAY_FORMATTER.format(time)}</span> : null}
        {CLOCK_FORMATTER.format(time)} UTC
        {now !== null ? (
          <span className="eq-quake-log-ago">{formatTimeAgo(quake.time, now)}</span>
        ) : null}
      </span>
      <MagnitudeBadge mag={quake.magnitude} />
      <span className="eq-quake-log-place">
        <span className="eq-quake-log-name">{quake.place}</span>
        {quake.tsunami || quake.felt ? (
          <span className="eq-quake-log-flags">
            {quake.tsunami ? (
              <span className="inline-flex items-center" style={{ color: "var(--c97-negative)", fontWeight: 600, gap: "var(--c97-sp-0)" }}>
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Tsunami
              </span>
            ) : null}
            {quake.felt ? (
              <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                {quake.felt.toLocaleString("en-US")} felt
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <span className="eq-quake-log-depth">
        <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
        {formatDepth(quake.depthKm)}
      </span>
    </button>
  );
}

function DistributionBars({ summary }: { summary: EarthquakeSummary }) {
  const maxCount = Math.max(1, ...summary.magnitudeBuckets.map((b) => b.count));
  return (
    <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
      {summary.magnitudeBuckets.map((bucket) => {
        // Anchor the bar color to the middle of the band.
        const anchorMag =
          bucket.tier === "minor"
            ? 3
            : bucket.tier === "great"
            ? 8
            : Number(bucket.range.split("–")[0]);
        const widthPct = Math.round((bucket.count / maxCount) * 100);
        return (
          <div key={bucket.tier} className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
            <span
              className="w-24 shrink-0 text-sm"
              style={{ color: "var(--c97-ink)", fontFamily: "var(--c97-font-body)" }}
            >
              {bucket.label}
              <span
                className="text-xs"
                style={{ color: "var(--c97-ink-2)", marginLeft: "var(--c97-sp-0)" }}
              >
                {bucket.range}
              </span>
            </span>
            <span
              className="relative h-7 flex-1 overflow-hidden"
              style={{ background: "var(--c97-field)" }}
            >
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.max(widthPct, bucket.count > 0 ? 6 : 0)}%`,
                  background: magnitudeColor(anchorMag),
                  opacity: 0.85,
                }}
              />
            </span>
            <span
              className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              style={{ color: "var(--c97-ink)", fontFamily: "var(--c97-font-body)" }}
            >
              {bucket.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RegionList({
  summary,
  onSelect,
  openQuakeId,
  now,
}: {
  summary: EarthquakeSummary;
  onSelect: (id: string) => void;
  openQuakeId: string | null;
  now: number | null;
}) {
  if (summary.regions.length === 0) {
    return <p className="eq-muted">No region logged a magnitude 2.5 or larger quake in the past seven days.</p>;
  }
  const maxCount = Math.max(1, ...summary.regions.map((r) => r.count));
  return (
    <div className="eq-regions">
      {summary.regions.map((region) => {
        const widthPct = Math.round((region.count / maxCount) * 100);
        const clickable = Boolean(region.strongestId);
        const content = (
          <>
            <span className="flex items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
              <span
                className="eq-region-name truncate text-base font-semibold"
                style={{ fontFamily: "var(--c97-font-body)" }}
              >
                {region.region}
              </span>
              <span
                className="shrink-0 text-sm"
                style={{ color: magnitudeColor(region.maxMagnitude), fontWeight: 600 }}
              >
                peak {formatMagnitude(region.maxMagnitude)}
              </span>
            </span>
            <span className="flex items-center" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
              <span
                className="relative h-2 flex-1 overflow-hidden"
                style={{ background: "var(--c97-field)" }}
              >
                <span
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${Math.max(widthPct, 6)}%`,
                    background: magnitudeColor(region.maxMagnitude),
                    opacity: 0.8,
                  }}
                />
              </span>
              <span
                className="c97-tabular w-16 shrink-0 text-right text-sm"
                style={{ color: "var(--c97-ink-2)", fontFamily: "var(--c97-font-body)" }}
              >
                {region.count} quake{region.count === 1 ? "" : "s"}
              </span>
            </span>
          </>
        );

        return clickable ? (
          <Fragment key={region.region}>
            <button
              type="button"
              onClick={() => onSelect(region.strongestId!)}
              aria-expanded={region.strongestId === openQuakeId}
              className="eq-region"
            >
              {content}
            </button>
            {region.strongestId === openQuakeId ? (
              <InlineQuakeDetail quake={summary.quakeDetails[region.strongestId!] ?? null} now={now} />
            ) : null}
          </Fragment>
        ) : (
          <div key={region.region} className="eq-region">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function QuakeDetailPanel({ quake, now }: { quake: QuakeEvent | null; now: number | null }) {
  if (!quake) {
    return <p className="eq-muted">Select a quake to see depth, felt reports, and coordinates.</p>;
  }

  return (
    <>
      <div className="eq-detail-head">
        <div className="min-w-0">
          <h3 className="eq-detail-title">{quake.place}</h3>
          <p className="eq-muted eq-small">
            {formatTimestamp(quake.time)}
            {now !== null ? <> · {formatTimeAgo(quake.time, now)}</> : null}
          </p>
        </div>
        <span className="eq-detail-mag" style={{ color: magnitudeColor(quake.magnitude) }}>
          {formatMagnitude(quake.magnitude)}
        </span>
      </div>

      {quake.tsunami ? (
        <p className="eq-tsunami" role="note">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Tsunami evaluation issued for this event
        </p>
      ) : null}

      <dl className="eq-detail-list">
        <div><dt>Depth</dt><dd>{`${formatDepth(quake.depthKm)} · ${depthLabel(quake.depthKm)}`}</dd></div>
        <div><dt>Region</dt><dd>{quake.region}</dd></div>
        <div><dt>Felt reports</dt><dd>{quake.felt ? quake.felt.toLocaleString("en-US") : "None yet"}</dd></div>
        <div><dt>Mag type</dt><dd>{quake.magType ? quake.magType.toUpperCase() : "—"}</dd></div>
        <div><dt>Coordinates</dt><dd>{formatCoordinates(quake.latitude, quake.longitude)}</dd></div>
        <div><dt>Significance</dt><dd>{quake.significance.toLocaleString("en-US")}</dd></div>
      </dl>

      {quake.url ? (
        <a href={quake.url} target="_blank" rel="noopener noreferrer" className="eq-link">
          View on USGS
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
    </>
  );
}

/** The picked quake's detail, printed right under the row or region that was pressed. */
function InlineQuakeDetail({ quake, now }: { quake: QuakeEvent | null; now: number | null }) {
  return (
    <div className="eq-detail" data-testid="quake-inline-detail">
      <QuakeDetailPanel quake={quake} now={now} />
    </div>
  );
}

export function EarthquakeClient({
  initialState,
  summary: initialSummary,
}: EarthquakeClientProps) {
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState(initialSummary);
  const now = useClientNow();
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("quake") !== null;
  const routeState = hasManagedParams
    ? normalizeEarthquakeState(searchParams)
    : initialState;

  const validQuakeIds = useMemo(
    () => new Set(Object.keys(summary.quakeDetails)),
    [summary.quakeDetails]
  );
  const canonicalQuakeParam = validQuakeIds.has(routeState.quake ?? "")
    ? routeState.quake
    : null;
  const defaultQuakeId =
    summary.recent[0]?.id ?? summary.significant[0]?.id ?? null;
  const selectedQuakeId = canonicalQuakeParam ?? defaultQuakeId;
  const selectedQuake = selectedQuakeId
    ? summary.quakeDetails[selectedQuakeId] ?? null
    : null;

  // The page is served from the committed snapshot, which can be hours behind
  // the feed. A linked quake it does not hold stays in the URL until the live
  // read has answered and can say whether the quake exists.
  const [liveSettled, setLiveSettled] = useState(false);
  const urlQuake = canonicalQuakeParam ?? (liveSettled ? null : routeState.quake);

  const desiredHref = buildEarthquakeHref(
    { view: routeState.view, quake: urlQuake },
    searchParams
  );

  const hasData = summary.recent.length > 0 || summary.significant.length > 0;

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    async function refreshSummary() {
      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch("/api/earthquake-pulse/summary", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const nextSummary = (await response.json()) as EarthquakeSummary;
        if (active && nextSummary.generatedAt) {
          setSummary(nextSummary);
        }
      } catch {
        // Keep the last good summary visible through transient network errors. An abort lands here too.
      } finally {
        if (active) setLiveSettled(true);
      }
    }

    void refreshSummary();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshSummary();
    }, 5 * 60 * 1000);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, []);

  const pushHref = useRouteSync(EARTHQUAKE_ROUTE, desiredHref);

  function navigate(nextState: EarthquakeRouteState) {
    const href = buildEarthquakeHref(nextState, searchParams);
    pushHref(href);
  }

  const logRef = useRef<HTMLElement>(null);
  // Set by a pick on the trace or the plot, whose detail opens down in the log.
  const revealDetail = useRef(false);

  function handleViewChange(view: EarthquakeView) {
    // The toolbar sticks, so a tab can be pressed from deep in a long list, and
    // a shorter view would leave the page at its foot. The log's top comes back.
    const log = logRef.current;
    if (log && log.getBoundingClientRect().top < 0) log.scrollIntoView?.({ block: "start" });
    navigate({ view, quake: urlQuake });
  }

  function handleSelectQuake(id: string, reveal = false) {
    revealDetail.current = reveal && id !== canonicalQuakeParam;
    // Pressing the open quake again closes it.
    navigate({ view: routeState.view, quake: id === canonicalQuakeParam ? null : id });
  }

  // The push lands in a transition, so the detail is brought into view once it
  // has rendered, and only when it is off screen or within 160px of the fold.
  useEffect(() => {
    if (!revealDetail.current) return;
    revealDetail.current = false;
    const detail = logRef.current?.querySelector(".eq-detail");
    if (!detail) return;
    const { top } = detail.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight - 160) detail.scrollIntoView?.({ block: "center" });
  }, [canonicalQuakeParam]);

  const listForView =
    routeState.view === "significant" ? summary.significant : summary.recent;
  // A picked quake that the open view does not list, such as one picked on the
  // seismogram or linked from another view, still needs its detail.
  const openQuakeIsListed =
    routeState.view === "regions"
      ? summary.regions.some((region) => region.strongestId === canonicalQuakeParam)
      : listForView.some((quake) => quake.id === canonicalQuakeParam);
  const feedTime = summary.feedUpdated ?? summary.generatedAt;
  // One set of spikes for the trace and the plot, rebuilt only when the feed moves.
  const spikes = useMemo(
    () => seismogramSpikes(summary.recent, new Date(feedTime)),
    [summary.recent, feedTime]
  );
  const onViewTabKey = useTablistKeyboard(EARTHQUAKE_VIEW_OPTIONS, handleViewChange);
  const stats = summary.heroStats;
  const strongestLine =
    stats.strongest24hMag !== null
      ? `The strongest was ${formatMagnitude(stats.strongest24hMag)}${stats.strongest24hPlace ? `, ${stats.strongest24hPlace}` : ""}.`
      : null;

  return (
    <div className="eq-root">
      <div className="c97-shell c97-frame eq-page">
        <header className="eq-head">
          <h1 className="eq-title">Earthquake Pulse</h1>
          <p className="eq-standfirst">
            The planet&apos;s last day of shaking, from what just moved, to what was big enough to
            matter, to where the ground is busiest.
          </p>
        </header>

        {!hasData ? (
          <p className="eq-muted">
            The first snapshot is still being generated from the USGS feeds. The dashboard fills in
            on the next successful read of USGS.
          </p>
        ) : (
          <>
            <section className="eq-trace" aria-label="The past 24 hours">
              <div className="eq-trace-head">
                <p className="eq-kicker">Past 24 hours, M2.5 and up</p>
                <p className="eq-stamp">
                  {`USGS Earthquake Hazards Program · feed updated ${formatTimestamp(feedTime)}${
                    summary.feedStatus === "stale-fallback"
                      ? " · USGS could not be reached, so this is the last saved snapshot"
                      : ""
                  }`}
                </p>
              </div>
              <EarthquakeSignature
                quakes={summary.recent}
                spikes={spikes}
                strongest={{ magnitude: stats.strongest24hMag, place: stats.strongest24hPlace }}
                selectedId={selectedQuakeId}
                onSelect={(id) => handleSelectQuake(id, true)}
              />
              <p className="eq-caption">
                {`${stats.total24h} quakes of M2.5 or more in the past 24 hours and ${stats.total7d} over the past week. ${stats.felt24h} of any magnitude drew a Did You Feel It? report.`}
                {strongestLine ? <span className="eq-phone-only"> {strongestLine}</span> : null}
              </p>
            </section>

            <div className="eq-board" data-plot={spikes.length > 0 ? undefined : "none"}>
              {spikes.length > 0 ? (
                <figure className="eq-plot">
                  <EpicentrePlot
                    quakes={summary.recent}
                    spikes={spikes}
                    selectedId={selectedQuakeId}
                    onSelect={(id) => handleSelectQuake(id, true)}
                  />
                  <figcaption className="eq-muted eq-small">
                    Epicentres from the trace above, solid for shallow quakes and fainter for
                    deeper ones, and the plate boundaries draw themselves.
                  </figcaption>
                </figure>
              ) : null}

              <section ref={logRef} className="eq-log" aria-labelledby="earthquake-log-title">
                {/* Unseen, so the outline runs h1, h2, then a picked quake's h3. */}
                <h2 id="earthquake-log-title" className="sr-only">
                  Earthquake log
                </h2>
                <div className="eq-toolbar">
                  <div className="eq-tabs" role="tablist" aria-label="Earthquake view switcher">
                    {EARTHQUAKE_VIEW_OPTIONS.map((view, index) => (
                      <button
                        key={view}
                        type="button"
                        role="tab"
                        id={`earthquake-tab-${view}`}
                        aria-controls={routeState.view === view ? `earthquake-tabpanel-${view}` : undefined}
                        aria-selected={routeState.view === view}
                        onKeyDown={(event) => onViewTabKey(event, index)}
                        onClick={() => handleViewChange(view)}
                      >
                        {EARTHQUAKE_VIEW_LABELS[view]}
                      </button>
                    ))}
                  </div>
                  <p className="eq-muted eq-small">
                    {routeState.view === "recent"
                      ? "Newest first, by origin time"
                      : routeState.view === "significant"
                      ? "USGS-flagged, past 30 days, strongest first"
                      : "Past seven days"}
                  </p>
                </div>

                <div
                  className="eq-panel"
                  role="tabpanel"
                  id={`earthquake-tabpanel-${routeState.view}`}
                  aria-labelledby={`earthquake-tab-${routeState.view}`}
                >
                  {canonicalQuakeParam && !openQuakeIsListed ? (
                    <InlineQuakeDetail quake={selectedQuake} now={now} />
                  ) : null}

                  {routeState.view === "regions" ? (
                    <>
                      <h2 className="eq-h2">Magnitude distribution</h2>
                      <DistributionBars summary={summary} />
                      <h2 className="eq-h2">Busiest regions</h2>
                      <RegionList
                        summary={summary}
                        onSelect={handleSelectQuake}
                        openQuakeId={canonicalQuakeParam}
                        now={now}
                      />
                    </>
                  ) : listForView.length === 0 ? (
                    <p className="eq-muted">
                      {routeState.view === "significant"
                        ? "No significant quakes in the past 30 days."
                        : "No quakes of magnitude 2.5 or more in the past 24 hours."}
                    </p>
                  ) : (
                    <div className="eq-quake-log">
                      {listForView.map((quake) => (
                        <Fragment key={quake.id}>
                          <QuakeRow
                            quake={quake}
                            isSelected={quake.id === selectedQuakeId}
                            isOpen={quake.id === canonicalQuakeParam}
                            showDate={routeState.view === "significant"}
                            onSelect={handleSelectQuake}
                            now={now}
                          />
                          {quake.id === canonicalQuakeParam ? (
                            <InlineQuakeDetail quake={quake} now={now} />
                          ) : null}
                        </Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        <p className="eq-source">
          This page reads the public USGS Earthquake Hazards Program feeds each time it loads,
          checks again every five minutes while it is open, and falls back to a snapshot saved once
          a day when USGS cannot be reached. It is not an emergency alert feed. For official alerts
          and the latest data, always defer to USGS and your local authorities.
        </p>
      </div>
    </div>
  );
}
