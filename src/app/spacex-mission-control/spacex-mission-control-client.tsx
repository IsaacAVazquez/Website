"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, DatabaseZap, Link2, RefreshCcw } from "lucide-react";
import type {
  MissionControlInitialData,
  MissionControlSearchState,
  MissionControlSummary,
  MissionLaunchCard,
  MissionLaunchDetail,
  MissionControlStatus,
} from "@/types/spacex";
import { MissionControlHero } from "@/components/spacex/MissionControlHero";
import { MissionInsightsStrip } from "@/components/spacex/MissionInsightsStrip";
import { MissionLaunchBoard } from "@/components/spacex/MissionLaunchBoard";
import { MissionDetailPanel } from "@/components/spacex/MissionDetailPanel";
import {
  buildMissionControlHref,
  DEFAULT_MISSION_CONTROL_STATE,
  normalizeMissionControlState,
} from "./spacex-mission-control-state";

interface SpaceXMissionControlClientProps {
  initialState: MissionControlSearchState;
  initialData?: MissionControlInitialData;
  renderedAtMs?: number;
}

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
  return "stats" in candidate && "nextLaunch" in candidate;
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
  renderedAtMs = Date.now(),
}: SpaceXMissionControlClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
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

  const motionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.42 },
      };

  return (
    <section
      aria-label="SpaceX Mission Control"
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--home-haze)_12%,transparent),transparent_32%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--home-moss)_10%,transparent),transparent_28%),linear-gradient(180deg,var(--home-paper)_0%,color-mix(in_srgb,var(--home-paper-alt)_70%,var(--home-paper))_100%)]"
    >
      <div className="mx-auto w-full max-w-[1700px] px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8 xl:px-10 2xl:px-12">
        <motion.div
          className="mb-5 overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--home-haze)_14%,var(--home-rule))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--home-haze)_7%,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix)))_0%,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))_50%,color-mix(in_srgb,var(--home-moss)_8%,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix)))_100%)] p-5 shadow-[var(--shadow-md)] sm:p-6"
          {...motionProps}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[color-mix(in_srgb,var(--home-haze)_24%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-paper)_72%,transparent)] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--home-haze)]">
                SpaceX Mission Control
              </span>
              <span className="rounded-full border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] px-3 py-1 text-xs font-medium text-[var(--home-ink-muted)]">
                Local API backed
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-[var(--home-ink)] sm:text-[2.9rem]">
              A launch board built like an operations room, not a brochure.
            </h1>

            <p className="mt-3 max-w-[64ch] text-sm leading-7 text-[var(--home-ink-muted)] sm:text-[0.95rem]">
              Next mission, launch queue, and a detail panel for rockets, crew, payloads,
              capsules, and pads. Everything stays connected so you don&apos;t lose the thread when you drill in.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRetryAll}
                className="tap-target inline-flex items-center gap-2 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))] px-4 py-3 text-sm font-semibold text-[var(--home-ink)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh data
              </button>
              <div className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 py-3 text-sm text-[var(--home-ink-muted)]">
                <DatabaseZap className="h-4 w-4 text-[var(--home-haze)]" />
                {liveStatusLabel}
              </div>
              <div className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 py-3 text-sm text-[var(--home-ink-muted)]">
                <Link2 className="h-4 w-4 text-[var(--home-haze)]" />
                Query-linked mission detail
              </div>
            </div>

            {hasPartialDataIssue ? (
              <div
                role="status"
                className="mt-4 flex items-start gap-3 rounded-[24px] border border-[color-mix(in_srgb,var(--home-acid)_28%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-acid)_10%,var(--home-paper))] px-4 py-3 text-sm leading-6 text-[var(--home-ink-muted)]"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[color-mix(in_srgb,var(--home-acid)_55%,var(--home-ink))]"
                />
                <p>
                  One or more requests degraded, but the workspace is still usable.
                  Countdown timers are intentionally suppressed when the provider&apos;s
                  scheduled timestamp is already in the past or not precise enough to trust
                  as an exact launch time.
                </p>
              </div>
            ) : null}
          </div>
        </motion.div>

        <div className="space-y-5">
          <motion.div {...motionProps}>
            <MissionControlHero
              summary={summary}
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
          </motion.div>

          <motion.div {...motionProps}>
            <MissionInsightsStrip
              insights={summary?.insights ?? []}
              isLoading={summaryLoading}
            />
          </motion.div>

          <motion.div
            className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] xl:items-start"
            {...motionProps}
          >
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
            <div className="xl:sticky xl:top-28 xl:self-start">
              <MissionDetailPanel
                launch={routeState.launch ? detail : null}
                activePanel={routeState.panel}
                isLoading={routeState.launch ? detailLoading : false}
                error={routeState.launch ? detailError : null}
                onPanelChange={(panel) => updateRouteState({ panel })}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
