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
  Bike,
  CircleAlert,
  Clock,
  MapPin,
  Navigation,
  ShieldCheck,
  TimerReset,
  TramFront,
  TriangleAlert,
} from "lucide-react";
import type {
  TransitLine,
  TransitRouteState,
  TransitStation,
  TransitStationBoard,
  TransitSummary,
  TransitView,
} from "@/types/bayAreaTransit";
import {
  buildTransitHref,
  DEFAULT_TRANSIT_STATE,
  TRANSIT_ROUTE,
  TRANSIT_VIEW_LABELS,
  TRANSIT_VIEW_OPTIONS,
  normalizeTransitState,
} from "./bay-area-transit-state";
import {
  HomeStatsPanel,
  type HomeStatsCell,
} from "@/components/home/HomeStatsPanel";
import {
  Article,
  Briefcase,
  Calendar,
  ChartBar,
  User,
} from "@/components/ui/ServerIcons";

interface BayAreaTransitClientProps {
  initialState: TransitRouteState;
  summary: TransitSummary;
  initialStationBoard: TransitStationBoard | null;
}

const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatGeneratedAt(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : LAST_UPDATED_FORMATTER.format(date);
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) {
    return "Leaving";
  }
  if (minutes <= 0) {
    return "Now";
  }
  return `${minutes} min`;
}

/** A readable swatch border that still shows bright BART colors on light paper. */
function swatchStyle(hexColor: string): CSSProperties {
  return {
    background: hexColor,
    border: "1px solid color-mix(in srgb, var(--home-ink) 16%, transparent)",
  };
}

function getViewButtonStyle(isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      borderColor:
        "color-mix(in srgb, var(--home-acid) 50%, var(--home-rule))",
      background:
        "color-mix(in srgb, var(--home-acid) 16%, var(--home-paper-alt))",
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

function getRowStyle(isSelected: boolean): CSSProperties {
  if (isSelected) {
    return {
      background:
        "color-mix(in srgb, var(--home-acid) 14%, var(--home-paper-alt))",
      borderColor:
        "color-mix(in srgb, var(--home-acid) 44%, var(--home-rule))",
    };
  }

  return {
    background: "var(--home-paper-alt)",
    borderColor: "var(--home-rule)",
  };
}

async function fetchTransitStationBoard(
  stationId: string,
  signal: AbortSignal
): Promise<TransitStationBoard> {
  const response = await fetch(
    `/api/bay-area-transit/stations/${stationId}`,
    { signal }
  );
  const payload = (await response.json()) as TransitStationBoard & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load station board.");
  }

  return payload;
}

function StatBlock({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      className="rounded-[20px] px-4 py-3"
      style={{
        background:
          "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
        border: "1px solid var(--home-rule)",
      }}
    >
      <p className="home-kicker mb-1">{label}</p>
      <p
        className="mb-1 text-xl"
        style={{
          fontFamily: "var(--font-home-sans)",
          color: "var(--home-ink)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </p>
      <p
        className="mb-0 text-sm leading-6"
        style={{
          color: "var(--home-ink-muted)",
          fontFamily: "var(--font-home-sans)",
        }}
      >
        {detail}
      </p>
    </div>
  );
}

function LineCard({ line }: { line: TransitLine }) {
  return (
    <div
      className="rounded-[26px] border px-5 py-5"
      style={{
        borderColor: "var(--home-rule)",
        background:
          "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-7 w-7 shrink-0 rounded-full"
          style={swatchStyle(line.hexColor)}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="home-kicker mb-0">{line.colorName} line</p>
          <h3
            className="mb-0 truncate text-lg"
            style={{
              fontFamily: "var(--font-home-sans)",
              color: "var(--home-ink)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            {line.name}
          </h3>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p
          className="mb-0 flex items-center gap-2 text-sm"
          style={{
            color: "var(--home-ink-muted)",
            fontFamily: "var(--font-home-sans)",
          }}
        >
          <Navigation className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {line.origin || "—"} → {line.destination || "—"}
          </span>
        </p>
        <span
          className="rounded-full border px-2.5 py-1 text-xs font-semibold"
          style={{
            borderColor: "var(--home-rule)",
            color: "var(--home-ink-muted)",
            fontFamily: "var(--font-home-sans)",
          }}
        >
          {line.stationCount} stops
        </span>
      </div>
    </div>
  );
}

function StationRow({
  station,
  isSelected,
  onSelect,
}: {
  station: TransitStation;
  isSelected: boolean;
  onSelect: (stationId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(station.id)}
      aria-current={isSelected ? "true" : undefined}
      className="flex min-h-[44px] w-full items-center justify-between gap-4 rounded-[20px] border px-4 py-3 text-left"
      style={{
        ...getRowStyle(isSelected),
        boxShadow: isSelected
          ? "inset 4px 0 0 0 var(--home-acid)"
          : undefined,
      }}
    >
      <span className="min-w-0">
        <span
          className="block text-base font-semibold"
          style={{
            color: "var(--home-ink)",
            fontFamily: "var(--font-home-sans)",
          }}
        >
          {station.name}
        </span>
        <span
          className="block text-sm"
          style={{ color: "var(--home-ink-muted)" }}
        >
          {station.city || "Bay Area"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {station.lines.map((colorName) => {
          const hex = LINE_COLOR_HEX[colorName] ?? "#888888";
          return (
            <span
              key={`${station.id}-${colorName}`}
              className="h-3 w-3 rounded-full"
              style={swatchStyle(hex)}
              title={`${colorName} line`}
              aria-label={`${colorName} line`}
            />
          );
        })}
      </span>
    </button>
  );
}

// Fallback hex for line color dots in the station directory, where we only carry
// color names. The line cards use the snapshot's exact hex values.
const LINE_COLOR_HEX: Record<string, string> = {
  Yellow: "#ffff33",
  Orange: "#ff9933",
  Green: "#339933",
  Red: "#ff0000",
  Blue: "#0099cc",
  Beige: "#d5cfa3",
  Purple: "#c463c5",
  White: "#e5e5e5",
};

function DepartureRow({
  destination,
  minutes,
  platform,
  direction,
  length,
  hexColor,
  bikesAllowed,
  delaySeconds,
}: {
  destination: string;
  minutes: number | null;
  platform: string;
  direction: string;
  length: number;
  hexColor: string;
  bikesAllowed: boolean;
  delaySeconds: number;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[18px] border px-4 py-3"
      style={{
        borderColor: "var(--home-rule)",
        background:
          "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
      }}
    >
      <span
        className="h-9 w-1.5 shrink-0 rounded-full"
        style={swatchStyle(hexColor)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p
          className="mb-0 truncate text-base font-semibold"
          style={{
            color: "var(--home-ink)",
            fontFamily: "var(--font-home-sans)",
          }}
        >
          {destination}
        </p>
        <p
          className="mb-0 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs"
          style={{ color: "var(--home-ink-muted)" }}
        >
          <span>{direction}</span>
          <span>Plat {platform || "—"}</span>
          <span>{length}-car</span>
          {bikesAllowed ? (
            <span className="inline-flex items-center gap-1">
              <Bike className="h-3 w-3" aria-hidden="true" />
              Bikes OK
            </span>
          ) : null}
          {delaySeconds > 0 ? (
            <span style={{ color: "var(--color-warning)" }}>
              +{Math.round(delaySeconds / 60)} min late
            </span>
          ) : null}
        </p>
      </div>
      <p
        className="mb-0 shrink-0 text-right text-base font-semibold tabular-nums"
        style={{
          color:
            minutes === null || minutes <= 0
              ? "var(--color-success)"
              : "var(--home-ink)",
          fontFamily: "var(--font-home-sans)",
        }}
      >
        {formatMinutes(minutes)}
      </p>
    </div>
  );
}

export function BayAreaTransitClient({
  initialState,
  summary,
  initialStationBoard,
}: BayAreaTransitClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `${TRANSIT_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
  const hasManagedParams =
    searchParams.get("view") !== null || searchParams.get("station") !== null;
  const routeState = hasManagedParams
    ? normalizeTransitState(searchParams)
    : initialState;

  const validStationIds = useMemo(
    () => new Set(summary.stations.map((station) => station.id)),
    [summary.stations]
  );
  const canonicalStationParam = validStationIds.has(routeState.station ?? "")
    ? routeState.station
    : null;
  const defaultStationId = summary.defaultStation;
  const selectedStationId = canonicalStationParam ?? defaultStationId;

  const desiredHref = buildTransitHref(
    {
      view: routeState.view,
      station: canonicalStationParam,
    },
    searchParams
  );

  const [stationBoards, setStationBoards] = useState<
    Record<string, TransitStationBoard>
  >(() =>
    selectedStationId && initialStationBoard
      ? { [selectedStationId]: initialStationBoard }
      : {}
  );
  const [stationBoardErrors, setStationBoardErrors] = useState<
    Record<string, string>
  >({});

  const stationBoard = selectedStationId
    ? stationBoards[selectedStationId] ?? null
    : null;
  const stationBoardError = selectedStationId
    ? stationBoardErrors[selectedStationId] ?? null
    : null;
  const isStationBoardLoading = Boolean(
    selectedStationId && !stationBoard && !stationBoardError
  );

  const system = summary.system;
  const selectedStation =
    summary.stations.find((station) => station.id === selectedStationId) ?? null;

  useEffect(() => {
    if (currentHref === desiredHref) {
      return;
    }

    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  useEffect(() => {
    if (!selectedStationId) {
      return;
    }

    if (stationBoards[selectedStationId]) {
      return;
    }

    if (stationBoardErrors[selectedStationId]) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    fetchTransitStationBoard(selectedStationId, controller.signal)
      .then((board) => {
        if (cancelled) {
          return;
        }

        setStationBoards((current) =>
          current[selectedStationId]
            ? current
            : { ...current, [selectedStationId]: board }
        );
        setStationBoardErrors((current) => {
          if (!(selectedStationId in current)) {
            return current;
          }
          const next = { ...current };
          delete next[selectedStationId];
          return next;
        });
      })
      .catch((error: Error) => {
        if (!cancelled && error.name !== "AbortError") {
          setStationBoardErrors((current) => ({
            ...current,
            [selectedStationId]:
              error.message || "Unable to load station board.",
          }));
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [stationBoardErrors, stationBoards, selectedStationId]);

  function navigate(nextState: TransitRouteState) {
    const href = buildTransitHref(nextState, searchParams);
    if (href === currentHref) {
      return;
    }

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: TransitView) {
    navigate({
      view,
      station: canonicalStationParam ?? DEFAULT_TRANSIT_STATE.station,
    });
  }

  function handleStationChange(stationId: string) {
    navigate({
      // Selecting a station is most useful alongside the departures view.
      view: routeState.view === "advisories" ? "stations" : routeState.view,
      station: stationId,
    });
  }

  const statsPanelCells: HomeStatsCell[] = [
    {
      label: "Lines",
      tooltip: "Number of BART lines in the current snapshot.",
      value: `${summary.heroStats.lineCount}`,
    },
    {
      label: "Stations",
      tooltip: "Stations across the BART network in this snapshot.",
      value: `${summary.heroStats.stationCount}`,
    },
    {
      label: "Trains tracked",
      tooltip: "Total upcoming departures across every station board.",
      value: `${summary.heroStats.trainsTracked}`,
    },
    {
      label: "Active alerts",
      tooltip: "Service advisories currently posted by BART.",
      value: `${summary.heroStats.activeAdvisories}`,
    },
    {
      label: "Elevator outages",
      tooltip: "Elevators reported out of service.",
      value: `${summary.heroStats.elevatorOutages}`,
    },
    {
      label: "Default station",
      tooltip: "Station shown first when you land on the dashboard.",
      value: selectedStation?.name ?? "—",
    },
    {
      label: "Feed time",
      tooltip: "Time BART reported for its real-time feed.",
      value: system?.feedTime || "—",
    },
    {
      label: "Snapshot",
      tooltip: "Time the most recent snapshot was generated.",
      value: system ? formatGeneratedAt(system.generatedAt) : "Unavailable",
    },
  ];

  if (!system) {
    return (
      <section className="home-page min-h-screen">
        <div className="home-shell home-section">
          <div
            className="rounded-[28px] border px-6 py-8"
            style={{ borderColor: "var(--home-rule)" }}
          >
            <p className="home-kicker">Bay Area</p>
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
              Bay Area Transit Pulse
            </h1>
            <p
              className="mb-0 max-w-[52ch] text-base leading-7"
              style={{
                color: "var(--home-ink-muted)",
                fontFamily: "var(--font-home-sans)",
              }}
            >
              The transit snapshot is not available yet.
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
          className="overflow-hidden rounded-[34px] border p-6 sm:p-8"
          style={{
            borderColor:
              "color-mix(in srgb, var(--home-acid) 28%, var(--home-rule))",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--home-acid) 10%, var(--home-elev-mix)), color-mix(in srgb, var(--home-paper-alt) 82%, var(--home-elev-mix)))",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="home-kicker">{system.abbr}</span>
                <span className="home-pill">
                  {summary.heroStats.activeAdvisories === 0
                    ? "Normal service"
                    : `${summary.heroStats.activeAdvisories} alert${summary.heroStats.activeAdvisories === 1 ? "" : "s"}`}
                </span>
                {system.seed ? <span className="home-pill">Seed data</span> : null}
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
                  Bay Area Transit Pulse
                </h1>
                <p
                  className="mb-0 max-w-[54ch] text-base leading-7 sm:text-lg"
                  style={{
                    color: "var(--home-ink-muted)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  I wanted the BART map, the next trains, and any service alerts
                  in one calm screen instead of three apps. This snapshot keeps
                  the network readable without pretending it is a live feed.
                </p>
              </div>
            </div>

            <div
              className="rounded-[28px] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background:
                  "color-mix(in srgb, var(--home-paper-alt) 86%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-2">System</p>
              <h2
                className="mb-2 text-2xl"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  color: "var(--home-ink)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                }}
              >
                {system.name}
              </h2>
              <div
                className="space-y-3 text-sm leading-6"
                style={{ color: "var(--home-ink-muted)" }}
              >
                <p className="mb-0 flex items-start gap-2">
                  <TramFront className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {summary.heroStats.lineCount} lines ·{" "}
                    {summary.heroStats.stationCount} stations
                  </span>
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{system.feedTime || "Feed time unavailable"}</span>
                </p>
                <p className="mb-0 flex items-center gap-2">
                  <TimerReset className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Snapshot refreshed {formatGeneratedAt(system.generatedAt)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <HomeStatsPanel
          id="transit-stats-panel"
          title="BART at a glance"
          meta={`Snapshot · refreshed ${formatGeneratedAt(system.generatedAt)}`}
          cells={statsPanelCells}
          pills={[
            { label: "Lines", href: "?view=lines", icon: ChartBar },
            { label: "Departures", href: "?view=stations", icon: Calendar },
            { label: "Alerts", href: "?view=advisories", icon: Briefcase },
            { label: "Stations", href: "?view=stations", icon: User },
            { label: "Writing", href: "/writing", icon: Article },
          ]}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]">
          <div className="space-y-6">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Transit view switcher"
            >
              {TRANSIT_VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  id={`transit-tab-${view}`}
                  aria-controls={`transit-tabpanel-${view}`}
                  aria-selected={routeState.view === view}
                  tabIndex={routeState.view === view ? 0 : -1}
                  onClick={() => handleViewChange(view)}
                  className="min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={getViewButtonStyle(routeState.view === view)}
                >
                  {TRANSIT_VIEW_LABELS[view]}
                </button>
              ))}
            </div>

            <div
              className="space-y-4"
              role="tabpanel"
              id={`transit-tabpanel-${routeState.view}`}
              aria-labelledby={`transit-tab-${routeState.view}`}
            >
              {routeState.view === "lines" ? (
                <>
                  <div className="space-y-2">
                    <p className="home-kicker mb-0">Lines</p>
                    <p
                      className="mb-0 text-sm leading-6"
                      style={{
                        color: "var(--home-ink-muted)",
                        fontFamily: "var(--font-home-sans)",
                      }}
                    >
                      Every BART line with its official color and end-to-end
                      route. Switch to Departures to see the next trains at a
                      station.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {summary.lines.map((line) => (
                      <LineCard key={line.id} line={line} />
                    ))}
                  </div>
                </>
              ) : null}

              {routeState.view === "stations" ? (
                <>
                  <div className="space-y-2">
                    <p className="home-kicker mb-0">Stations</p>
                    <p
                      className="mb-0 text-sm leading-6"
                      style={{
                        color: "var(--home-ink-muted)",
                        fontFamily: "var(--font-home-sans)",
                      }}
                    >
                      Pick a station to load its departure board in the panel on
                      the right. The colored dots show which lines stop there.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {summary.stations.map((station) => (
                      <StationRow
                        key={station.id}
                        station={station}
                        isSelected={station.id === selectedStationId}
                        onSelect={handleStationChange}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {routeState.view === "advisories" ? (
                <>
                  <div className="space-y-2">
                    <p className="home-kicker mb-0">Service alerts</p>
                    <p
                      className="mb-0 text-sm leading-6"
                      style={{
                        color: "var(--home-ink-muted)",
                        fontFamily: "var(--font-home-sans)",
                      }}
                    >
                      Advisories and elevator outages posted by BART at snapshot
                      time.
                    </p>
                  </div>

                  {summary.advisories.length === 0 &&
                  summary.elevator.length === 0 ? (
                    <div
                      className="flex items-center gap-3 rounded-[24px] border px-5 py-5"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--color-success) 26%, var(--home-rule))",
                        background:
                          "color-mix(in srgb, var(--color-success) 8%, var(--home-paper-alt))",
                      }}
                    >
                      <ShieldCheck
                        className="h-5 w-5 shrink-0"
                        style={{ color: "var(--color-success)" }}
                        aria-hidden="true"
                      />
                      <p
                        className="mb-0 text-sm leading-6"
                        style={{
                          color: "var(--home-ink)",
                          fontFamily: "var(--font-home-sans)",
                        }}
                      >
                        No delays reported and all elevators in service at
                        snapshot time.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {summary.advisories.map((advisory) => (
                        <div
                          key={advisory.id}
                          className="rounded-[22px] border px-5 py-4"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--color-warning) 26%, var(--home-rule))",
                            background:
                              "color-mix(in srgb, var(--color-warning) 8%, var(--home-paper-alt))",
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <TriangleAlert
                              className="mt-0.5 h-4 w-4 shrink-0"
                              style={{ color: "var(--color-warning)" }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p
                                className="mb-1 text-sm font-semibold"
                                style={{
                                  color: "var(--home-ink)",
                                  fontFamily: "var(--font-home-sans)",
                                }}
                              >
                                {advisory.type || "Advisory"}
                                {advisory.station
                                  ? ` · ${advisory.station}`
                                  : ""}
                              </p>
                              <p
                                className="mb-0 text-sm leading-6"
                                style={{ color: "var(--home-ink-muted)" }}
                              >
                                {advisory.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {summary.elevator.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-[22px] border px-5 py-4"
                          style={{
                            borderColor: "var(--home-rule)",
                            background:
                              "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <CircleAlert
                              className="mt-0.5 h-4 w-4 shrink-0"
                              style={{ color: "var(--home-ink-muted)" }}
                              aria-hidden="true"
                            />
                            <p
                              className="mb-0 text-sm leading-6"
                              style={{ color: "var(--home-ink-muted)" }}
                            >
                              {entry.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div
              className="rounded-[26px] border px-5 py-5"
              style={{
                borderColor: "var(--home-rule)",
                background:
                  "color-mix(in srgb, var(--home-paper-alt) 82%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-2">Snapshot note</p>
              <p
                className="mb-0 text-sm leading-7"
                style={{
                  color: "var(--home-ink-muted)",
                  fontFamily: "var(--font-home-sans)",
                }}
              >
                {system.seed
                  ? "This is a hand-authored seed shipped with the app. The first refresh from the BART public API replaces it with the full network and real-time departures."
                  : "This page is a checked-in BART snapshot rather than a live feed. Lines, departures, and alerts reflect the local dataset generated from the BART public API."}
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div
              className="rounded-[30px] border px-5 py-5 sm:px-6"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--home-acid) 22%, var(--home-rule))",
                background:
                  "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
              }}
            >
              <p className="home-kicker mb-2">Next trains</p>

              {selectedStation ? (
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
                        {selectedStation.name}
                      </h2>
                      <p
                        className="mb-0 flex items-center gap-1.5 text-sm"
                        style={{
                          color: "var(--home-ink-muted)",
                          fontFamily: "var(--font-home-sans)",
                        }}
                      >
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {selectedStation.city || "Bay Area"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {selectedStation.lines.map((colorName) => (
                      <span
                        key={`${selectedStation.id}-aside-${colorName}`}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={{
                          borderColor: "var(--home-rule)",
                          color: "var(--home-ink-muted)",
                        }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={swatchStyle(
                            LINE_COLOR_HEX[colorName] ?? "#888888"
                          )}
                          aria-hidden="true"
                        />
                        {colorName}
                      </span>
                    ))}
                  </div>

                  {isStationBoardLoading ? (
                    <p
                      className="mb-0 mt-5 text-sm"
                      role="status"
                      style={{
                        color: "var(--home-ink-muted)",
                        fontFamily: "var(--font-home-sans)",
                      }}
                    >
                      Loading departures…
                    </p>
                  ) : null}

                  {stationBoardError ? (
                    <div
                      className="mt-5 rounded-[22px] border px-4 py-4"
                      role="alert"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--color-error) 24%, var(--home-rule))",
                        background:
                          "color-mix(in srgb, var(--color-error) 8%, var(--home-paper-alt))",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <CircleAlert
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: "var(--color-error)" }}
                          aria-hidden="true"
                        />
                        <p
                          className="mb-0 text-sm leading-6"
                          style={{
                            color: "var(--home-ink)",
                            fontFamily: "var(--font-home-sans)",
                          }}
                        >
                          {stationBoardError}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {stationBoard ? (
                    stationBoard.departures.length > 0 ? (
                      <div className="mt-5 space-y-2.5">
                        {stationBoard.departures
                          .slice(0, 9)
                          .map((departure, index) => (
                            <DepartureRow
                              key={`${stationBoard.id}-${departure.destinationAbbr}-${departure.platform}-${index}`}
                              destination={departure.destination}
                              minutes={departure.minutes}
                              platform={departure.platform}
                              direction={departure.direction}
                              length={departure.length}
                              hexColor={departure.hexColor}
                              bikesAllowed={departure.bikesAllowed}
                              delaySeconds={departure.delaySeconds}
                            />
                          ))}
                      </div>
                    ) : (
                      <p
                        className="mb-0 mt-5 text-sm leading-6"
                        style={{
                          color: "var(--home-ink-muted)",
                          fontFamily: "var(--font-home-sans)",
                        }}
                      >
                        No upcoming departures in this snapshot for{" "}
                        {selectedStation.name}.
                      </p>
                    )
                  ) : null}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <StatBlock
                      label="Lines here"
                      value={`${selectedStation.lines.length}`}
                      detail="Serving this station"
                    />
                    <StatBlock
                      label="Departures"
                      value={`${stationBoard?.departures.length ?? 0}`}
                      detail="In this snapshot"
                    />
                  </div>
                </>
              ) : (
                <p
                  className="mb-0 text-sm leading-6"
                  style={{
                    color: "var(--home-ink-muted)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  No station is available in the current snapshot.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
