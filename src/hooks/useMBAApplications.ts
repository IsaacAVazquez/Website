"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  buildMBAApplicationsCsv,
  buildMBAApplicationsExport,
  buildMBAApplicationSearchText,
  createManualMBAApplication,
  createMBAApplicationFromJob,
  loadMBAApplications,
  MBA_APPLICATIONS_STORAGE_KEY,
  mergeMBAApplications,
  parseMBAApplications,
  parseMBAApplicationsImport,
  saveMBAApplications,
  updateMBAApplicationStatus,
  type MBAApplicationDraft,
} from "@/lib/mba-applications";
import type {
  MBAApplicationJobSnapshot,
  MBAApplicationPriority,
  MBAApplicationStatus,
  MBAJob,
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
  >
> & {
  jobSnapshot?: Partial<
    Pick<
      MBAApplicationJobSnapshot,
      "companyName" | "title" | "location" | "department" | "applyUrl"
    >
  >;
};

const applicationListeners = new Set<() => void>();

function emitMBAApplicationsChange() {
  applicationListeners.forEach((listener) => listener());
}

function subscribeMBAApplications(listener: () => void) {
  applicationListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === MBA_APPLICATIONS_STORAGE_KEY) {
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    applicationListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getMBAApplicationsSnapshot() {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(MBA_APPLICATIONS_STORAGE_KEY) ?? "[]";
}

function commitApplications(updater: (current: MBATrackedApplication[]) => MBATrackedApplication[]) {
  const current = loadMBAApplications();
  const next = updater(current);
  saveMBAApplications(next);
  emitMBAApplicationsChange();
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
  const storedSnapshot = useSyncExternalStore(
    subscribeMBAApplications,
    getMBAApplicationsSnapshot,
    () => "[]"
  );

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
  };
}
