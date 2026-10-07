import { readBrowserStorageString, writeBrowserStorageString } from "@/lib/browserStorage";
import type {
  MBAATSType,
  MBAApplicationPriority,
  MBAApplicationsExportV1,
  MBAApplicationStatus,
  MBACandidateTriage,
  MBACategory,
  MBAFitAssessment,
  MBAInterviewOutcome,
  MBAInterviewRound,
  MBAJob,
  MBAJobCandidate,
  MBAJobCandidatesFileV1,
  MBAJobSearchTargets,
  MBAApplicationJobSnapshot,
  MBAJobRoleFamily,
  MBAJobRoleType,
  MBATrackedApplication,
} from "@/types/mba-jobs";
import { MBA_ROLE_FAMILIES } from "@/constants/mba-role-taxonomy";
import { isRecord, prefixedId } from "@/lib/utils";

export const MBA_APPLICATIONS_STORAGE_KEY = "mba_applications_v1";
const MBA_APPLICATION_EXPORT_SCHEMA = "mba-applications-export";
const MBA_APPLICATION_EXPORT_VERSION = 1;

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
const MAX_INTERVIEW_ROUNDS = 12;

export const MBA_CANDIDATE_TRIAGE = [
  "sourced",
  "reviewed",
  "dismissed",
] as const satisfies readonly MBACandidateTriage[];

const MBA_INTERVIEW_OUTCOMES = [
  "scheduled",
  "done",
  "passed",
  "failed",
] as const satisfies readonly MBAInterviewOutcome[];

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
  fit?: MBAFitAssessment | null;
  appliedVia?: string;
  materialsDir?: string | null;
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

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function sanitizeFit(value: unknown, fallbackTimestamp: string): MBAFitAssessment | null {
  if (!isRecord(value)) return null;
  const score = clampScore(value.score);
  if (score === null) return null;
  return {
    score,
    rationale: cleanLongText(value.rationale),
    scoredAt: cleanTimestamp(value.scoredAt, fallbackTimestamp),
  };
}

function isInterviewOutcome(value: unknown): value is MBAInterviewOutcome {
  return (
    typeof value === "string" &&
    (MBA_INTERVIEW_OUTCOMES as readonly string[]).includes(value)
  );
}

export function sanitizeInterviewRounds(value: unknown): MBAInterviewRound[] {
  if (!Array.isArray(value)) return [];
  const rounds: MBAInterviewRound[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = cleanText(item.label);
    if (!label) continue;
    rounds.push({
      label,
      date: cleanIsoDate(item.date),
      outcome: isInterviewOutcome(item.outcome) ? item.outcome : "scheduled",
      notes: cleanLongText(item.notes),
    });
    if (rounds.length >= MAX_INTERVIEW_ROUNDS) break;
  }
  return rounds;
}

/** A repo-relative folder path: no leading slash, no parent segments, plain characters only. */
export function cleanRelativePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed.length > MAX_TEXT_LENGTH) return null;
  if (trimmed.startsWith("/") || /(^|\/)\.\.(\/|$)/.test(trimmed)) return null;
  if (!/^[\w./ -]+$/.test(trimmed)) return null;
  return trimmed;
}

function isTriage(value: unknown): value is MBACandidateTriage {
  return (
    typeof value === "string" &&
    (MBA_CANDIDATE_TRIAGE as readonly string[]).includes(value)
  );
}

function normalizeApplyUrlForKey(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

/** One dedupe rule for feed jobs, candidates, and tracked applications. */
export function buildMBAJobKey(job: Pick<MBAJob, "id" | "applyUrl">): string {
  const applyUrl = normalizeApplyUrlForKey(job.applyUrl);
  if (applyUrl) return `url:${applyUrl}`;
  return `job:${job.id}`;
}

function buildMBAApplicationMatchKey(application: MBATrackedApplication): string {
  if (application.jobId) return `job:${application.jobId}`;
  const applyUrl = normalizeApplyUrlForKey(application.jobSnapshot.applyUrl);
  if (applyUrl) return `url:${applyUrl}`;
  return `id:${application.id}`;
}

function buildApplicationJobKeys(application: MBATrackedApplication): string[] {
  const keys = [buildMBAJobKey(application.jobSnapshot)];
  if (application.jobId) keys.push(`job:${application.jobId}`);
  return keys;
}

function buildMBAApplicationJobSnapshot(
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
    id: prefixedId("mba-app"),
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
    fit: null,
    appliedVia: "",
    materialsDir: null,
    interviewRounds: [],
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
    id: prefixedId("mba-app"),
    jobId: null,
    jobSnapshot: {
      id: prefixedId("manual-job"),
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
    fit: sanitizeFit(draft.fit, timestamp),
    appliedVia: cleanText(draft.appliedVia),
    materialsDir: cleanRelativePath(draft.materialsDir),
    interviewRounds: [],
  };
}

export function sanitizeJobSnapshot(value: unknown, fallbackTimestamp: string): MBAApplicationJobSnapshot | null {
  if (!isRecord(value)) return null;

  const title = cleanText(value.title);
  const companyName = cleanText(value.companyName);
  if (!title || !companyName) return null;

  return {
    id: cleanText(value.id, prefixedId("snapshot")),
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
    id: cleanText(value.id, prefixedId("mba-app")),
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
    fit: sanitizeFit(value.fit, updatedAt),
    appliedVia: cleanText(value.appliedVia),
    materialsDir: cleanRelativePath(value.materialsDir),
    interviewRounds: sanitizeInterviewRounds(value.interviewRounds),
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
  return parseMBAApplications(readBrowserStorageString(MBA_APPLICATIONS_STORAGE_KEY).value);
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
    return writeBrowserStorageString(MBA_APPLICATIONS_STORAGE_KEY, payload) === "persistent";
  } catch {
    return false;
  }
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
  let text = String(value ?? "");
  // Neutralize spreadsheet formula injection (CWE-1236). A cell that begins
  // with =, +, -, @, tab, or carriage return is evaluated as a formula by
  // Excel/Sheets, so an attacker-influenced field (a scraped job's location or
  // department, or any field from an imported tracker JSON) could exfiltrate
  // adjacent cells. Prefix a single quote so the spreadsheet treats it as
  // literal text. Do this before the quote/comma/newline wrapping below.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
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
    "Fit",
    "Applied Via",
    "Materials",
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
    application.fit?.score ?? "",
    application.appliedVia ?? "",
    application.materialsDir ?? "",
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
    application.appliedVia ?? "",
    application.fit?.rationale ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Candidates and targets (private/job-search/candidates.json, targets.json)
// ---------------------------------------------------------------------------

function sanitizeCandidate(value: unknown): MBAJobCandidate | null {
  if (!isRecord(value)) return null;
  const fallbackTimestamp = new Date().toISOString();
  const job = sanitizeJobSnapshot(value.job, fallbackTimestamp);
  if (!job) return null;
  const updatedAt = cleanTimestamp(value.updatedAt, fallbackTimestamp);
  return {
    id: cleanText(value.id, job.id),
    job,
    triage: isTriage(value.triage) ? value.triage : "sourced",
    fit: sanitizeFit(value.fit, updatedAt),
    sourcedAt: cleanTimestamp(value.sourcedAt, updatedAt),
    updatedAt,
  };
}

export function parseMBAJobCandidates(raw: string | null): MBAJobCandidate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    const items = isRecord(parsed) && Array.isArray(parsed.candidates)
      ? parsed.candidates
      : Array.isArray(parsed)
        ? parsed
        : [];
    return mergeMBAJobCandidates(
      [],
      items
        .map((item) => sanitizeCandidate(item))
        .filter((item): item is MBAJobCandidate => item !== null)
    );
  } catch {
    return [];
  }
}

export function mergeMBAJobCandidates(
  existing: MBAJobCandidate[],
  incoming: MBAJobCandidate[]
): MBAJobCandidate[] {
  const merged = new Map<string, MBAJobCandidate>();
  for (const candidate of [...existing, ...incoming]) {
    const key = buildMBAJobKey(candidate.job);
    const current = merged.get(key);
    merged.set(
      key,
      current && new Date(current.updatedAt).getTime() >= new Date(candidate.updatedAt).getTime()
        ? current
        : candidate
    );
  }
  return Array.from(merged.values()).sort((left, right) => {
    const fitDiff = (right.fit?.score ?? -1) - (left.fit?.score ?? -1);
    if (fitDiff !== 0) return fitDiff;
    return new Date(right.sourcedAt).getTime() - new Date(left.sourcedAt).getTime();
  });
}

export function buildMBAJobCandidatesFile(
  candidates: MBAJobCandidate[],
  now = new Date()
): MBAJobCandidatesFileV1 {
  return {
    schema: "mba-candidates",
    version: 1,
    exportedAt: now.toISOString(),
    candidates,
  };
}

export const DEFAULT_MBA_JOB_SEARCH_TARGETS: MBAJobSearchTargets = {
  roleFamilies: [...MBA_ROLE_FAMILIES],
  locations: [],
  excludeTitleTerms: [],
  companiesAvoid: [],
  maxPostingAgeDays: 45,
};

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item))
    .filter((item) => item.length > 0);
}

export function parseMBAJobSearchTargets(raw: string | null): MBAJobSearchTargets {
  if (!raw) return DEFAULT_MBA_JOB_SEARCH_TARGETS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return DEFAULT_MBA_JOB_SEARCH_TARGETS;
    const roleFamilies = sanitizeRoleFamilies(parsed.roleFamilies);
    return {
      roleFamilies: roleFamilies.length > 0 ? roleFamilies : [...MBA_ROLE_FAMILIES],
      locations: cleanStringList(parsed.locations),
      excludeTitleTerms: cleanStringList(parsed.excludeTitleTerms).map((term) => term.toLowerCase()),
      companiesAvoid: cleanStringList(parsed.companiesAvoid),
      maxPostingAgeDays:
        typeof parsed.maxPostingAgeDays === "number" && Number.isFinite(parsed.maxPostingAgeDays)
          ? Math.max(0, Math.round(parsed.maxPostingAgeDays))
          : DEFAULT_MBA_JOB_SEARCH_TARGETS.maxPostingAgeDays,
    };
  } catch {
    return DEFAULT_MBA_JOB_SEARCH_TARGETS;
  }
}

function padTokens(value: string): string {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

/** Whole-word phrase match, so "CA" does not match "Canada" and "Remote" does match "Remote - US". */
function hasPhrase(haystack: string, phrases: string[]): boolean {
  const padded = padTokens(haystack);
  return phrases.some((phrase) => padded.includes(padTokens(phrase)));
}

function isFreshEnough(postedAt: string, maxAgeDays: number, now: Date): boolean {
  if (maxAgeDays <= 0) return true;
  const posted = new Date(postedAt).getTime();
  if (Number.isNaN(posted)) return true;
  return now.getTime() - posted <= maxAgeDays * 86_400_000;
}

/**
 * Pure selection of feed jobs worth adding to candidates.json: full-time, inside the
 * targets, and not already a candidate (any triage) or a tracked application.
 */
export function selectNewCandidates(
  jobs: MBAJob[],
  candidates: MBAJobCandidate[],
  pipeline: MBATrackedApplication[],
  targets: MBAJobSearchTargets,
  now = new Date()
): MBAJobCandidate[] {
  const known = new Set<string>();
  for (const candidate of candidates) known.add(buildMBAJobKey(candidate.job));
  for (const application of pipeline) {
    for (const key of buildApplicationJobKeys(application)) known.add(key);
  }
  const avoid = new Set(targets.companiesAvoid);
  const timestamp = now.toISOString();
  const fresh: MBAJobCandidate[] = [];
  for (const job of jobs) {
    if (job.roleType !== "full-time") continue;
    if (!job.roleFamilies.some((family) => targets.roleFamilies.includes(family))) continue;
    if (targets.locations.length > 0 && !hasPhrase(job.location, targets.locations)) continue;
    if (hasPhrase(job.title, targets.excludeTitleTerms)) continue;
    if (!isFreshEnough(job.postedAt, targets.maxPostingAgeDays, now)) continue;
    if (avoid.has(job.companyId)) continue;
    const key = buildMBAJobKey(job);
    if (known.has(key)) continue;
    known.add(key);
    fresh.push({
      id: job.id,
      job: { ...job, capturedAt: timestamp, source: "live-feed" },
      triage: "sourced",
      fit: null,
      sourcedAt: timestamp,
      updatedAt: timestamp,
    });
  }
  return fresh;
}
