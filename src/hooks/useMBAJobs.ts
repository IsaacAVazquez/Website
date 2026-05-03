"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  MBAJob,
  MBAJobsApiResponse,
  MBAJobsFetchError,
} from "@/types/mba-jobs";
import { MBA_COMPANIES } from "@/constants/mba-companies";

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const SEEN_IDS_KEY = "mba_seen_job_ids_v1";
const WATCHED_KEY = "mba_watched_companies_v2";

const POLL_INTERVAL_MS = 30 * 60 * 1_000; // 30 minutes
const DEDUPE_WINDOW_MS = 2_000;

// ---------------------------------------------------------------------------
// Default watched companies (all non-manual)
// ---------------------------------------------------------------------------

const DEFAULT_WATCHED_IDS = new Set<string>(
  MBA_COMPANIES.filter((c) => c.atsType !== "manual").map((c) => c.id)
);

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function safeParseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return new Set(safeParseStringArray(localStorage.getItem(SEEN_IDS_KEY)));
}

function saveSeenIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(Array.from(ids)));
  emitSeenChange();
}

function loadWatchedCompanies(): Set<string> {
  if (typeof window === "undefined") return new Set(DEFAULT_WATCHED_IDS);
  const raw = localStorage.getItem(WATCHED_KEY);
  if (!raw) return new Set(DEFAULT_WATCHED_IDS);
  const parsed = safeParseStringArray(raw);
  return parsed.length > 0 ? new Set(parsed) : new Set(DEFAULT_WATCHED_IDS);
}

function saveWatchedCompanies(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHED_KEY, JSON.stringify(Array.from(ids)));
}

// ---------------------------------------------------------------------------
// useSyncExternalStore for seen IDs (cross-tab sync)
// ---------------------------------------------------------------------------

const seenListeners = new Set<() => void>();

function emitSeenChange() {
  seenListeners.forEach((l) => l());
}

function subscribeSeenIds(listener: () => void) {
  seenListeners.add(listener);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === SEEN_IDS_KEY) listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    seenListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSeenSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(SEEN_IDS_KEY) ?? "[]";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseMBAJobsResult {
  jobs: MBAJob[];
  isLoading: boolean;
  error: string | null;
  fetchErrors: MBAJobsFetchError[];
  lastFetchedAt: Date | null;
  seenIds: Set<string>;
  watchedCompanyIds: Set<string>;
  notificationPermission: NotificationPermission | "unsupported";
  newJobCount: number;
  markJobSeen: (id: string) => void;
  markAllSeen: () => void;
  toggleCompany: (id: string) => void;
  setAllCompanies: (enabled: boolean) => void;
  requestNotificationPermission: () => Promise<void>;
  refresh: () => void;
  sendEmailDigest: (to: string, jobsToSend?: MBAJob[]) => Promise<void>;
  emailSending: boolean;
  emailResult: { ok: boolean; message: string } | null;
  clearEmailResult: () => void;
}

export function useMBAJobs(): UseMBAJobsResult {
  // ── Seen IDs (external store for cross-tab sync) ───────────────────────
  const rawSeenSnapshot = useSyncExternalStore(
    subscribeSeenIds,
    getSeenSnapshot,
    () => "[]"
  );
  const seenIds = useMemo<Set<string>>(
    () => new Set(safeParseStringArray(rawSeenSnapshot)),
    [rawSeenSnapshot]
  );
  // Use a ref so fetchJobs doesn't depend on seenIds (avoids restarting poll)
  const seenIdsRef = useRef(seenIds);
  useEffect(() => {
    seenIdsRef.current = seenIds;
  }, [seenIds]);

  // ── Watched companies ──────────────────────────────────────────────────
  const [watchedCompanyIds, setWatchedCompanyIds] = useState<Set<string>>(
    () => loadWatchedCompanies()
  );
  // Use a ref so fetchJobs can read latest watched without re-triggering
  const watchedRef = useRef(watchedCompanyIds);
  useEffect(() => {
    watchedRef.current = watchedCompanyIds;
  }, [watchedCompanyIds]);

  // ── Notification permission ────────────────────────────────────────────
  // Always start "unsupported" on both server and first client render so
  // hydration matches; resolve the real permission in an effect after mount.
  // Reading window.Notification synchronously in the initializer caused
  // the bell to render conditionally in different positions across server
  // and client, triggering a hydration mismatch around NotificationBell.
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Resolve real Notification permission after mount to avoid SSR hydration mismatch (see comment above)
    setNotificationPermission(Notification.permission);
  }, []);

  // ── Fetch state ────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<MBAJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchErrors, setFetchErrors] = useState<MBAJobsFetchError[]>([]);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const lastRefreshAtRef = useRef(0);
  const prevJobIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Email state ────────────────────────────────────────────────────────
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; message: string } | null>(null);

  // ── Notification helper ────────────────────────────────────────────────
  const fireNotification = useCallback((count: number, sample?: MBAJob) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const title =
      count === 1
        ? `New MBA role at ${sample?.companyName ?? "a tracked company"}`
        : `${count} new MBA roles found`;
    const body = sample?.title ?? "Open the tracker to review new postings.";
    try {
      new Notification(title, { body, icon: "/favicon.png" });
    } catch {
      // Notification constructor may throw in certain browser contexts
    }
  }, []);

  // ── Core fetch ─────────────────────────────────────────────────────────
  const fetchJobs = useCallback(
    async (opts?: { dedupe?: boolean; showLoading?: boolean }) => {
      const now = Date.now();
      if (opts?.dedupe && now - lastRefreshAtRef.current < DEDUPE_WINDOW_MS)
        return;
      lastRefreshAtRef.current = now;

      const requestId = ++requestIdRef.current;
      if (opts?.showLoading !== false) {
        setIsLoading(true);
        setError(null);
      }

      const watched = Array.from(watchedRef.current).join(",");
      const url = watched ? `/api/mba-jobs?companies=${encodeURIComponent(watched)}` : "/api/mba-jobs";

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as MBAJobsApiResponse;

        if (!isMountedRef.current || requestIdRef.current !== requestId) return;

        // Detect new jobs (only after the first successful load)
        if (prevJobIdsRef.current.size > 0) {
          const newJobs = data.jobs.filter(
            (j) => !seenIdsRef.current.has(j.id) && !prevJobIdsRef.current.has(j.id)
          );
          if (newJobs.length > 0) {
            fireNotification(newJobs.length, newJobs[0]);
          }
        }
        prevJobIdsRef.current = new Set(data.jobs.map((j) => j.id));

        setJobs(data.jobs);
        setFetchErrors(data.errors ?? []);
        setLastFetchedAt(new Date(data.fetchedAt));
        setError(null);
      } catch (err) {
        if (!isMountedRef.current || requestIdRef.current !== requestId) return;
        setError((err as Error)?.message ?? "Failed to load jobs.");
      } finally {
        if (isMountedRef.current && requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [fireNotification]
  );

  // ── Initial fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-shot mount-time fetch; fetchJobs internally manages loading/error state
    fetchJobs({ showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling + visibility-aware refresh ────────────────────────────────
  useEffect(() => {
    const refreshOnResume = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchJobs({ dedupe: true, showLoading: false });
    };

    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchJobs({ dedupe: true, showLoading: false });
    }, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", refreshOnResume);
    window.addEventListener("focus", refreshOnResume);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshOnResume);
      window.removeEventListener("focus", refreshOnResume);
    };
  }, [fetchJobs]);

  // ── Re-fetch when watched companies change ─────────────────────────────
  // (but not on mount — initial fetch handles that)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchJobs({ showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCompanyIds]);

  // ── Derived ────────────────────────────────────────────────────────────
  const newJobCount = useMemo(
    () => jobs.filter((j) => !seenIds.has(j.id)).length,
    [jobs, seenIds]
  );

  // ── Actions ────────────────────────────────────────────────────────────
  function markJobSeen(id: string) {
    const next = new Set(Array.from(seenIds).concat(id));
    saveSeenIds(next);
  }

  function markAllSeen() {
    const next = new Set(Array.from(seenIds).concat(jobs.map((j) => j.id)));
    saveSeenIds(next);
  }

  function toggleCompany(id: string) {
    setWatchedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveWatchedCompanies(next);
      return next;
    });
  }

  function setAllCompanies(enabled: boolean) {
    const next = enabled ? new Set(DEFAULT_WATCHED_IDS) : new Set<string>();
    saveWatchedCompanies(next);
    setWatchedCompanyIds(next);
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
  }

  async function sendEmailDigest(to: string, jobsToSend?: MBAJob[]) {
    const payload = jobsToSend ?? jobs;
    if (payload.length === 0) return;
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/mba-jobs/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: payload, to }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setEmailResult({ ok: true, message: `Digest sent to ${to}` });
      } else {
        setEmailResult({ ok: false, message: data.error ?? "Failed to send digest." });
      }
    } catch (err) {
      setEmailResult({ ok: false, message: (err as Error)?.message ?? "Failed to send digest." });
    } finally {
      setEmailSending(false);
    }
  }

  function clearEmailResult() {
    setEmailResult(null);
  }

  return {
    jobs,
    isLoading,
    error,
    fetchErrors,
    lastFetchedAt,
    seenIds,
    watchedCompanyIds,
    notificationPermission,
    newJobCount,
    markJobSeen,
    markAllSeen,
    toggleCompany,
    setAllCompanies,
    requestNotificationPermission,
    refresh: () => fetchJobs({ dedupe: false, showLoading: true }),
    sendEmailDigest,
    emailSending,
    emailResult,
    clearEmailResult,
  };
}
