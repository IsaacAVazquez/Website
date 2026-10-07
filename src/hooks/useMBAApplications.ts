"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import {
  buildMBAApplicationsCsv,
  buildMBAApplicationsExport,
  buildMBAApplicationSearchText,
  createManualMBAApplication,
  createMBAApplicationFromJob,
  loadMBAApplications,
  MBA_APPLICATIONS_STORAGE_KEY,
  mergeMBAApplications,
  mergeMBAJobCandidates,
  parseMBAApplications,
  parseMBAApplicationsImport,
  parseMBAJobCandidates,
  saveMBAApplications,
  updateMBAApplicationStatus,
  type MBAApplicationDraft,
} from "@/lib/mba-applications";
import type {
  MBAApplicationJobSnapshot,
  MBAApplicationPriority,
  MBAApplicationStatus,
  MBACandidateTriage,
  MBAJob,
  MBAJobCandidate,
  MBATrackedApplication,
} from "@/types/mba-jobs";

type MBAApplicationUpdate = Partial<
  Pick<
    MBATrackedApplication,
    | "status"
    | "priority"
    | "notes"
    | "contact"
    | "sourceUrl"
    | "followUpDate"
    | "deadline"
    | "fit"
    | "appliedVia"
    | "materialsDir"
    | "interviewRounds"
  >
> & {
  jobSnapshot?: Partial<
    Pick<
      MBAApplicationJobSnapshot,
      "companyName" | "title" | "location" | "department" | "applyUrl"
    >
  >;
};

function commitApplications(updater: (current: MBATrackedApplication[]) => MBATrackedApplication[]) {
  const current = loadMBAApplications();
  const next = updater(current);
  saveMBAApplications(next);
  return next;
}

function findMatchingApplication(
  applications: MBATrackedApplication[],
  job: MBAJob
): MBATrackedApplication | undefined {
  const normalizedApplyUrl = job.applyUrl.trim().replace(/\/+$/, "").toLowerCase();
  return applications.find((application) => {
    if (application.jobId && application.jobId === job.id) return true;
    const applicationUrl = application.jobSnapshot.applyUrl
      .trim()
      .replace(/\/+$/, "")
      .toLowerCase();
    return !!normalizedApplyUrl && applicationUrl === normalizedApplyUrl;
  });
}

function visibleApplication(application: MBATrackedApplication) {
  return application.status !== "archived";
}

export function useMBAApplications() {
  const storedSnapshot = useLocalStorageString(MBA_APPLICATIONS_STORAGE_KEY, "[]");
  const privateSync = usePrivatePipelineSync(storedSnapshot);

  const applications = useMemo(
    () => parseMBAApplications(storedSnapshot),
    [storedSnapshot]
  );
  const activeApplications = useMemo(
    () => applications.filter(visibleApplication),
    [applications]
  );

  const applicationsByJobId = useMemo(() => {
    const map = new Map<string, MBATrackedApplication>();
    for (const application of applications) {
      if (application.jobId) map.set(application.jobId, application);
    }
    return map;
  }, [applications]);

  const getApplicationForJob = useCallback(
    (job: MBAJob) => findMatchingApplication(applications, job),
    [applications]
  );

  const trackJob = useCallback(
    (job: MBAJob, status: MBAApplicationStatus = "saved") => {
      let tracked: MBATrackedApplication | null = null;
      commitApplications((current) => {
        const now = new Date();
        const existing = findMatchingApplication(current, job);
        if (!existing) {
          tracked = createMBAApplicationFromJob(job, status, now);
          return mergeMBAApplications(current, [tracked]);
        }

        const nextStatus =
          status === "saved" && existing.status !== "saved" ? existing.status : status;
        const updated =
          nextStatus === existing.status
            ? {
                ...existing,
                jobId: existing.jobId ?? job.id,
                jobSnapshot: {
                  ...existing.jobSnapshot,
                  ...job,
                  capturedAt: now.toISOString(),
                  source: "live-feed" as const,
                },
                updatedAt: now.toISOString(),
              }
            : updateMBAApplicationStatus(
                {
                  ...existing,
                  jobId: existing.jobId ?? job.id,
                  jobSnapshot: {
                    ...existing.jobSnapshot,
                    ...job,
                    capturedAt: now.toISOString(),
                    source: "live-feed" as const,
                  },
                },
                nextStatus,
                now
              );
        tracked = updated;
        return current.map((application) =>
          application.id === existing.id ? updated : application
        );
      });
      return tracked;
    },
    []
  );

  const addManualApplication = useCallback((draft: MBAApplicationDraft) => {
    let created: MBATrackedApplication | null = null;
    commitApplications((current) => {
      created = createManualMBAApplication(draft);
      return created ? mergeMBAApplications(current, [created]) : current;
    });
    return created;
  }, []);

  const updateApplication = useCallback(
    (id: string, updates: MBAApplicationUpdate) => {
      commitApplications((current) =>
        current.map((application) => {
          if (application.id !== id) return application;

          const now = new Date();
          const timestamp = now.toISOString();
          const status = updates.status ?? application.status;
          const base =
            status === application.status
              ? application
              : updateMBAApplicationStatus(application, status, now);

          return {
            ...base,
            priority: updates.priority ?? base.priority,
            notes: updates.notes ?? base.notes,
            contact: updates.contact ?? base.contact,
            sourceUrl: updates.sourceUrl ?? base.sourceUrl,
            followUpDate:
              updates.followUpDate === undefined
                ? base.followUpDate
                : updates.followUpDate,
            deadline:
              updates.deadline === undefined ? base.deadline : updates.deadline,
            fit: updates.fit === undefined ? base.fit : updates.fit,
            appliedVia: updates.appliedVia ?? base.appliedVia,
            materialsDir:
              updates.materialsDir === undefined ? base.materialsDir : updates.materialsDir,
            interviewRounds: updates.interviewRounds ?? base.interviewRounds,
            jobSnapshot: updates.jobSnapshot
              ? { ...base.jobSnapshot, ...updates.jobSnapshot }
              : base.jobSnapshot,
            updatedAt: timestamp,
          };
        })
      );
    },
    []
  );

  const updateStatus = useCallback(
    (id: string, status: MBAApplicationStatus) => {
      updateApplication(id, { status });
    },
    [updateApplication]
  );

  const updatePriority = useCallback(
    (id: string, priority: MBAApplicationPriority) => {
      updateApplication(id, { priority });
    },
    [updateApplication]
  );

  const archiveApplication = useCallback(
    (id: string) => {
      updateApplication(id, { status: "archived" });
    },
    [updateApplication]
  );

  const removeApplication = useCallback((id: string) => {
    commitApplications((current) => current.filter((application) => application.id !== id));
  }, []);

  const importApplications = useCallback((raw: string) => {
    const incoming = parseMBAApplicationsImport(raw);
    if (incoming.length === 0) {
      return { imported: 0, total: applications.length };
    }

    let total = applications.length;
    commitApplications((current) => {
      const merged = mergeMBAApplications(current, incoming);
      total = merged.length;
      return merged;
    });
    return { imported: incoming.length, total };
  }, [applications.length]);

  const exportJson = useCallback(() => {
    return JSON.stringify(buildMBAApplicationsExport(applications), null, 2);
  }, [applications]);

  const exportCsv = useCallback(() => {
    return buildMBAApplicationsCsv(applications);
  }, [applications]);

  function searchApplications(query: string, source = activeApplications) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((application) =>
      buildMBAApplicationSearchText(application).includes(normalized)
    );
  }

  return {
    applications,
    activeApplications,
    applicationsByJobId,
    getApplicationForJob,
    trackJob,
    addManualApplication,
    updateApplication,
    updateStatus,
    updatePriority,
    archiveApplication,
    removeApplication,
    importApplications,
    exportJson,
    exportCsv,
    searchApplications,
    privateSync,
  };
}

// ---------------------------------------------------------------------------
// Development-only sync with private/job-search/ through /api/job-search.
// Production never runs any of this: the route is a 404 there and the hooks
// return inert values, so the public dashboard stays localStorage only.
// ---------------------------------------------------------------------------

export interface MBAPrivateSyncState {
  lastSyncedAt: string | null;
  error: string | null;
}

interface SyncPayload {
  revision: string;
  items: unknown[];
}

const PRIVATE_SYNC_INTERVAL_MS = 30_000;
const PRIVATE_SYNC_PUSH_DELAY_MS = 500;

function syncUrl(file: "pipeline" | "candidates") {
  return `/api/job-search?file=${file}`;
}

async function readPayload(response: Response): Promise<SyncPayload> {
  const body = (await response.json()) as Partial<SyncPayload>;
  return {
    revision: typeof body.revision === "string" ? body.revision : "0",
    items: Array.isArray(body.items) ? body.items : [],
  };
}

function putJson(file: "pipeline" | "candidates", revision: string, items: unknown[]) {
  return fetch(syncUrl(file), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ revision, items }),
  });
}

/** Server items are already sanitized; the round trip only restores the type. */
function applicationsFromServer(items: unknown[]): MBATrackedApplication[] {
  return parseMBAApplications(JSON.stringify(items));
}

function candidatesFromServer(items: unknown[]): MBAJobCandidate[] {
  return parseMBAJobCandidates(JSON.stringify(items));
}

/** Runs `pull` on mount, on focus, when the tab becomes visible, and every 30 s. */
function usePullOnResume(enabled: boolean, pull: () => void) {
  useEffect(() => {
    if (!enabled) return;
    pull();
    const onResume = () => {
      if (document.visibilityState !== "visible") return;
      pull();
    };
    const intervalId = window.setInterval(onResume, PRIVATE_SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
    };
  }, [enabled, pull]);
}

/**
 * Keeps localStorage and private/job-search/pipeline.json in step while the
 * site runs under `next dev`. Pulls merge the file into localStorage (newer
 * `updatedAt` wins); a local edit pushes the whole list 500 ms later with the
 * last seen revision, and a 409 merges the server copy and retries once.
 */
export function usePrivatePipelineSync(storedSnapshot: string): MBAPrivateSyncState | null {
  const enabled = process.env.NODE_ENV === "development";
  const [state, setState] = useState<MBAPrivateSyncState>({ lastSyncedAt: null, error: null });
  const revisionRef = useRef("0");
  const readyRef = useRef(false);
  const pulledSnapshotRef = useRef<string | null>(null);
  const pushTimerRef = useRef<number | null>(null);

  // Merges server items into localStorage. Returns the merged list and whether
  // it holds anything the server does not, which is the signal to push.
  const absorb = useCallback((items: unknown[]) => {
    const server = applicationsFromServer(items);
    const merged = mergeMBAApplications(loadMBAApplications(), server);
    const next = JSON.stringify(merged);
    if (next !== JSON.stringify(loadMBAApplications())) {
      pulledSnapshotRef.current = next;
      saveMBAApplications(merged);
    }
    return { merged, localAhead: next !== JSON.stringify(server) };
  }, []);

  const push = useCallback(async () => {
    try {
      let response = await putJson("pipeline", revisionRef.current, loadMBAApplications());
      if (response.status === 409) {
        const current = await readPayload(response);
        revisionRef.current = current.revision;
        const { merged } = absorb(current.items);
        response = await putJson("pipeline", current.revision, merged);
      }
      if (!response.ok) throw new Error(`Sync write failed (${response.status}).`);
      revisionRef.current = (await readPayload(response)).revision;
      setState({ lastSyncedAt: new Date().toISOString(), error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
    }
  }, [absorb]);

  const schedulePush = useCallback(() => {
    if (pushTimerRef.current !== null) window.clearTimeout(pushTimerRef.current);
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null;
      void push();
    }, PRIVATE_SYNC_PUSH_DELAY_MS);
  }, [push]);

  const pull = useCallback(async () => {
    try {
      const response = await fetch(syncUrl("pipeline"));
      if (!response.ok) throw new Error(`Sync read failed (${response.status}).`);
      const payload = await readPayload(response);
      revisionRef.current = payload.revision;
      const { localAhead } = absorb(payload.items);
      readyRef.current = true;
      if (localAhead) schedulePush();
      else setState({ lastSyncedAt: new Date().toISOString(), error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
    }
  }, [absorb, schedulePush]);

  usePullOnResume(enabled, pull);

  // A local change pushes; a snapshot we just wrote from a pull does not.
  useEffect(() => {
    if (!enabled || !readyRef.current) return;
    if (storedSnapshot === pulledSnapshotRef.current) return;
    schedulePush();
  }, [enabled, storedSnapshot, schedulePush]);

  return enabled ? state : null;
}

/**
 * The sourced-but-not-promoted list in private/job-search/candidates.json.
 * Server state only, no localStorage: the skills write the file and the
 * dashboard triages it. Inert outside development.
 */
export function useMBAJobCandidates() {
  const enabled = process.env.NODE_ENV === "development";
  const [candidates, setCandidates] = useState<MBAJobCandidate[]>([]);
  const revisionRef = useRef("0");

  const pull = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await fetch(syncUrl("candidates"));
      if (!response.ok) return;
      const payload = await readPayload(response);
      revisionRef.current = payload.revision;
      setCandidates(candidatesFromServer(payload.items));
    } catch {
      // Keep the last good list; the next resume or interval retries.
    }
  }, [enabled]);

  usePullOnResume(enabled, pull);

  const put = useCallback(
    async (next: MBAJobCandidate[]) => {
      if (!enabled) return;
      setCandidates(next);
      try {
        let response = await putJson("candidates", revisionRef.current, next);
        if (response.status === 409) {
          const current = await readPayload(response);
          const merged = mergeMBAJobCandidates(candidatesFromServer(current.items), next);
          setCandidates(merged);
          response = await putJson("candidates", current.revision, merged);
        }
        if (!response.ok) return;
        const payload = await readPayload(response);
        revisionRef.current = payload.revision;
        setCandidates(candidatesFromServer(payload.items));
      } catch {
        // Local state already reflects the edit; the next pull reconciles.
      }
    },
    [enabled]
  );

  const setTriage = useCallback(
    (id: string, triage: MBACandidateTriage) => {
      const now = new Date().toISOString();
      void put(
        candidates.map((candidate) =>
          candidate.id === id ? { ...candidate, triage, updatedAt: now } : candidate
        )
      );
    },
    [candidates, put]
  );

  const removeCandidate = useCallback(
    (id: string) => {
      void put(candidates.filter((candidate) => candidate.id !== id));
    },
    [candidates, put]
  );

  return { candidates, enabled, setTriage, removeCandidate };
}
