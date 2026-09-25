"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  Gauge,
  Layers3,
} from "lucide-react";
import type {
  EarthquakeRouteState,
  EarthquakeSummary,
  EarthquakeView,
  QuakeEvent,
} from "@/types/earthquake";
import {
  buildEarthquakeHref,
  DEFAULT_EARTHQUAKE_STATE,
  EARTHQUAKE_ROUTE,
  EARTHQUAKE_VIEW_LABELS,
  EARTHQUAKE_VIEW_OPTIONS,
  normalizeEarthquakeState,
} from "./earthquake-state";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { EarthquakeSignature } from "./EarthquakeSignature";
import "./earthquake-pulse.css";

interface EarthquakeClientProps {
  initialState: EarthquakeRouteState;
  summary: EarthquakeSummary;
}

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const CLOCK_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
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

function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "Unknown";
  }
  const diffMs = then - Date.now();
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
  return Number.isNaN(date.getTime()) ? "Unavailable" : TIME_FORMATTER.format(date);
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
    background: "var(--c97-field)",
    borderColor: "var(--c97-rule)",
  };
}

function MagnitudeBadge({ mag }: { mag: number }) {
  return (
    <span
      className="inline-flex min-w-[58px] flex-col items-center justify-center border px-3 py-2"
      style={{
        borderColor: `color-mix(in srgb, ${magnitudeColor(mag)} 38%, var(--c97-rule))`,
        background: magnitudeTint(mag),
      }}
    >
      <span
        className="text-xl leading-none"
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
        className="mt-1 text-3xs uppercase tracking-[0.14em]"
        style={{ color: "var(--c97-ink-2)", fontFamily: "var(--c97-font-body)" }}
      >
        Mag
      </span>
    </span>
  );
}

function QuakeRow({
  quake,
  isSelected,
  onSelect,
}: {
  quake: QuakeEvent;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(quake.id)}
      aria-current={isSelected ? "true" : undefined}
      className="c97-quake-log-row"
      style={getRowStyle(isSelected, quake.magnitude)}
    >
      <span className="c97-mono c97-quake-log-time" suppressHydrationWarning>
        {CLOCK_FORMATTER.format(new Date(quake.time))} UTC
        <span className="c97-quake-log-ago">{formatTimeAgo(quake.time)}</span>
      </span>
      <MagnitudeBadge mag={quake.magnitude} />
      <span className="c97-quake-log-place">
        <span className="c97-quake-log-name">{quake.place}</span>
        {quake.tsunami || quake.felt ? (
          <span className="c97-quake-log-flags">
            {quake.tsunami ? (
              <span className="inline-flex items-center gap-1" style={{ color: "var(--c97-negative)", fontWeight: 600 }}>
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Tsunami
              </span>
            ) : null}
            {quake.felt ? (
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                {quake.felt.toLocaleString()} felt
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <span className="c97-mono c97-quake-log-depth">
        <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
        {formatDepth(quake.depthKm)}
      </span>
    </button>
  );
}

function DistributionBars({ summary }: { summary: EarthquakeSummary }) {
  const maxCount = Math.max(1, ...summary.magnitudeBuckets.map((b) => b.count));
  return (
    <div className="space-y-3">
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
          <div key={bucket.tier} className="flex items-center gap-3">
            <span
              className="w-24 shrink-0 text-sm"
              style={{ color: "var(--c97-ink)", fontFamily: "var(--c97-font-body)" }}
            >
              {bucket.label}
              <span
                className="ml-1 text-xs"
                style={{ color: "var(--c97-ink-2)" }}
              >
                {bucket.range}
              </span>
            </span>
            <span
              className="relative h-7 flex-1 overflow-hidden"
              style={{ background: "color-mix(in srgb, var(--c97-field) 70%, var(--c97-field))" }}
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
}: {
  summary: EarthquakeSummary;
  onSelect: (id: string) => void;
}) {
  const maxCount = Math.max(1, ...summary.regions.map((r) => r.count));
  return (
    <div className="space-y-2">
      {summary.regions.map((region) => {
        const widthPct = Math.round((region.count / maxCount) * 100);
        const clickable = Boolean(region.strongestId);
        const content = (
          <>
            <span className="flex items-center justify-between gap-3">
              <span
                className="truncate text-base font-semibold"
                style={{ color: "var(--c97-ink)", fontFamily: "var(--c97-font-body)" }}
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
            <span className="mt-2 flex items-center gap-3">
              <span
                className="relative h-2 flex-1 overflow-hidden"
                style={{ background: "color-mix(in srgb, var(--c97-field) 70%, var(--c97-field))" }}
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
                className="w-16 shrink-0 text-right text-sm"
                style={{ color: "var(--c97-ink-2)", fontFamily: "var(--c97-font-body)" }}
              >
                {region.count} quake{region.count === 1 ? "" : "s"}
              </span>
            </span>
          </>
        );

        return clickable ? (
          <button
            key={region.region}
            type="button"
            onClick={() => onSelect(region.strongestId!)}
            className="block w-full border px-4 py-3 text-left"
            style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
          >
            {content}
          </button>
        ) : (
          <div
            key={region.region}
            className=" border px-4 py-3"
            style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className=" border px-4 py-3"
      style={{
        borderColor: "var(--c97-rule)",
        background: "color-mix(in srgb, var(--c97-surface) 92%, var(--c97-field))",
      }}
    >
      <p className="c97-kicker mb-1">{label}</p>
      <p
        className="mb-0 text-base font-semibold"
        style={{ color: "var(--c97-ink)", fontFamily: "var(--c97-font-body)" }}
      >
        {value}
      </p>
    </div>
  );
}

function QuakeDetailPanel({ quake }: { quake: QuakeEvent | null }) {
  if (!quake) {
    return (
      <p
        className="mb-0 text-sm leading-6"
        style={{ color: "var(--c97-ink-2)", fontFamily: "var(--c97-font-body)" }}
      >
        Select a quake to see depth, felt reports, and coordinates.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="mb-1 text-2xl"
            style={{
              fontFamily: "var(--c97-font-body)",
              color: "var(--c97-ink)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            {quake.place}
          </h2>
          <p
            className="mb-0 text-sm"
            style={{ color: "var(--c97-ink-2)", fontFamily: "var(--c97-font-body)" }}
          >
            {formatTimestamp(quake.time)} ·{" "}
            <span suppressHydrationWarning>{formatTimeAgo(quake.time)}</span>
          </p>
        </div>
        <span
          className="shrink-0 text-3xl"
          style={{
            color: magnitudeColor(quake.magnitude),
            fontFamily: "var(--c97-font-body)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
          }}
        >
          {formatMagnitude(quake.magnitude)}
        </span>
      </div>

      {quake.tsunami ? (
        <div
          className="mt-4 flex items-center gap-2 border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: "color-mix(in srgb, var(--c97-negative) 28%, var(--c97-rule))",
            background: "color-mix(in srgb, var(--c97-negative) 8%, var(--c97-field))",
            color: "var(--c97-negative)",
          }}
          role="note"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Tsunami evaluation issued for this event
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <DetailStat label="Depth" value={`${formatDepth(quake.depthKm)} · ${depthLabel(quake.depthKm)}`} />
        <DetailStat label="Region" value={quake.region} />
        <DetailStat
          label="Felt reports"
          value={quake.felt ? quake.felt.toLocaleString() : "None yet"}
        />
        <DetailStat label="Mag type" value={quake.magType ? quake.magType.toUpperCase() : "—"} />
        <DetailStat label="Coordinates" value={formatCoordinates(quake.latitude, quake.longitude)} />
        <DetailStat label="Significance" value={quake.significance.toLocaleString()} />
      </div>

      {quake.url ? (
        <a
          href={quake.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 border px-4 py-2.5 text-sm font-semibold"
          style={{
            borderColor: "var(--c97-rule)",
            background: "var(--c97-field)",
            color: "var(--c97-ink)",
          }}
        >
          View on USGS
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
    </>
  );
}

export function EarthquakeClient({
  initialState,
  summary: initialSummary,
}: EarthquakeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState(initialSummary);
  const currentQuery = searchParams.toString();
  const currentHref = `${EARTHQUAKE_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
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

  const desiredHref = buildEarthquakeHref(
    { view: routeState.view, quake: canonicalQuakeParam },
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
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          // Keep the last good summary visible through transient network errors.
        }
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

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: EarthquakeRouteState) {
    const href = buildEarthquakeHref(nextState, searchParams);
    if (href === currentHref) {
      return;
    }
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: EarthquakeView) {
    navigate({ view, quake: canonicalQuakeParam ?? DEFAULT_EARTHQUAKE_STATE.quake });
  }

  function handleSelectQuake(id: string) {
    navigate({ view: routeState.view, quake: id });
  }

  const listForView =
    routeState.view === "significant" ? summary.significant : summary.recent;
  const feedTime = summary.feedUpdated ?? summary.generatedAt;
  const lead = PROJECT_PRESS[EARTHQUAKE_ROUTE].lead;
  const standfirst =
    "I wanted the planet's last day of shaking on one calm screen, from what just moved, to what was big enough to matter, to where the ground is busiest. The browser checks USGS every five minutes and keeps the last good snapshot visible if the feed drops.";

  if (!hasData) {
    return (
      <Catalog97ProjectHero
        ink={lead}
        title="Earthquake Pulse"
        standfirst={standfirst}
        meta="The first snapshot is still being generated from the USGS feeds. The dashboard fills in on the next scheduled refresh."
      />
    );
  }

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Earthquake Pulse"
        standfirst={standfirst}
        meta={`USGS Earthquake Hazards Program · feed updated ${formatTimestamp(feedTime)}`}
        readouts={[
          {
            label: "Strongest in 24h",
            value: formatMagnitude(summary.heroStats.strongest24hMag),
            detail: summary.heroStats.strongest24hPlace ?? "No notable quake yet",
          },
          {
            label: "Quakes in 24h",
            value: `${summary.heroStats.total24h}`,
            detail: `${summary.heroStats.total7d} over the past week`,
          },
          {
            label: "Felt in 24h",
            value: `${summary.heroStats.felt24h}`,
            detail: "with a Did You Feel It? report",
          },
        ]}
      >
        <EarthquakeSignature
          quakes={summary.recent}
          windowEnd={new Date(feedTime)}
          selectedId={selectedQuakeId}
          onSelect={handleSelectQuake}
        />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]">
            <div className="space-y-6">
              <h2 className="c97-poster-sm">The log</h2>
              <div className="c97-segmented" role="tablist" aria-label="Earthquake view switcher">
                {EARTHQUAKE_VIEW_OPTIONS.map((view) => (
                  <button
                    key={view}
                    type="button"
                    role="tab"
                    id={`earthquake-tab-${view}`}
                    aria-controls={`earthquake-tabpanel-${view}`}
                    aria-selected={routeState.view === view}
                    tabIndex={routeState.view === view ? 0 : -1}
                    onClick={() => handleViewChange(view)}
                    className="min-h-[44px] text-sm font-semibold"
                  >
                    {EARTHQUAKE_VIEW_LABELS[view]}
                  </button>
                ))}
              </div>

              <div
                className="space-y-4"
                role="tabpanel"
                id={`earthquake-tabpanel-${routeState.view}`}
                aria-labelledby={`earthquake-tab-${routeState.view}`}
              >
                <div className="space-y-2">
                  <p className="c97-kicker mb-0">
                    {routeState.view === "recent"
                      ? "Last 24 hours"
                      : routeState.view === "significant"
                      ? "Significant, past 30 days"
                      : "Where the ground is busiest"}
                  </p>
                  <p className="c97-prose mb-0">
                    {routeState.view === "recent"
                      ? "The most recent notable quakes worldwide (M2.5 and up), newest first, logged by origin time. Tap one for depth, felt reports, and coordinates."
                      : routeState.view === "significant"
                      ? "USGS-flagged significant events from the past month, strongest first, which are the ones that actually made news."
                      : "Magnitude distribution and the busiest regions across the past seven days."}
                  </p>
                </div>

                {routeState.view === "regions" ? (
                  <div className="space-y-6">
                    <div className="c97-panel">
                      <div className="mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" aria-hidden="true" style={{ color: "var(--c97-ink-2)" }} />
                        <p className="c97-kicker mb-0">Magnitude distribution · 7 days</p>
                      </div>
                      <DistributionBars summary={summary} />
                    </div>
                    <div>
                      <p className="c97-kicker mb-3">Busiest regions · 7 days</p>
                      <RegionList summary={summary} onSelect={handleSelectQuake} />
                    </div>
                  </div>
                ) : (
                  <div className="c97-quake-log">
                    {listForView.map((quake) => (
                      <QuakeRow
                        key={quake.id}
                        quake={quake}
                        isSelected={quake.id === selectedQuakeId}
                        onSelect={handleSelectQuake}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="c97-panel xl:sticky xl:top-6">
                <div className="mb-3 flex items-center gap-2">
                  <Gauge className="h-4 w-4" aria-hidden="true" style={{ color: "var(--c97-ink-2)" }} />
                  <p className="c97-kicker mb-0">Selected quake</p>
                </div>
                <QuakeDetailPanel quake={selectedQuake} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <p className="c97-kicker mb-2">Snapshot note</p>
          <p className="c97-prose mb-0">
            This page is a checked-in snapshot of public USGS Earthquake Hazards Program feeds,
            refreshed on a schedule, and it is not a live emergency feed. For official alerts and
            the latest data, always defer to USGS and your local authorities.
          </p>
        </div>
      </section>
    </>
  );
}
