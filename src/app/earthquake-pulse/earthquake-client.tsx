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
  Clock3,
  ExternalLink,
  Gauge,
  Layers3,
  MapPin,
  Radar,
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
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import {
  Article,
  Calendar,
  ChartBar,
  Clock,
  Database,
} from "@/components/ui/ServerIcons";

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
  if (mag >= 7) return "var(--home-negative)";
  if (mag >= 6)
    return "color-mix(in srgb, var(--home-negative) 70%, var(--home-warning))";
  if (mag >= 5) return "var(--home-warning)";
  if (mag >= 4)
    return "color-mix(in srgb, var(--home-warning) 65%, var(--home-ink-muted))";
  return "var(--home-ink-muted)";
}

function magnitudeTint(mag: number): string {
  const base = magnitudeColor(mag);
  return `color-mix(in srgb, ${base} 12%, var(--home-paper-alt))`;
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor: "color-mix(in srgb, var(--home-negative) 32%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-negative) 9%, var(--home-paper-alt))",
      color: "var(--home-ink)",
      boxShadow: "var(--shadow-sm)",
    };
  }

  return {
    borderColor: "var(--home-rule)",
    background: "var(--home-paper-alt)",
    color: "var(--home-ink-muted)",
  };
}

function getRowStyle(isSelected: boolean, mag: number): CSSProperties {
  if (isSelected) {
    return {
      background: magnitudeTint(mag),
      borderColor: `color-mix(in srgb, ${magnitudeColor(mag)} 36%, var(--home-rule))`,
    };
  }

  return {
    background: "var(--home-paper-alt)",
    borderColor: "var(--home-rule)",
  };
}

function MagnitudeBadge({ mag }: { mag: number }) {
  return (
    <span
      className="inline-flex min-w-[58px] flex-col items-center justify-center rounded-[var(--radius-2xl)] border px-3 py-2"
      style={{
        borderColor: `color-mix(in srgb, ${magnitudeColor(mag)} 38%, var(--home-rule))`,
        background: magnitudeTint(mag),
      }}
    >
      <span
        className="text-xl leading-none"
        style={{
          fontFamily: "var(--font-home-sans)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: magnitudeColor(mag),
        }}
      >
        {mag.toFixed(1)}
      </span>
      <span
        className="mt-1 text-3xs uppercase tracking-[0.14em]"
        style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
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
      className="flex w-full items-center gap-4 rounded-[var(--radius-3xl)] border px-4 py-4 text-left"
      style={{
        ...getRowStyle(isSelected, quake.magnitude),
        boxShadow: isSelected
          ? `inset 4px 0 0 0 ${magnitudeColor(quake.magnitude)}`
          : undefined,
      }}
    >
      <MagnitudeBadge mag={quake.magnitude} />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-base font-semibold"
          style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
        >
          {quake.place}
        </span>
        <span
          className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
          style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
        >
          <span className="inline-flex items-center gap-1" suppressHydrationWarning>
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTimeAgo(quake.time)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDepth(quake.depthKm)}
          </span>
          {quake.tsunami ? (
            <span
              className="inline-flex items-center gap-1 font-semibold"
              style={{ color: "var(--home-negative)" }}
            >
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
              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
            >
              {bucket.label}
              <span
                className="ml-1 text-xs"
                style={{ color: "var(--home-ink-muted)" }}
              >
                {bucket.range}
              </span>
            </span>
            <span
              className="relative h-7 flex-1 overflow-hidden rounded-full"
              style={{ background: "color-mix(in srgb, var(--home-paper-alt) 70%, var(--home-elev-mix))" }}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${Math.max(widthPct, bucket.count > 0 ? 6 : 0)}%`,
                  background: magnitudeColor(anchorMag),
                  opacity: 0.85,
                }}
              />
            </span>
            <span
              className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
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
                style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
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
                className="relative h-2 flex-1 overflow-hidden rounded-full"
                style={{ background: "color-mix(in srgb, var(--home-paper-alt) 70%, var(--home-elev-mix))" }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.max(widthPct, 6)}%`,
                    background: magnitudeColor(region.maxMagnitude),
                    opacity: 0.8,
                  }}
                />
              </span>
              <span
                className="w-16 shrink-0 text-right text-sm"
                style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
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
            className="block w-full rounded-[var(--radius-2xl)] border px-4 py-3 text-left"
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-alt)" }}
          >
            {content}
          </button>
        ) : (
          <div
            key={region.region}
            className="rounded-[var(--radius-2xl)] border px-4 py-3"
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-alt)" }}
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
      className="rounded-[var(--radius-2xl)] border px-4 py-3"
      style={{
        borderColor: "var(--home-rule)",
        background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
      }}
    >
      <p className="home-kicker mb-1">{label}</p>
      <p
        className="mb-0 text-base font-semibold"
        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
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
        style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
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
              fontFamily: "var(--font-home-sans)",
              color: "var(--home-ink)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            {quake.place}
          </h2>
          <p
            className="mb-0 text-sm"
            style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
          >
            {formatTimestamp(quake.time)} ·{" "}
            <span suppressHydrationWarning>{formatTimeAgo(quake.time)}</span>
          </p>
        </div>
        <span
          className="shrink-0 text-3xl"
          style={{
            color: magnitudeColor(quake.magnitude),
            fontFamily: "var(--font-home-sans)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
          }}
        >
          {formatMagnitude(quake.magnitude)}
        </span>
      </div>

      {quake.tsunami ? (
        <div
          className="mt-4 flex items-center gap-2 rounded-[var(--radius-2xl)] border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: "color-mix(in srgb, var(--home-negative) 28%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-negative) 8%, var(--home-paper-alt))",
            color: "var(--home-negative)",
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
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
          style={{
            borderColor: "var(--home-rule)",
            background: "var(--home-paper-alt)",
            color: "var(--home-ink)",
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

  const statsPanelCells: HomeStatsCell[] = [
    {
      label: "Past 24h",
      tooltip: "Total earthquakes recorded worldwide in the last 24 hours.",
      value: `${summary.heroStats.total24h}`,
    },
    {
      label: "Past 7 days",
      tooltip: "M2.5+ earthquakes recorded worldwide over the last seven days.",
      value: `${summary.heroStats.total7d}`,
    },
    {
      label: "Strongest 24h",
      tooltip: "Largest magnitude recorded in the last 24 hours.",
      value: formatMagnitude(summary.heroStats.strongest24hMag),
    },
    {
      label: "Largest 7d",
      tooltip: "Largest magnitude recorded over the past seven days.",
      value: formatMagnitude(summary.heroStats.largest7dMag),
    },
    {
      label: "Significant 30d",
      tooltip: "USGS-flagged significant events over the past 30 days.",
      value: `${summary.heroStats.significant30d}`,
    },
    {
      label: "Felt 24h",
      tooltip: "Quakes with at least one community 'Did You Feel It?' report in the last 24 hours.",
      value: `${summary.heroStats.felt24h}`,
    },
    {
      label: "Tsunami flags 7d",
      tooltip: "Events that triggered a tsunami evaluation in the past seven days.",
      value: `${summary.heroStats.tsunamiAlerts7d}`,
    },
    {
      label: "Feed updated",
      tooltip: "Time the underlying USGS feed was last generated.",
      value: formatTimestamp(summary.feedUpdated ?? summary.generatedAt),
    },
  ];

  const listForView =
    routeState.view === "significant" ? summary.significant : summary.recent;

  if (!hasData) {
    return (
      <section className="home-page min-h-screen">
        <div className="home-shell home-section">
          <div
            className="rounded-[var(--radius-3xl)] border px-6 py-8"
            style={{ borderColor: "var(--home-rule)" }}
          >
            <p className="home-kicker">Earthquakes</p>
            <h1
              className="mb-3"
              style={{
                fontFamily: "var(--font-home-sans)",
                color: "var(--home-ink)",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 700,
                letterSpacing: "-0.06em",
                lineHeight: 0.94,
              }}
            >
              Earthquake Pulse
            </h1>
            <p
              className="mb-0 max-w-[52ch] text-base leading-7"
              style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
            >
              The first snapshot is still being generated from the USGS feeds. The
              dashboard fills in automatically on the next scheduled refresh.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="home-page min-h-screen">
      <div className="home-shell home-section space-y-8">
        <div
          className="overflow-hidden rounded-[var(--radius-3xl)] border p-6 sm:p-8"
          style={{
            borderColor: "color-mix(in srgb, var(--home-negative) 26%, var(--home-rule))",
            background:
              "color-mix(in srgb, var(--home-negative) 7%, var(--home-paper-raised))",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="home-kicker">USGS · Global</span>
                <span className="home-pill">
                  {summary.heroStats.total24h} in 24h
                </span>
              </div>

              <div className="space-y-3">
                <h1
                  className="mb-0"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    color: "var(--home-ink)",
                    fontSize: "clamp(2.7rem, 6vw, 5rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.08em",
                    lineHeight: 0.92,
                  }}
                >
                  Earthquake Pulse
                </h1>
                <p
                  className="mb-0 max-w-[54ch] text-base leading-7 sm:text-lg"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  I wanted the planet&apos;s last day of shaking on one calm screen:
                  what just moved, what was big enough to matter, and where the ground
                  is busiest. The browser checks USGS every five minutes and keeps the
                  last good snapshot visible if the feed drops.
                </p>
              </div>
            </div>

            <div
              className="rounded-[var(--radius-3xl)] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 86%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-2">Strongest in 24h</p>
              <p
                className="mb-1 text-4xl"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  color: magnitudeColor(summary.heroStats.strongest24hMag ?? 0),
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                }}
              >
                {formatMagnitude(summary.heroStats.strongest24hMag)}
              </p>
              <div className="space-y-3 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
                <p className="mb-0 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{summary.heroStats.strongest24hPlace ?? "No notable quake yet"}</span>
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <Radar className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{summary.heroStats.total7d} quakes over the past week</span>
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Feed updated {formatTimestamp(summary.feedUpdated ?? summary.generatedAt)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <HomeStatsPanel
          id="earthquake-stats-panel"
          title="Global seismicity at a glance"
          meta={`Live · refreshed ${formatTimestamp(summary.feedUpdated ?? summary.generatedAt)}`}
          cells={statsPanelCells}
          pills={[
            { label: "Recent", href: "?view=recent", icon: Clock },
            { label: "Significant", href: "?view=significant", icon: ChartBar },
            { label: "Regions", href: "?view=regions", icon: Database },
            { label: "Distribution", href: "?view=regions", icon: Calendar },
            { label: "Writing", href: "/writing", icon: Article },
          ]}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Earthquake view switcher">
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
                  className="min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={getViewButtonStyle(routeState.view === view)}
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
                <p className="home-kicker mb-0">
                  {routeState.view === "recent"
                    ? "Last 24 hours"
                    : routeState.view === "significant"
                    ? "Significant — past 30 days"
                    : "Where the ground is busiest"}
                </p>
                <p
                  className="mb-0 text-sm leading-6"
                  style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                >
                  {routeState.view === "recent"
                    ? "The most recent notable quakes worldwide (M2.5 and up), newest first. Tap one for depth, felt reports, and coordinates."
                    : routeState.view === "significant"
                    ? "USGS-flagged significant events from the past month, strongest first — the ones that actually made news."
                    : "Magnitude distribution and the busiest regions across the past seven days."}
                </p>
              </div>

              {routeState.view === "regions" ? (
                <div className="space-y-6">
                  <div
                    className="rounded-[var(--radius-3xl)] border px-5 py-5"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 82%, var(--home-elev-mix))",
                    }}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" aria-hidden="true" style={{ color: "var(--home-ink-muted)" }} />
                      <p className="home-kicker mb-0">Magnitude distribution · 7 days</p>
                    </div>
                    <DistributionBars summary={summary} />
                  </div>
                  <div>
                    <p className="home-kicker mb-3">Busiest regions · 7 days</p>
                    <RegionList summary={summary} onSelect={handleSelectQuake} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
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

            <div
              className="rounded-[var(--radius-3xl)] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 82%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-2">Snapshot note</p>
              <p
                className="mb-0 text-sm leading-7"
                style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
              >
                This page is a checked-in snapshot of public USGS Earthquake Hazards
                Program feeds, refreshed on a schedule — not a live emergency feed. For
                official alerts and the latest data, always defer to USGS and your local
                authorities.
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div
              className="rounded-[var(--radius-3xl)] border px-5 py-5 sm:px-6"
              style={{
                borderColor: selectedQuake
                  ? `color-mix(in srgb, ${magnitudeColor(selectedQuake.magnitude)} 24%, var(--home-rule))`
                  : "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4" aria-hidden="true" style={{ color: "var(--home-ink-muted)" }} />
                <p className="home-kicker mb-0">Selected quake</p>
              </div>
              <QuakeDetailPanel quake={selectedQuake} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
