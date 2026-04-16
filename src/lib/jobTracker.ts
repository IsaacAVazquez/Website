import type {
  JobApplication,
  JobApplicationStore,
  JobStatus,
  JobTrackerStats,
  WorkMode,
} from "@/types/jobsearch";

export const JOB_TRACKER_STORAGE_KEY = "job_tracker_v1";
export const JOB_TRACKER_CHANGE_EVENT = "job_tracker_change";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `job-${crypto.randomUUID()}`;
  }
  return `job-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const VALID_STATUSES = new Set<JobStatus>([
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

const VALID_WORK_MODES = new Set<WorkMode>(["remote", "hybrid", "onsite"]);

function sanitizeApplication(input: unknown): JobApplication | null {
  if (!isRecord(input)) return null;

  const company = typeof input.company === "string" ? input.company.trim() : "";
  const role = typeof input.role === "string" ? input.role.trim() : "";
  if (!company || !role) return null;

  const rawStatus = typeof input.status === "string" ? input.status : "";
  const status: JobStatus = VALID_STATUSES.has(rawStatus as JobStatus)
    ? (rawStatus as JobStatus)
    : "wishlist";

  const rawWorkMode = typeof input.workMode === "string" ? input.workMode : null;
  const workMode: WorkMode | null =
    rawWorkMode && VALID_WORK_MODES.has(rawWorkMode as WorkMode)
      ? (rawWorkMode as WorkMode)
      : null;

  const dateAdded =
    typeof input.dateAdded === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.dateAdded)
      ? input.dateAdded
      : todayISO();

  const dateApplied =
    typeof input.dateApplied === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.dateApplied)
      ? input.dateApplied
      : null;

  const salaryMin =
    typeof input.salaryMin === "number" && Number.isFinite(input.salaryMin) && input.salaryMin >= 0
      ? input.salaryMin
      : null;

  const salaryMax =
    typeof input.salaryMax === "number" && Number.isFinite(input.salaryMax) && input.salaryMax >= 0
      ? input.salaryMax
      : null;

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId(),
    company,
    role,
    url: typeof input.url === "string" ? input.url.trim() : "",
    status,
    dateAdded,
    dateApplied,
    location: typeof input.location === "string" ? input.location.trim() : "",
    workMode,
    salaryMin,
    salaryMax,
    notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 2000) : "",
  };
}

export function parseJobStore(raw: string | null): JobApplicationStore {
  if (!raw) return { applications: [] };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return { applications: [] };

    const rawApps = Array.isArray(parsed.applications) ? parsed.applications : [];
    const applications = rawApps
      .map((app) => sanitizeApplication(app))
      .filter((app): app is JobApplication => app !== null);

    return { applications };
  } catch {
    return { applications: [] };
  }
}

export function loadJobStore(): JobApplicationStore {
  if (typeof window === "undefined") return { applications: [] };
  return parseJobStore(window.localStorage.getItem(JOB_TRACKER_STORAGE_KEY));
}

export function saveJobStore(store: JobApplicationStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOB_TRACKER_STORAGE_KEY, JSON.stringify(store));
}

export interface CreateJobInput {
  company: string;
  role: string;
  url?: string;
  status?: JobStatus;
  location?: string;
  workMode?: WorkMode | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  notes?: string;
}

export function createJobApplication(input: CreateJobInput): JobApplication {
  return {
    id: createId(),
    company: input.company.trim(),
    role: input.role.trim(),
    url: input.url?.trim() ?? "",
    status: input.status ?? "wishlist",
    dateAdded: todayISO(),
    dateApplied: input.status === "applied" ? todayISO() : null,
    location: input.location?.trim() ?? "",
    workMode: input.workMode ?? null,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    notes: input.notes?.trim().slice(0, 2000) ?? "",
  };
}

export function computeJobStats(applications: JobApplication[]): JobTrackerStats {
  const total = applications.length;

  const inProgressStatuses = new Set<JobStatus>(["applied", "phone_screen", "interview"]);
  const inProgress = applications.filter((app) => inProgressStatuses.has(app.status)).length;

  const appliedCount = applications.filter((app) => app.status !== "wishlist").length;
  const respondedStatuses = new Set<JobStatus>([
    "phone_screen",
    "interview",
    "offer",
    "rejected",
  ]);
  const respondedCount = applications.filter((app) => respondedStatuses.has(app.status)).length;
  const responseRate = appliedCount > 0 ? respondedCount / appliedCount : 0;

  return { total, inProgress, responseRate };
}
