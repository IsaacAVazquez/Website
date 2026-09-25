"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, Navigation, ShieldCheck, TriangleAlert } from "lucide-react";
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
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { TransitSignature } from "./TransitSignature";
import "./bay-area-transit.css";

interface BayAreaTransitClientProps {
  initialState: TransitRouteState;
  summary: TransitSummary;
  initialStationBoard: TransitStationBoard | null;
}

// Pinned to Pacific time: BART timestamps belong to the Bay Area, and a fixed
// zone keeps the server-rendered text identical to the client's (no hydration
// mismatch from the server running in UTC).
const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
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

/** A readable swatch border that still shows bright BART colors on light paper. */
function swatchStyle(hexColor: string): CSSProperties {
  return {
    background: hexColor,
    border: "1px solid color-mix(in srgb, var(--c97-ink) 16%, transparent)",
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
      <div className="flex items-center gap-3">
        <span
          className="c97-transit-swatch shrink-0"
          style={{ ...swatchStyle(line.hexColor), width: 22, height: 22 }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="c97-kicker mb-1">{line.colorName} line</p>
          <h3
            className="c97-serif mb-0 truncate"
            style={{ fontWeight: 600, fontSize: "var(--c97-fs-h3)" }}
          >
            {line.name}
          </h3>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="c97-prose mb-0 flex items-center gap-2" style={{ fontSize: "var(--c97-fs-small)" }}>
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

function StationRow({
  station,
  isSelected,
  onSelect,
  hexForLine,
}: {
  station: TransitStation;
  isSelected: boolean;
  onSelect: (stationId: string) => void;
  hexForLine: (colorName: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(station.id)}
      aria-current={isSelected ? "true" : undefined}
      className="c97-transit-station-row"
    >
      <span className="min-w-0">
        <span className="block c97-serif truncate" style={{ fontWeight: 600 }}>
          {station.name}
        </span>
        <span className="block text-sm" style={{ color: "var(--c97-ink-2)" }}>
          {station.city || "Bay Area"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {station.lines.map((colorName) => (
          <span
            key={`${station.id}-${colorName}`}
            className="c97-transit-swatch"
            style={swatchStyle(hexForLine(colorName))}
            title={`${colorName} line`}
            role="img"
            aria-label={`${colorName} line`}
          />
        ))}
      </span>
    </button>
  );
}

export function BayAreaTransitClient({
  initialState,
  summary: initialSummary,
  initialStationBoard,
}: BayAreaTransitClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState(initialSummary);
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
  const staleSections = Object.entries(summary.sectionStatus ?? {})
    .filter(([, status]) => status !== "fresh")
    .map(([section]) => section);

  const lineHexByColor = useMemo(
    () =>
      new Map(
        summary.lines.map((line) => [line.colorName.trim().toLowerCase(), line.hexColor])
      ),
    [summary.lines]
  );
  const hexForLine = (colorName: string) =>
    lineHexByColor.get(colorName.trim().toLowerCase()) ?? "var(--c97-ink-2)";

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
        setStationBoards({});
        setStationBoardErrors({});
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          // Keep the last good summary and station board on transient failures.
        }
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
      .catch((error: Error & { status?: number }) => {
        if (cancelled || error.name === "AbortError") {
          return;
        }
        if (error.status === 404) {
          // The station is real (it's in the directory) — the snapshot just
          // has no departures for it. Render the neutral empty state, not a
          // red error.
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
  }, [stationBoardErrors, stationBoards, selectedStationId, summary]);

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
  const standfirst =
    "I wanted the BART map, the next trains, and any service alerts in one calm screen instead of three apps. The browser refreshes every minute, and each feed keeps its last good result when BART has a temporary outage.";

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

  const advisoryDetail =
    staleSections.includes("advisories")
      ? "Last known count"
      : summary.heroStats.activeAdvisories === 0
      ? "Normal service"
      : undefined;

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Bay Area Transit Pulse"
        standfirst={standfirst}
        meta={`${system.source} · feed ${system.feedTime || "time unavailable"} · refreshed ${formatGeneratedAt(system.generatedAt)}${system.seed ? " · seed data" : ""}${staleSections.length > 0 ? ` · ${staleSections.join(", ")} from the last good snapshot` : ""}`}
        readouts={[
          { label: "Lines", value: `${summary.heroStats.lineCount}` },
          { label: "Stations", value: `${summary.heroStats.stationCount}` },
          {
            label: "Active alerts",
            value: `${summary.heroStats.activeAdvisories}`,
            detail: advisoryDetail,
          },
        ]}
      >
        <TransitSignature
          departuresStatus={summary.sectionStatus?.departures}
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
          <h2 className="c97-poster-sm mb-5">The network</h2>

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
              </button>
            ))}
          </div>

          <div
            className="mt-6 space-y-4"
            role="tabpanel"
            id={`transit-tabpanel-${routeState.view}`}
            aria-labelledby={`transit-tab-${routeState.view}`}
          >
            {routeState.view === "lines" ? (
              <>
                <div className="space-y-2">
                  <p className="c97-kicker mb-0">Lines</p>
                  <p className="c97-prose mb-0">
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
                  <p className="c97-kicker mb-0">Stations</p>
                  <p className="c97-prose mb-0">
                    Pick a station to load its departure board above. The
                    colored dots show which lines stop there.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {summary.stations.map((station) => (
                    <StationRow
                      key={station.id}
                      station={station}
                      isSelected={station.id === selectedStationId}
                      onSelect={handleStationChange}
                      hexForLine={hexForLine}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {routeState.view === "advisories" ? (
              <>
                <div className="space-y-2">
                  <p className="c97-kicker mb-0">Service alerts</p>
                  <p className="c97-prose mb-0">
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
                  <div className="c97-transit-advisory flex items-center gap-3">
                    <ShieldCheck
                      className="h-5 w-5 shrink-0"
                      style={{ color: "var(--c97-positive)" }}
                      aria-hidden="true"
                    />
                    <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink)" }}>
                      No delays reported and all elevators in service at the
                      last refresh.
                    </p>
                  </div>
                ) : summary.advisories.length > 0 ||
                  summary.elevator.length > 0 ? (
                  <div className="space-y-3">
                    {summary.advisories.map((advisory) => (
                      <div key={advisory.id} className="c97-transit-advisory">
                        <div className="flex items-start gap-3">
                          <TriangleAlert
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: "var(--c97-warning)" }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="mb-1 text-sm font-semibold" style={{ color: "var(--c97-ink)" }}>
                              {advisory.type || "Advisory"}
                              {advisory.station ? ` · ${advisory.station}` : ""}
                            </p>
                            <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
                              {advisory.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {summary.elevator.map((entry) => (
                      <div key={entry.id} className="c97-transit-advisory">
                        <div className="flex items-start gap-3">
                          <CircleAlert
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: "var(--c97-ink-2)" }}
                            aria-hidden="true"
                          />
                          <p className="mb-0 text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
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
          <p className="c97-kicker mb-2">Data note</p>
          <p className="c97-prose mb-0">
            {system.seed
              ? "This is a hand-authored seed shipped with the app. The first refresh from the BART public API replaces it with the full network and real-time departures."
              : "The route catalog comes from the checked-in snapshot. Departures, advisories, and elevator outages refresh from BART in the browser, with the last good snapshot held back as a fallback."}
          </p>
        </div>
      </section>
    </>
  );
}
