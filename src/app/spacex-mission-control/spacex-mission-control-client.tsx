"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import type {
  MissionControlInitialData,
  MissionControlSearchState,
  MissionControlSummary,
  MissionLaunchCard,
  MissionLaunchDetail,
  MissionControlStatus,
} from "@/types/spacex";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
import { formatUpdatedAt } from "@/lib/date-formatters";
import { MissionControlHero, type MissionFleetFigure } from "@/components/spacex/MissionControlHero";
import { MissionLaunchBoard } from "@/components/spacex/MissionLaunchBoard";
import { MissionLaunchTape } from "@/components/spacex/MissionLaunchTape";
import { MissionCadenceStrip } from "@/components/spacex/MissionCadenceStrip";
import { MissionVehicleCatalog } from "@/components/spacex/MissionVehicleCatalog";
import { MissionRecoveryPanel } from "@/components/spacex/MissionRecoveryPanel";
import { DeferredMissionDrawer } from "@/components/spacex/DeferredMissionDrawer";
import { aggregateMissionRecovery } from "@/lib/spacexRecovery";
import {
  buildMissionControlHref,
  DEFAULT_MISSION_CONTROL_STATE,
  normalizeMissionControlState,
} from "./spacex-mission-control-state";
import "./spacex-mission-control.css";

interface SpaceXMissionControlClientProps {
  initialState: MissionControlSearchState;
  initialData?: MissionControlInitialData;
  renderedAtMs?: number;
}

type MissionControlSection = "manifest" | "vehicles" | "recovery";

const SECTION_OPTIONS: Array<{ key: MissionControlSection; label: string }> = [
  { key: "manifest", label: "Manifest" },
  { key: "vehicles", label: "Vehicles" },
  { key: "recovery", label: "Recovery" },
];

const LIVE_REFRESH_INTERVAL_MS = 300_000;
const LIVE_REFRESH_DEDUPE_MS = 1_500;
const LIVE_REFRESH_MAX_INTERVAL_MS = 30 * 60 * 1000;

function buildApiError(message: string, status: number): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

async function fetchJson<T>(url: string, validate?: (data: unknown) => data is T): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw buildApiError(body.error ?? "Request failed", response.status);
  }

  if (validate && !validate(body)) {
    throw buildApiError("Response payload missing expected fields", 502);
  }

  return body;
}

function isMissionControlSummary(data: unknown): data is MissionControlSummary {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return (
    "heroLaunch" in candidate &&
    "nextLaunch" in candidate &&
    Array.isArray(candidate.insights)
  );
}

function isLaunchesPayload(data: unknown): data is { launches: MissionLaunchCard[] } {
  if (!data || typeof data !== "object") return false;
  return Array.isArray((data as { launches?: unknown }).launches);
}

function isMissionLaunchDetail(data: unknown): data is MissionLaunchDetail {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
}

export function SpaceXMissionControlClient({
  initialState,
  initialData,
  renderedAtMs: renderedAtMsProp,
}: SpaceXMissionControlClientProps) {
  const [renderedAtMs] = useState(() => renderedAtMsProp ?? Date.now());
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasManagedParams =
    searchParams.get("status") !== null ||
    searchParams.get("launch") !== null ||
    searchParams.get("panel") !== null;
  const routeState = useMemo<MissionControlSearchState>(
    () => (hasManagedParams ? normalizeMissionControlState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  const hasInitialData = Boolean(initialData);

  const [summary, setSummary] = useState<MissionControlSummary | null>(
    initialData?.summary ?? null
  );
  const [summaryLoading, setSummaryLoading] = useState(!hasInitialData);
  const [summaryError, setSummaryError] = useState<string | null>(
    initialData?.summaryError ?? null
  );
  const [summaryFetchKey, setSummaryFetchKey] = useState(0);

  const [launches, setLaunches] = useState<MissionLaunchCard[]>(
    initialData?.launches ?? []
  );
  const [launchesLoading, setLaunchesLoading] = useState(!hasInitialData);
  const [launchesError, setLaunchesError] = useState<string | null>(
    initialData?.launchesError ?? null
  );
  const [launchesFetchKey, setLaunchesFetchKey] = useState(0);

  const [detail, setDetail] = useState<MissionLaunchDetail | null>(initialData?.detail ?? null);
  const [detailLoading, setDetailLoading] = useState(
    initialState.launch ? !hasInitialData : false
  );
  const [detailError, setDetailError] = useState<string | null>(
    initialData?.detailError ?? null
  );
  const [detailFetchKey, setDetailFetchKey] = useState(0);

  const [section, setSection] = useState<MissionControlSection>("manifest");

  // Launch tape, cadence, and the vehicle/recovery catalogs are read once
  // from the server-rendered snapshot rather than kept on the 5-minute live
  // poll below — none of them change on that cadence (the tape's "recent
  // outcomes" and the hydrated vehicle/core records only change on a
  // snapshot rebuild), so there's no separate fetch/loading state for them.
  const tapeRecentLaunches = initialData?.tapeRecentLaunches ?? [];
  const tapeUpcomingLaunches = initialData?.tapeUpcomingLaunches ?? [];
  const vehicleCatalogDetails = initialData?.launchDetails ?? {};
  const cadence = initialData?.cadence ?? null;

  const summaryRequestId = useRef(0);
  const launchesRequestId = useRef(0);
  const detailRequestId = useRef(0);
  const skipInitialSummaryFetch = useRef(hasInitialData);
  const skipInitialLaunchesFetch = useRef(hasInitialData);
  const skipInitialDetailFetch = useRef(Boolean(hasInitialData && initialState.launch));
  const isMounted = useRef(true);
  const lastLiveRefreshAt = useRef(0);
  const selectedLaunchIdRef = useRef<string | null>(initialState.launch);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    selectedLaunchIdRef.current = routeState.launch;
  }, [routeState.launch]);

  useEffect(() => {
    const currentStatus = searchParams.get("status") ?? DEFAULT_MISSION_CONTROL_STATE.status;
    const currentPanel = searchParams.get("panel") ?? DEFAULT_MISSION_CONTROL_STATE.panel;
    const currentLaunch = searchParams.get("launch");

    if (
      currentStatus === routeState.status &&
      currentPanel === routeState.panel &&
      currentLaunch === routeState.launch
    ) {
      return;
    }

    startTransition(() => {
      router.replace(buildMissionControlHref(routeState, searchParams), { scroll: false });
    });
  }, [routeState, router, searchParams]);

  useEffect(() => {
    if (skipInitialSummaryFetch.current) {
      skipInitialSummaryFetch.current = false;
      return;
    }

    const requestId = summaryRequestId.current + 1;
    summaryRequestId.current = requestId;

    fetchJson<MissionControlSummary>("/api/spacex/summary", isMissionControlSummary)
      .then((payload) => {
        if (!isMounted.current || summaryRequestId.current !== requestId) {
          return;
        }

        setSummary(payload);
        setSummaryError(null);
      })
      .catch((error: Error) => {
        if (!isMounted.current || summaryRequestId.current !== requestId) {
          return;
        }

        setSummaryError(error.message);
      })
      .finally(() => {
        if (!isMounted.current || summaryRequestId.current !== requestId) {
          return;
        }

        setSummaryLoading(false);
      });
  }, [summaryFetchKey]);

  useEffect(() => {
    if (skipInitialLaunchesFetch.current) {
      skipInitialLaunchesFetch.current = false;
      return;
    }

    const requestId = launchesRequestId.current + 1;
    launchesRequestId.current = requestId;

    fetchJson<{ launches: MissionLaunchCard[] }>(
      `/api/spacex/launches?status=${routeState.status}&limit=10`,
      isLaunchesPayload,
    )
      .then((payload) => {
        if (!isMounted.current || launchesRequestId.current !== requestId) {
          return;
        }

        setLaunches(payload.launches);
        setLaunchesError(null);
      })
      .catch((error: Error) => {
        if (!isMounted.current || launchesRequestId.current !== requestId) {
          return;
        }

        setLaunchesError(error.message);
      })
      .finally(() => {
        if (!isMounted.current || launchesRequestId.current !== requestId) {
          return;
        }

        setLaunchesLoading(false);
      });
  }, [routeState.status, launchesFetchKey]);

  useEffect(() => {
    if (!routeState.launch) {
      return;
    }

    if (skipInitialDetailFetch.current) {
      skipInitialDetailFetch.current = false;
      return;
    }

    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;

    fetchJson<MissionLaunchDetail>(
      `/api/spacex/launches/${routeState.launch}`,
      isMissionLaunchDetail,
    )
      .then((payload) => {
        if (!isMounted.current || detailRequestId.current !== requestId) {
          return;
        }

        setDetail(payload);
        setDetailError(null);
      })
      .catch((error: Error) => {
        if (!isMounted.current || detailRequestId.current !== requestId) {
          return;
        }

        setDetailError(error.message);
      })
      .finally(() => {
        if (!isMounted.current || detailRequestId.current !== requestId) {
          return;
        }

        setDetailLoading(false);
      });
  }, [routeState.launch, detailFetchKey]);

  useEffect(() => {
    if (!routeState.launch || launchesLoading) {
      return;
    }

    const selectedLaunchStillVisible = launches.some((launch) => launch.id === routeState.launch);
    if (selectedLaunchStillVisible) {
      return;
    }

    startTransition(() => {
      router.replace(
        buildMissionControlHref(
          {
            ...routeState,
            launch: null,
            panel: DEFAULT_MISSION_CONTROL_STATE.panel,
          },
          searchParams
        ),
        { scroll: false }
      );
    });
  }, [launches, launchesLoading, routeState, router, searchParams]);

  const refreshLiveData = useCallback(
    (options?: { showLoading?: boolean; dedupe?: boolean }) => {
      const now = Date.now();
      if (options?.dedupe && now - lastLiveRefreshAt.current < LIVE_REFRESH_DEDUPE_MS) {
        return;
      }

      lastLiveRefreshAt.current = now;

      if (options?.showLoading) {
        setSummaryLoading(true);
        setSummaryError(null);
        setLaunchesLoading(true);
        setLaunchesError(null);

        if (selectedLaunchIdRef.current) {
          setDetailLoading(true);
          setDetailError(null);
        }
      }

      setSummaryFetchKey((value) => value + 1);
      setLaunchesFetchKey((value) => value + 1);

      if (selectedLaunchIdRef.current) {
        setDetailFetchKey((value) => value + 1);
      }
    },
    []
  );

  // Track consecutive fetch failures so the live-refresh interval can back
  // off when the API is unhealthy.
  const consecutiveFailuresRef = useRef(0);
  useEffect(() => {
    if (summaryError || launchesError) {
      consecutiveFailuresRef.current += 1;
    } else if (summary && (launches.length > 0 || launchesLoading)) {
      consecutiveFailuresRef.current = 0;
    }
  }, [summaryError, launchesError, summary, launches.length, launchesLoading]);

  useEffect(() => {
    const refreshOnResume = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshLiveData({ dedupe: true });
    };

    let timerId: number | null = null;

    function nextDelay(): number {
      const failures = consecutiveFailuresRef.current;
      if (failures === 0) return LIVE_REFRESH_INTERVAL_MS;
      const backoff = LIVE_REFRESH_INTERVAL_MS * Math.pow(2, failures);
      return Math.min(backoff, LIVE_REFRESH_MAX_INTERVAL_MS);
    }

    function schedule() {
      if (timerId !== null) window.clearTimeout(timerId);
      timerId = window.setTimeout(tick, nextDelay());
    }

    function tick() {
      if (document.visibilityState === "visible") {
        refreshLiveData({ dedupe: true });
      }
      schedule();
    }

    schedule();
    document.addEventListener("visibilitychange", refreshOnResume);
    window.addEventListener("focus", refreshOnResume);

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", refreshOnResume);
      window.removeEventListener("focus", refreshOnResume);
    };
  }, [refreshLiveData]);

  function updateRouteState(
    nextState: Partial<MissionControlSearchState>,
    options?: { replace?: boolean }
  ) {
    const href = buildMissionControlHref(
      {
        ...routeState,
        ...nextState,
      },
      searchParams
    );

    startTransition(() => {
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    });
  }

  function handleStatusChange(status: MissionControlStatus) {
    setLaunchesLoading(true);
    setLaunchesError(null);
    setLaunches([]);
    setDetailLoading(false);
    setDetailError(null);
    setDetail(null);
    updateRouteState({
      status,
      launch: null,
      panel: DEFAULT_MISSION_CONTROL_STATE.panel,
    });
  }

  function handleHeroInspect() {
    const heroLaunch = summary?.heroLaunch;
    if (!heroLaunch) {
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    updateRouteState({
      status:
        summary?.heroMode === "fallback"
          ? "past"
          : heroLaunch.upcoming
            ? "upcoming"
            : "past",
      launch: heroLaunch.id,
      panel: "overview",
    });
  }

  function handleRetryAll() {
    refreshLiveData({ showLoading: true });
  }

  const hasPartialDataIssue =
    Boolean(summaryError && summary) ||
    Boolean(launchesError && launches.length > 0) ||
    Boolean(detailError && routeState.launch);
  const liveStatusLabel =
    summaryLoading || launchesLoading
      ? "Refreshing SpaceX feed"
      : "SpaceX data cached locally";

  // The fleet figures, all from the same `buildInsights()` aggregate the board
  // relies on elsewhere, printed as one line of text in the masthead. Only
  // fields that are populated today are shown, so nothing here is fabricated.
  const fleetFigures: MissionFleetFigure[] = useMemo(() => {
    const insightByLabel = new Map((summary?.insights ?? []).map((insight) => [
      insight.label.toLowerCase(),
      insight,
    ]));

    const rows: Array<{ key: string; label: string }> = [
      { key: "completed archive", label: "Flights to date" },
      { key: "historical success", label: "Success rate" },
      { key: "upcoming queue", label: "Upcoming queue" },
      { key: "active rockets", label: "Active rockets" },
    ];

    return rows
      .map(({ key, label }) => {
        const insight = insightByLabel.get(key);
        return insight ? { label, value: insight.value } : null;
      })
      .filter((figure): figure is MissionFleetFigure => Boolean(figure));
  }, [summary]);

  // Recovery has a tab only when the snapshot carries booster and landing records.
  const hasRecovery = aggregateMissionRecovery(vehicleCatalogDetails) !== null;
  const sectionOptions = hasRecovery
    ? SECTION_OPTIONS
    : SECTION_OPTIONS.filter((option) => option.key !== "recovery");

  function handleCloseDrawer() {
    setDetailLoading(false);
    setDetailError(null);
    setDetail(null);
    updateRouteState({ launch: null, panel: DEFAULT_MISSION_CONTROL_STATE.panel });
  }

  const onSectionTabKey = useTablistKeyboard(sectionOptions, (option) => setSection(option.key));

  return (
    <div className="sx-root">
      <div className="sx-console">
        <div className="c97-shell c97-frame sx-console-inner">
          <header className="sx-head">
            <div className="sx-head-text">
              <h1 className="sx-title">SpaceX Mission Control</h1>
              <p className="sx-standfirst">
                The next launch, the launch queue, and every mission&apos;s rocket, payload, crew,
                capsule, and pad, from one board.
              </p>
            </div>
            <div className="sx-status">
              <p className="sx-status-line">
                <span className="sx-live" data-state={summaryLoading || launchesLoading ? "busy" : "idle"}>
                  {liveStatusLabel}
                </span>
                {` · Launch Library 2 data from The Space Devs${
                  summary ? `, snapshot from ${formatUpdatedAt(summary.generatedAt)}` : ""
                }, served through this site's own routes. An independent project, not affiliated with SpaceX.`}
              </p>
              <button type="button" onClick={handleRetryAll} className="sx-button-ghost">
                <RefreshCcw aria-hidden="true" className="h-4 w-4" />
                Refresh data
              </button>
            </div>
          </header>

          {hasPartialDataIssue ? (
            <p role="status" className="sx-degraded">
              <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
              One or more requests degraded, but the workspace is still usable. Countdown timers are
              intentionally suppressed when the provider&apos;s scheduled timestamp is already in the
              past or not precise enough to trust as an exact launch time.
            </p>
          ) : null}

          <MissionControlHero
            summary={summary}
            fleet={fleetFigures}
            isLoading={summaryLoading}
            error={summaryError}
            initialRenderTimestampMs={renderedAtMs}
            onInspect={handleHeroInspect}
            onRetry={() => {
              setSummaryLoading(true);
              setSummaryError(null);
              setSummaryFetchKey((value) => value + 1);
            }}
          />

          <MissionLaunchTape
            recentLaunches={tapeRecentLaunches}
            upcomingLaunches={tapeUpcomingLaunches}
          />
        </div>
      </div>

      <section id="mission-manifest" className="c97-shell c97-frame sx-manifest" aria-labelledby="mission-manifest-title">
        <h2 id="mission-manifest-title" className="sr-only">Launch manifest</h2>
        <div className="sx-toolbar">
          <div role="tablist" aria-label="Mission control sections" className="sx-tabs">
            {sectionOptions.map((option, index) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                id={`mission-section-tab-${option.key}`}
                aria-selected={section === option.key}
                aria-controls="mission-section-panel"
                onKeyDown={(event) => onSectionTabKey(event, index)}
                onClick={() => setSection(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <MissionCadenceStrip cadence={cadence} />
        </div>

        <div role="tabpanel" id="mission-section-panel" aria-labelledby={`mission-section-tab-${section}`}>
          {section === "manifest" ? (
            <MissionLaunchBoard
              launches={launches}
              status={routeState.status}
              selectedLaunchId={routeState.launch}
              isLoading={launchesLoading || detailLoading}
              error={launchesError}
              onStatusChange={handleStatusChange}
              onSelectLaunch={(id) => {
                setDetailLoading(true);
                setDetailError(null);
                setDetail(null);
                updateRouteState({ launch: id, panel: "overview" });
              }}
              onRetry={() => {
                setLaunchesLoading(true);
                setLaunchesError(null);
                setLaunches([]);
                setLaunchesFetchKey((value) => value + 1);
              }}
            />
          ) : section === "vehicles" ? (
            <MissionVehicleCatalog launchDetails={vehicleCatalogDetails} />
          ) : (
            <MissionRecoveryPanel launchDetails={vehicleCatalogDetails} />
          )}
        </div>
      </section>

      <DeferredMissionDrawer
        launchId={routeState.launch}
        detail={routeState.launch ? detail : null}
        activePanel={routeState.panel}
        isLoading={routeState.launch ? detailLoading : false}
        error={routeState.launch ? detailError : null}
        onPanelChange={(panel) => updateRouteState({ panel })}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
