"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatUpdatedAt } from "@/lib/date-formatters";
import { ChevronDown, CircleAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import type {
  TransitRouteState,
  TransitSectionStatus,
  TransitStationBoard,
  TransitSummary,
  TransitView,
} from "@/types/bayAreaTransit";
import {
  buildTransitHref,
  DEFAULT_TRANSIT_STATE,
  TRANSIT_ROUTE,
  normalizeTransitState,
} from "./bay-area-transit-state";
import { TransitSignature } from "./TransitSignature";
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

const STATUS_LABEL: Record<TransitSectionStatus | "unreported", string> = {
  fresh: "Live",
  "stale-fallback": "Last good copy",
  unavailable: "Unavailable",
  unreported: "Not reported",
};

/**
 * One feed's state, in words and a mark, so it never rests on colour alone. A
 * summary without section statuses gets "Not reported" rather than a "Live"
 * it has no evidence for.
 */
function FeedBadge({ label, status }: { label: string; status: TransitSectionStatus | undefined }) {
  const state = status ?? "unreported";
  return (
    <span className="bt-badge" data-status={state}>
      <span className="bt-badge-mark" aria-hidden="true" />
      {label} <span className="bt-badge-state">{STATUS_LABEL[state]}</span>
    </span>
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

  // The alerts strip opens from the status strip. ?view=advisories is its open
  // state, and the default view (no param, or an old ?view=lines) is closed.
  const alertsOpen = routeState.view === "advisories";
  const alertCount = summary.advisories.length + summary.elevator.length;
  const title = (
    <div className="bt-title-text">
      <h1 className="bt-title">Bay Area Transit Pulse</h1>
      <p className="bt-standfirst">
        The BART map, the next trains at a station, and the service alerts on one screen.
      </p>
    </div>
  );

  if (!system) {
    return (
      <div className="bt-root">
        <div className="c97-shell c97-frame bt-page">
          <header className="bt-head">{title}</header>
          <p className="bt-muted">The transit snapshot is not available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bt-root">
      <div className="c97-shell c97-frame bt-page">
        <header className="bt-head">
          {title}
          <div className="bt-status">
            <div className="bt-badges">
              <FeedBadge label="Departures" status={summary.sectionStatus?.departures} />
              <FeedBadge label="Advisories" status={summary.sectionStatus?.advisories} />
              <FeedBadge label="Elevators" status={summary.sectionStatus?.elevator} />
              <button
                type="button"
                className="bt-alerts-toggle"
                aria-expanded={alertsOpen}
                aria-controls="transit-alerts"
                data-has-alerts={alertCount > 0 || undefined}
                onClick={() => handleViewChange(alertsOpen ? DEFAULT_TRANSIT_STATE.view : "advisories")}
              >
                {`Alerts${alertCount > 0 ? ` · ${alertCount}` : ""}`}
                <ChevronDown className="bt-chevron h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="bt-stamp">
              {`${system.source} · feed ${system.feedTime || "time unavailable"} · refreshed ${formatGeneratedAt(system.generatedAt)}${system.seed ? " · seed data" : ""}${staleSections.length > 0 ? ` · ${staleSections.join(", ")} from the last good snapshot` : ""}`}
            </p>
            <p className="bt-stamp">
              {system.seed
                ? "This is a hand-authored seed shipped with the app. The first refresh from the BART public API replaces it with the full network and real-time departures."
                : "Lines and stations come from the checked-in snapshot, and departures, advisories, and elevator outages refresh from BART every minute while the page is open."}
            </p>
          </div>
        </header>

        {/* Always in the DOM so the toggle's aria-controls resolves; hidden while closed. */}
        <section id="transit-alerts" className="bt-alerts" aria-label="Service alerts" hidden={!alertsOpen}>
          {staleSections.length > 0 ? (
            <p className="bt-alert" role="status">
              BART did not return fresh {staleSections.join(", ")} data on this pass, so I kept
              the last good result instead of showing a false zero.
            </p>
          ) : null}

          {summary.advisories.length === 0 &&
          summary.elevator.length === 0 &&
          staleSections.length === 0 ? (
            <p className="bt-alert">
              <ShieldCheck className="bt-alert-icon" data-tone="ok" aria-hidden="true" />
              No delays reported and all elevators in service at the last refresh.
            </p>
          ) : (
            <ul className="bt-alert-list">
              {summary.advisories.map((advisory) => (
                <li key={advisory.id} className="bt-alert">
                  <TriangleAlert className="bt-alert-icon" data-tone="warn" aria-hidden="true" />
                  <span>
                    <span className="bt-strong bt-block">
                      {advisory.type || "Advisory"}
                      {advisory.station ? ` · ${advisory.station}` : ""}
                    </span>
                    <span className="bt-muted bt-block">{advisory.description}</span>
                  </span>
                </li>
              ))}
              {summary.elevator.map((entry) => (
                <li key={entry.id} className="bt-alert">
                  <CircleAlert className="bt-alert-icon" aria-hidden="true" />
                  <span className="bt-muted">{entry.description}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

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
      </div>
    </div>
  );
}
