import type {
  MBAATSType,
  MBAApplicationPriority,
  MBAApplicationsExportV1,
  MBAApplicationStatus,
  MBACategory,
  MBAJob,
  MBAApplicationJobSnapshot,
  MBAJobRoleFamily,
  MBAJobRoleType,
  MBATrackedApplication,
} from "@/types/mba-jobs";
import { MBA_ROLE_FAMILIES } from "@/constants/mba-role-taxonomy";

export const MBA_APPLICATIONS_STORAGE_KEY = "mba_applications_v1";
export const MBA_APPLICATION_EXPORT_SCHEMA = "mba-applications-export";
export const MBA_APPLICATION_EXPORT_VERSION = 1;

export const MBA_APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "archived",
] as const satisfies readonly MBAApplicationStatus[];

export const MBA_APPLICATION_PRIORITIES = [
  "low",
  "medium",
  "high",
] as const satisfies readonly MBAApplicationPriority[];

export const MBA_APPLICATION_STATUS_LABELS: Record<MBAApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  archived: "Archived",
};

export const MBA_APPLICATION_PRIORITY_LABELS: Record<MBAApplicationPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const MAX_TEXT_LENGTH = 220;
const MAX_NOTES_LENGTH = 2_000;

export interface MBAApplicationDraft {
  companyName: string;
  title: string;
  location: string;
  department: string;
  applyUrl: string;
  sourceUrl?: string;
  status?: MBAApplicationStatus;
  priority?: MBAApplicationPriority;
  notes?: string;
  contact?: string;
  followUpDate?: string | null;
  deadline?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createId(prefix = "mba-app") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function cleanText(value: unknown, fallback = "", maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return (trimmed || fallback).slice(0, maxLength);
}

function cleanLongText(value: unknown): string {
  return cleanText(value, "", MAX_NOTES_LENGTH);
}

function cleanNullableText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  const cleaned = cleanText(value, "", maxLength);
  return cleaned || null;
}

function cleanUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

function cleanTimestamp(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function isStatus(value: unknown): value is MBAApplicationStatus {
  return (
    typeof value === "string" &&
    (MBA_APPLICATION_STATUSES as readonly string[]).includes(value)
  );
}

function isPriority(value: unknown): value is MBAApplicationPriority {
  return (
    typeof value === "string" &&
    (MBA_APPLICATION_PRIORITIES as readonly string[]).includes(value)
  );
}

function isAtsType(value: unknown): value is MBAATSType {
  return (
    typeof value === "string" &&
    [
      "greenhouse",
      "lever",
      "ashby",
      "smartrecruiters",
      "direct-html",
      "external-api",
      "manual",
    ].includes(value)
  );
}

function isCategory(value: unknown): value is MBACategory {
  return (
    typeof value === "string" &&
    ["big-tech", "fintech", "startup"].includes(value)
  );
}

function isRoleType(value: unknown): value is MBAJobRoleType {
  return (
    typeof value === "string" &&
    ["internship", "full-time", "unclear"].includes(value)
  );
}

function sanitizeRoleFamilies(value: unknown): MBAJobRoleFamily[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is MBAJobRoleFamily =>
      typeof item === "string" && (MBA_ROLE_FAMILIES as readonly string[]).includes(item)
  );
}

function normalizeApplyUrlForKey(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

export function buildMBAApplicationMatchKey(application: MBATrackedApplication): string {
  if (application.jobId) return `job:${application.jobId}`;
  const applyUrl = normalizeApplyUrlForKey(application.jobSnapshot.applyUrl);
  if (applyUrl) return `url:${applyUrl}`;
  return `id:${application.id}`;
}

export function buildMBAApplicationJobSnapshot(
  job: MBAJob,
  now = new Date()
): MBAApplicationJobSnapshot {
  return {
    ...job,
    capturedAt: now.toISOString(),
    source: "live-feed",
  };
}

export function createMBAApplicationFromJob(
  job: MBAJob,
  status: MBAApplicationStatus = "saved",
  now = new Date()
): MBATrackedApplication {
  const timestamp = now.toISOString();
  return {
    id: createId(),
    jobId: job.id,
    jobSnapshot: buildMBAApplicationJobSnapshot(job, now),
    status,
    priority: "medium",
    notes: "",
    contact: "",
    sourceUrl: cleanUrl(job.applyUrl),
    followUpDate: null,
    deadline: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    appliedAt: status === "applied" ? timestamp : null,
    archivedAt: status === "archived" ? timestamp : null,
  };
}

export function createManualMBAApplication(
  draft: MBAApplicationDraft,
  now = new Date()
): MBATrackedApplication | null {
  const companyName = cleanText(draft.companyName);
  const title = cleanText(draft.title);
  if (!companyName || !title) return null;

  const timestamp = now.toISOString();
  const applyUrl = cleanUrl(draft.applyUrl);
  const status = draft.status ?? "saved";
  return {
    id: createId(),
    jobId: null,
    jobSnapshot: {
      id: createId("manual-job"),
      companyId: "manual",
      companyName,
      title,
      location: cleanText(draft.location, "Unknown"),
      department: cleanText(draft.department, "General"),
      applyUrl,
      postedAt: "",
      atsType: "manual",
      category: "startup",
      snippet: null,
      roleType: "unclear",
      roleFamilies: [],
      capturedAt: timestamp,
      source: "manual",
    },
    status,
    priority: draft.priority ?? "medium",
    notes: cleanLongText(draft.notes),
    contact: cleanText(draft.contact),
    sourceUrl: cleanUrl(draft.sourceUrl ?? draft.applyUrl),
    followUpDate: cleanIsoDate(draft.followUpDate),
    deadline: cleanIsoDate(draft.deadline),
    createdAt: timestamp,
    updatedAt: timestamp,
    appliedAt: status === "applied" ? timestamp : null,
    archivedAt: status === "archived" ? timestamp : null,
  };
}

function sanitizeJobSnapshot(value: unknown, fallbackTimestamp: string): MBAApplicationJobSnapshot | null {
  if (!isRecord(value)) return null;

  const title = cleanText(value.title);
  const companyName = cleanText(value.companyName);
  if (!title || !companyName) return null;

  return {
    id: cleanText(value.id, createId("snapshot")),
    companyId: cleanText(value.companyId, "manual"),
    companyName,
    title,
    location: cleanText(value.location, "Unknown"),
    department: cleanText(value.department, "General"),
    applyUrl: cleanUrl(value.applyUrl),
    postedAt: cleanTimestamp(value.postedAt, ""),
    atsType: isAtsType(value.atsType) ? value.atsType : "manual",
    category: isCategory(value.category) ? value.category : "startup",
    snippet: cleanNullableText(value.snippet, MAX_NOTES_LENGTH),
    roleType: isRoleType(value.roleType) ? value.roleType : "unclear",
    roleFamilies: sanitizeRoleFamilies(value.roleFamilies),
    sourceName: cleanNullableText(value.sourceName) ?? undefined,
    sourceUrl: cleanUrl(value.sourceUrl) || undefined,
    capturedAt: cleanTimestamp(value.capturedAt, fallbackTimestamp),
    source: value.source === "live-feed" ? "live-feed" : "manual",
  };
}

function sanitizeTrackedApplication(value: unknown): MBATrackedApplication | null {
  if (!isRecord(value)) return null;
  const fallbackTimestamp = new Date().toISOString();
  const jobSnapshot = sanitizeJobSnapshot(value.jobSnapshot, fallbackTimestamp);
  if (!jobSnapshot) return null;

  const status = isStatus(value.status) ? value.status : "saved";
  const priority = isPriority(value.priority) ? value.priority : "medium";
  const updatedAt = cleanTimestamp(value.updatedAt, fallbackTimestamp);

  return {
    id: cleanText(value.id, createId()),
    jobId: typeof value.jobId === "string" && value.jobId.trim() ? value.jobId.trim() : null,
    jobSnapshot,
    status,
    priority,
    notes: cleanLongText(value.notes),
    contact: cleanText(value.contact),
    sourceUrl: cleanUrl(value.sourceUrl) || jobSnapshot.applyUrl,
    followUpDate: cleanIsoDate(value.followUpDate),
    deadline: cleanIsoDate(value.deadline),
    createdAt: cleanTimestamp(value.createdAt, updatedAt),
    updatedAt,
    appliedAt: value.appliedAt ? cleanTimestamp(value.appliedAt, updatedAt) : null,
    archivedAt: value.archivedAt ? cleanTimestamp(value.archivedAt, updatedAt) : null,
  };
}

export function parseMBAApplications(raw: string | null): MBATrackedApplication[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    const items = isRecord(parsed) && Array.isArray(parsed.applications)
      ? parsed.applications
      : Array.isArray(parsed)
        ? parsed
        : [];
    return mergeMBAApplications(
      [],
      items
        .map((item) => sanitizeTrackedApplication(item))
        .filter((item): item is MBATrackedApplication => item !== null)
    );
  } catch {
    return [];
  }
}

export function loadMBAApplications(storage?: Pick<Storage, "getItem">): MBATrackedApplication[] {
  if (storage) {
    return parseMBAApplications(storage.getItem(MBA_APPLICATIONS_STORAGE_KEY));
  }
  if (typeof window === "undefined") return [];
  return parseMBAApplications(window.localStorage.getItem(MBA_APPLICATIONS_STORAGE_KEY));
}

export function saveMBAApplications(
  applications: MBATrackedApplication[],
  storage?: Pick<Storage, "setItem">
): boolean {
  try {
    const payload = JSON.stringify(applications);
    if (storage) {
      storage.setItem(MBA_APPLICATIONS_STORAGE_KEY, payload);
      return true;
    }
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(MBA_APPLICATIONS_STORAGE_KEY, payload);
    return true;
  } catch {
    return false;
  }
}

export function clearMBAApplications(storage?: Pick<Storage, "removeItem">): void {
  if (storage) {
    storage.removeItem(MBA_APPLICATIONS_STORAGE_KEY);
    return;
  }
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MBA_APPLICATIONS_STORAGE_KEY);
}

function pickNewerApplication(
  current: MBATrackedApplication,
  incoming: MBATrackedApplication
): MBATrackedApplication {
  const currentTime = new Date(current.updatedAt).getTime();
  const incomingTime = new Date(incoming.updatedAt).getTime();
  return incomingTime > currentTime ? incoming : current;
}

export function mergeMBAApplications(
  existing: MBATrackedApplication[],
  incoming: MBATrackedApplication[]
): MBATrackedApplication[] {
  const merged = new Map<string, MBATrackedApplication>();

  for (const application of [...existing, ...incoming]) {
    const key = buildMBAApplicationMatchKey(application);
    const current = merged.get(key);
    merged.set(key, current ? pickNewerApplication(current, application) : application);
  }

  return Array.from(merged.values()).sort((left, right) => {
    const statusDiff =
      MBA_APPLICATION_STATUSES.indexOf(left.status) -
      MBA_APPLICATION_STATUSES.indexOf(right.status);
    if (statusDiff !== 0) return statusDiff;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function updateMBAApplicationStatus(
  application: MBATrackedApplication,
  status: MBAApplicationStatus,
  now = new Date()
): MBATrackedApplication {
  const timestamp = now.toISOString();
  return {
    ...application,
    status,
    updatedAt: timestamp,
    appliedAt:
      status === "applied" && !application.appliedAt ? timestamp : application.appliedAt,
    archivedAt: status === "archived" ? timestamp : application.archivedAt,
  };
}

export function buildMBAApplicationsExport(
  applications: MBATrackedApplication[],
  now = new Date()
): MBAApplicationsExportV1 {
  return {
    schema: MBA_APPLICATION_EXPORT_SCHEMA,
    version: MBA_APPLICATION_EXPORT_VERSION,
    exportedAt: now.toISOString(),
    applications,
  };
}

export function parseMBAApplicationsImport(raw: string): MBATrackedApplication[] {
  return parseMBAApplications(raw);
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function buildMBAApplicationsCsv(applications: MBATrackedApplication[]): string {
  const headers = [
    "Status",
    "Priority",
    "Company",
    "Title",
    "Location",
    "Department",
    "Apply URL",
    "Source URL",
    "Follow Up",
    "Deadline",
    "Contact",
    "Notes",
    "Updated At",
  ];
  const rows = applications.map((application) => [
    MBA_APPLICATION_STATUS_LABELS[application.status],
    MBA_APPLICATION_PRIORITY_LABELS[application.priority],
    application.jobSnapshot.companyName,
    application.jobSnapshot.title,
    application.jobSnapshot.location,
    application.jobSnapshot.department,
    application.jobSnapshot.applyUrl,
    application.sourceUrl,
    application.followUpDate ?? "",
    application.deadline ?? "",
    application.contact,
    application.notes,
    application.updatedAt,
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildMBAApplicationSearchText(application: MBATrackedApplication): string {
  return [
    application.jobSnapshot.companyName,
    application.jobSnapshot.title,
    application.jobSnapshot.location,
    application.jobSnapshot.department,
    application.notes,
    application.contact,
    application.sourceUrl,
    application.status,
    application.priority,
  ]
    .join(" ")
    .toLowerCase();
}
