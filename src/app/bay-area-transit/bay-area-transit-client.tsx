"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatUpdatedAt } from "@/lib/date-formatters";
import { CircleAlert, Navigation, ShieldCheck, TriangleAlert } from "lucide-react";
import type {
  TransitLine,
  TransitRouteState,
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
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { swatchStyle, TransitSignature } from "./TransitSignature";
import "./bay-area-transit.css";
import { useRouteSync } from "@/hooks/useRouteSync";

interface BayAreaTransitClientProps {
  initialState: TransitRouteState;
  summary: TransitSummary;
  initialStationBoard: TransitStationBoard | null;
}

// The shared formatter pins Pacific time, which is where BART timestamps belong.
function formatGeneratedAt(value: string | null | undefined): string {
  return value ? formatUpdatedAt(value) : "Unavailable";
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
    const error = new Error(payload.error || "Unable to load station board.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function fetchTransitSummary(signal: AbortSignal): Promise<TransitSummary> {
  const response = await fetch("/api/bay-area-transit/summary", {
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as TransitSummary & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Unable to refresh transit summary.");
  }
  return payload;
}

function LineCard({ line }: { line: TransitLine }) {
  return (
    <div className="c97-transit-line-card">
      <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
        <span
          className="c97-transit-swatch shrink-0"
          style={{ ...swatchStyle(line.hexColor), width: 22, height: 22 }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>{line.colorName} line</p>
          <h3
            className="c97-serif truncate"
            style={{ fontWeight: 600, fontSize: "var(--c97-fs-h3)" }}
            title={line.name}
          >
            {line.name}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
        <p className="c97-prose flex items-center" style={{ gap: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
          <Navigation className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {line.origin || "—"} → {line.destination || "—"}
          </span>
        </p>
        <span className="c97-chip">{line.stationCount} stops</span>
      </div>
    </div>
  );
}

export function BayAreaTransitClient({
  initialState,
  summary: initialSummary,
  initialStationBoard,
}: BayAreaTransitClientProps) {
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState(initialSummary);
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
  // Each summary refresh bumps the tick. A board read on an older tick stays on
  // screen while its replacement loads, instead of blanking to "Loading".
  const [refreshTick, setRefreshTick] = useState(0);
  const [boardTicks, setBoardTicks] = useState<Record<string, number>>({});

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
  const staleSections = Object.entries(summary.sectionStatus ?? {})
    .filter(([, status]) => status !== "fresh")
    .map(([section]) => section);

  // BART scopes some advisories to one station; system-wide ones say "BART".
  const advisoryStations = useMemo(() => {
    const abbrs = new Set(summary.stations.map((station) => station.abbr));
    return new Set(
      summary.advisories
        .map((advisory) => advisory.station?.trim().toUpperCase() ?? "")
        .filter((abbr) => abbrs.has(abbr))
    );
  }, [summary.advisories, summary.stations]);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    async function refreshSummary() {
      controller?.abort();
      controller = new AbortController();
      try {
        const nextSummary = await fetchTransitSummary(controller.signal);
        if (!active) return;
        setSummary(nextSummary);
        setRefreshTick((tick) => tick + 1);
        setStationBoardErrors({});
      } catch {
        // Keep the last good summary and station board on transient failures. An abort lands here too.
      }
    }

    void refreshSummary();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshSummary();
    }, 60_000);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, []);

  const pushHref = useRouteSync(TRANSIT_ROUTE, desiredHref);

  useEffect(() => {
    if (!selectedStationId) {
      return;
    }

    if (
      stationBoards[selectedStationId] &&
      (boardTicks[selectedStationId] ?? 0) === refreshTick
    ) {
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

        setStationBoards((current) => ({ ...current, [selectedStationId]: board }));
        setBoardTicks((current) => ({ ...current, [selectedStationId]: refreshTick }));
        setStationBoardErrors((current) => {
          if (!(selectedStationId in current)) {
            return current;
          }
          const next = { ...current };
          delete next[selectedStationId];
          return next;
        });
      })
      .catch((error: Error & { status?: number }) => {
        if (cancelled || error.name === "AbortError") {
          return;
        }
        if (error.status === 404) {
          // The station is real (it's in the directory) — the snapshot just
          // has no departures for it. Render the neutral empty state, not a
          // red error.
          setBoardTicks((current) => ({ ...current, [selectedStationId]: refreshTick }));
          setStationBoards((current) =>
            current[selectedStationId]
              ? current
              : {
                  ...current,
                  [selectedStationId]: {
                    id: selectedStationId,
                    abbr: selectedStationId.toUpperCase(),
                    name:
                      summary.stations.find(
                        (station) => station.id === selectedStationId
                      )?.name ?? selectedStationId.toUpperCase(),
                    departures: [],
                    generatedAt: summary.system?.generatedAt ?? "",
                  },
                }
          );
          return;
        }
        setStationBoardErrors((current) => ({
          ...current,
          [selectedStationId]:
            error.message || "Unable to load station board.",
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [stationBoardErrors, stationBoards, boardTicks, refreshTick, selectedStationId, summary]);

  function navigate(nextState: TransitRouteState) {
    const href = buildTransitHref(nextState, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: TransitView) {
    navigate({
      view,
      station: canonicalStationParam ?? DEFAULT_TRANSIT_STATE.station,
    });
  }

  function handleStationChange(stationId: string) {
    // The board sits beside the search and the map, so a pick keeps the view.
    navigate({ view: routeState.view, station: stationId });
  }

  function handleRetryStationBoard() {
    if (!selectedStationId) return;
    setStationBoardErrors((current) => {
      if (!(selectedStationId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[selectedStationId];
      return next;
    });
  }

  const lead = PROJECT_PRESS[TRANSIT_ROUTE].lead;
  // The hero carries no readouts, so the map and board sit higher; the alert
  // count, the one number a rider acts on, rides on the Alerts tab instead.
  const alertCount = summary.advisories.length + summary.elevator.length;
  const standfirst =
    "I wanted a BART map I could actually read, with the next trains and any service alerts on the same screen instead of across three apps.";

  if (!system) {
    return (
      <Catalog97ProjectHero
        ink={lead}
        title="Bay Area Transit Pulse"
        standfirst={standfirst}
        meta="The transit snapshot is not available yet."
      />
    );
  }


  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Bay Area Transit Pulse"
        standfirst={standfirst}
        meta={`${system.source} · feed ${system.feedTime || "time unavailable"} · refreshed ${formatGeneratedAt(system.generatedAt)}${system.seed ? " · seed data" : ""}${staleSections.length > 0 ? ` · ${staleSections.join(", ")} from the last good snapshot` : ""}`}
      >
        <TransitSignature
          departuresStatus={summary.sectionStatus?.departures}
          advisoryStations={advisoryStations}
          stations={summary.stations}
          lines={summary.lines}
          selectedStation={selectedStation}
          stationBoard={stationBoard}
          isLoading={isStationBoardLoading}
          error={stationBoardError}
          onSelect={handleStationChange}
          onRetry={handleRetryStationBoard}
        />
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          <h2 className="c97-poster-sm" style={{ marginBottom: "var(--c97-sp-2)" }}>The network</h2>

          <dl className="flex flex-wrap" style={{ gap: "var(--c97-sp-4)", margin: "0 0 var(--c97-sp-3)" }}>
            <div className="c97-stat">
              <dt className="c97-stat-label">Lines</dt>
              <dd className="c97-stat-value">{summary.heroStats.lineCount}</dd>
            </div>
            <div className="c97-stat">
              <dt className="c97-stat-label">Stations</dt>
              <dd className="c97-stat-value">{summary.heroStats.stationCount}</dd>
            </div>
          </dl>

          <div className="c97-segmented" role="tablist" aria-label="Transit view switcher">
            {TRANSIT_VIEW_OPTIONS.map((view, index) => (
              <button
                key={view}
                type="button"
                role="tab"
                id={`transit-tab-${view}`}
                aria-controls={
                  routeState.view === view ? `transit-tabpanel-${view}` : undefined
                }
                aria-selected={routeState.view === view}
                tabIndex={routeState.view === view ? 0 : -1}
                onClick={() => handleViewChange(view)}
                onKeyDown={(event) => {
                  let nextIndex: number | null = null;
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    nextIndex = (index + 1) % TRANSIT_VIEW_OPTIONS.length;
                  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    nextIndex =
                      (index - 1 + TRANSIT_VIEW_OPTIONS.length) %
                      TRANSIT_VIEW_OPTIONS.length;
                  } else if (event.key === "Home") {
                    nextIndex = 0;
                  } else if (event.key === "End") {
                    nextIndex = TRANSIT_VIEW_OPTIONS.length - 1;
                  }
                  if (nextIndex === null) return;
                  event.preventDefault();
                  const nextView = TRANSIT_VIEW_OPTIONS[nextIndex];
                  handleViewChange(nextView);
                  document.getElementById(`transit-tab-${nextView}`)?.focus();
                }}
                className="min-h-[44px]"
              >
                {TRANSIT_VIEW_LABELS[view]}
                {view === "advisories" && alertCount > 0 ? ` · ${alertCount}` : ""}
              </button>
            ))}
          </div>

          <div
            className="flex flex-col" style={{ marginTop: "var(--c97-sp-3)", gap: "var(--c97-sp-2)" }}
            role="tabpanel"
            id={`transit-tabpanel-${routeState.view}`}
            aria-labelledby={`transit-tab-${routeState.view}`}
          >
            {routeState.view === "lines" ? (
              <>
                <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
                  <p className="c97-kicker">Lines</p>
                  <p className="c97-prose">
                    Every BART line with its official color and end-to-end
                    route. The line buttons on the map above show where each
                    one runs.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
                  {summary.lines.map((line) => (
                    <LineCard key={line.id} line={line} />
                  ))}
                </div>
              </>
            ) : null}

            {routeState.view === "advisories" ? (
              <>
                <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
                  <p className="c97-kicker">Service alerts</p>
                  <p className="c97-prose">
                    Advisories and elevator outages posted by BART at the
                    last refresh.
                  </p>
                </div>

                {staleSections.length > 0 ? (
                  <div
                    className="c97-transit-advisory text-sm leading-6"
                    style={{ color: "var(--c97-ink)" }}
                    role="status"
                  >
                    BART did not return fresh {staleSections.join(", ")} data on
                    this pass, so I kept the last good result instead of showing
                    a false zero.
                  </div>
                ) : null}

                {summary.advisories.length === 0 &&
                summary.elevator.length === 0 &&
                staleSections.length === 0 ? (
                  <div className="c97-transit-advisory flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
                    <ShieldCheck
                      className="h-5 w-5 shrink-0"
                      style={{ color: "var(--c97-positive)" }}
                      aria-hidden="true"
                    />
                    <p className="text-sm leading-6" style={{ color: "var(--c97-ink)", marginBottom: "0" }}>
                      No delays reported and all elevators in service at the
                      last refresh.
                    </p>
                  </div>
                ) : summary.advisories.length > 0 ||
                  summary.elevator.length > 0 ? (
                  <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
                    {summary.advisories.map((advisory) => (
                      <div key={advisory.id} className="c97-transit-advisory">
                        <div className="flex items-start" style={{ gap: "var(--c97-sp-1)" }}>
                          <TriangleAlert
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: "var(--c97-warning)" }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: "var(--c97-ink)", marginBottom: "var(--c97-sp-0)" }}>
                              {advisory.type || "Advisory"}
                              {advisory.station ? ` · ${advisory.station}` : ""}
                            </p>
                            <p className="text-sm leading-6" style={{ color: "var(--c97-ink-2)", marginBottom: "0" }}>
                              {advisory.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {summary.elevator.map((entry) => (
                      <div key={entry.id} className="c97-transit-advisory">
                        <div className="flex items-start" style={{ gap: "var(--c97-sp-1)" }}>
                          <CircleAlert
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: "var(--c97-ink-2)" }}
                            aria-hidden="true"
                          />
                          <p className="text-sm leading-6" style={{ color: "var(--c97-ink-2)", marginBottom: "0" }}>
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Data note</p>
          <p className="c97-prose">
            {system.seed
              ? "This is a hand-authored seed shipped with the app. The first refresh from the BART public API replaces it with the full network and real-time departures."
              : "The route catalog comes from the checked-in snapshot. Departures, advisories, and elevator outages refresh from BART in the browser, with the last good snapshot held back as a fallback."}
          </p>
        </div>
      </section>
    </>
  );
}
