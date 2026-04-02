"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, DatabaseZap, RefreshCcw, Satellite } from "lucide-react";
import type {
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
}

const LIVE_REFRESH_INTERVAL_MS = 120_000;
const LIVE_REFRESH_DEDUPE_MS = 1_500;

function buildApiError(message: string, status: number): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw buildApiError(body.error ?? "Request failed", response.status);
  }

  return body;
}

export function SpaceXMissionControlClient({
  initialState,
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

  const [summary, setSummary] = useState<MissionControlSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryFetchKey, setSummaryFetchKey] = useState(0);

  const [launches, setLaunches] = useState<MissionLaunchCard[]>([]);
  const [launchesLoading, setLaunchesLoading] = useState(true);
  const [launchesError, setLaunchesError] = useState<string | null>(null);
  const [launchesFetchKey, setLaunchesFetchKey] = useState(0);

  const [detail, setDetail] = useState<MissionLaunchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(Boolean(initialState.launch));
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailFetchKey, setDetailFetchKey] = useState(0);

  const summaryRequestId = useRef(0);
  const launchesRequestId = useRef(0);
  const detailRequestId = useRef(0);
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
    const requestId = summaryRequestId.current + 1;
    summaryRequestId.current = requestId;

    fetchJson<MissionControlSummary>("/api/spacex/summary")
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
    const requestId = launchesRequestId.current + 1;
    launchesRequestId.current = requestId;

    fetchJson<{ launches: MissionLaunchCard[] }>(
      `/api/spacex/launches?status=${routeState.status}&limit=10`
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

    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;

    fetchJson<MissionLaunchDetail>(`/api/spacex/launches/${routeState.launch}`)
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

  useEffect(() => {
    const refreshOnResume = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshLiveData({ dedupe: true });
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshLiveData({ dedupe: true });
    }, LIVE_REFRESH_INTERVAL_MS);

    document.addEventListener("visibilitychange", refreshOnResume);
    window.addEventListener("focus", refreshOnResume);

    return () => {
      window.clearInterval(intervalId);
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
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_32%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--color-success)_8%,transparent),transparent_28%),linear-gradient(180deg,var(--surface-primary)_0%,color-mix(in_srgb,var(--surface-secondary)_70%,var(--surface-primary))_100%)]"
    >
      <div className="mx-auto w-full max-w-[1700px] px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12">
        <motion.div
          className="mb-6 overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_7%,var(--surface-elevated))_0%,var(--surface-elevated)_50%,color-mix(in_srgb,var(--color-success)_7%,var(--surface-elevated))_100%)] p-6 shadow-[var(--shadow-md)] sm:p-8"
          {...motionProps}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_24%,var(--border-primary))] bg-[color-mix(in_srgb,var(--surface-primary)_72%,transparent)] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
                  SpaceX Mission Control
                </span>
                <span className="rounded-full border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  Local API backed
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
                A launch board built like an operations room, not a brochure.
              </h1>

              <p className="mt-4 max-w-[72ch] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.95rem]">
                Track the next mission, scan the upcoming or past queue, and open a
                relationship-aware detail rail for rockets, payloads, crew, capsules, and
                launch infrastructure without leaving the page.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
              <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Data flow
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Server-cached live reads
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Route state
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Deep-linked mission context
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  UX posture
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Fan-first operations view
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRetryAll}
              className="tap-target inline-flex items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh live data
            </button>
            <div className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <DatabaseZap className="h-4 w-4 text-[var(--color-primary)]" />
              Local routes proxy and normalize upstream SpaceX responses before they reach the browser.
            </div>
          </div>

          {hasPartialDataIssue ? (
            <div className="mt-5 flex items-start gap-3 rounded-[24px] border border-[color-mix(in_srgb,var(--color-warning)_20%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-warning)_8%,var(--surface-primary))] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
              <p>
                One or more live requests degraded, but the workspace is still usable.
                Countdown timers are intentionally suppressed when the provider&apos;s scheduled
                timestamp is already in the past or not precise enough to trust as an exact launch
                time.
              </p>
            </div>
          ) : null}
        </motion.div>

        <div className="space-y-6">
          <motion.div {...motionProps}>
            <MissionControlHero
              summary={summary}
              isLoading={summaryLoading}
              error={summaryError}
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
            className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]"
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
            <MissionDetailPanel
              launch={routeState.launch ? detail : null}
              activePanel={routeState.panel}
              isLoading={routeState.launch ? detailLoading : false}
              error={routeState.launch ? detailError : null}
              onPanelChange={(panel) => updateRouteState({ panel })}
            />
          </motion.div>
        </div>

        <div className="mt-8 rounded-[28px] border border-[var(--border-primary)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_6%,var(--surface-elevated))_0%,var(--surface-elevated)_100%)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-[72ch]">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Product note
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                This surface intentionally uses a local normalization layer instead of direct
                browser fetches. That keeps the UI stable even when the public SpaceX API returns
                stale scheduling data, partial relationships, or uneven populate behavior.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              <Satellite className="h-4 w-4 text-[var(--color-primary)]" />
              Query-linked launch detail
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
