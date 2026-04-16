"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  JOB_TRACKER_STORAGE_KEY,
  computeJobStats,
  createJobApplication,
  loadJobStore,
  parseJobStore,
  saveJobStore,
  type CreateJobInput,
} from "@/lib/jobTracker";
import type { JobApplication, JobApplicationStore, JobStatus } from "@/types/jobsearch";

const jobTrackerListeners = new Set<() => void>();

function emitJobTrackerChange() {
  jobTrackerListeners.forEach((listener) => listener());
}

function subscribeJobTrackerChange(listener: () => void) {
  jobTrackerListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === JOB_TRACKER_STORAGE_KEY) {
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    jobTrackerListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getJobTrackerSnapshot() {
  if (typeof window === "undefined") return '{"applications":[]}';
  return window.localStorage.getItem(JOB_TRACKER_STORAGE_KEY) ?? '{"applications":[]}';
}

function getServerSnapshot() {
  return '{"applications":[]}';
}

export function useJobTracker() {
  const snapshot = useSyncExternalStore(
    subscribeJobTrackerChange,
    getJobTrackerSnapshot,
    getServerSnapshot
  );

  const store = useMemo(() => parseJobStore(snapshot), [snapshot]);
  const stats = useMemo(() => computeJobStats(store.applications), [store.applications]);

  function mutate(updater: (store: JobApplicationStore) => JobApplicationStore) {
    const current = loadJobStore();
    const next = updater(current);
    saveJobStore(next);
    emitJobTrackerChange();
  }

  function addApplication(input: CreateJobInput) {
    const app = createJobApplication(input);
    mutate((s) => ({ applications: [app, ...s.applications] }));
    return app;
  }

  function updateApplication(id: string, updates: Partial<Omit<JobApplication, "id" | "dateAdded">>) {
    mutate((s) => ({
      applications: s.applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      ),
    }));
  }

  function updateStatus(id: string, status: JobStatus) {
    const updates: Partial<JobApplication> = { status };
    if (status === "applied") {
      const current = store.applications.find((a) => a.id === id);
      if (current && !current.dateApplied) {
        updates.dateApplied = new Date().toISOString().slice(0, 10);
      }
    }
    updateApplication(id, updates);
  }

  function removeApplication(id: string) {
    mutate((s) => ({
      applications: s.applications.filter((app) => app.id !== id),
    }));
  }

  function getApplication(id: string): JobApplication | undefined {
    return store.applications.find((app) => app.id === id);
  }

  return {
    applications: store.applications,
    stats,
    addApplication,
    updateApplication,
    updateStatus,
    removeApplication,
    getApplication,
  };
}
