// ---------------------------------------------------------------------------
// MBA Job Search tracker – shared types
// ---------------------------------------------------------------------------

export type MBAATSType =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "smartrecruiters"
  | "direct-html"
  | "external-api"
  | "manual";
export type MBACategory = "big-tech" | "fintech" | "startup";
export type MBAJobRoleType = "internship" | "full-time" | "unclear";
export type MBAJobsView = "feed" | "applications" | "candidates";
export type MBAExternalLeadsState = "off" | "on";
export type MBAJobRoleFamily =
  | "product"
  | "product-marketing"
  | "strategy"
  | "operations"
  | "growth"
  | "finance"
  | "business-development"
  | "analytics"
  | "chief-of-staff"
  | "leadership-program";

export interface MBACompany {
  id: string;
  name: string;
  atsType: MBAATSType;
  sourceKey: string;
  category: MBACategory;
  careersUrl: string;
  jobsUrl?: string;
  color: string;
  logoInitials: string;
}

export interface MBAJob {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  location: string;
  department: string;
  applyUrl: string;
  postedAt: string;
  atsType: MBAATSType;
  category: MBACategory;
  snippet: string | null;
  roleType: MBAJobRoleType;
  roleFamilies: MBAJobRoleFamily[];
  sourceName?: string;
  sourceUrl?: string;
}

export interface MBAJobsFetchError {
  companyId: string;
  companyName: string;
  message: string;
}

export type MBAJobsSourceStatusKind =
  | "ok"
  | "failed"
  | "skipped"
  | "external-disabled";

export interface MBAJobsSourceStatus {
  companyId: string;
  companyName: string;
  atsType: MBAATSType;
  status: MBAJobsSourceStatusKind;
  jobCount: number;
  message?: string;
}

export interface MBAJobsApiResponse {
  jobs: MBAJob[];
  fetchedAt: string;
  errors: MBAJobsFetchError[];
  companiesRequested: string[];
  sourceStatuses?: MBAJobsSourceStatus[];
}

export type MBASortOrder = "relevance" | "newest" | "oldest";
export type MBACategoryFilter = MBACategory | "all";
export type MBARoleTypeFilter = MBAJobRoleType | "all";
export type MBARoleFamilyFilter = MBAJobRoleFamily | "all";

export type MBAApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "archived";

export type MBAApplicationPriority = "low" | "medium" | "high";

export interface MBAApplicationJobSnapshot extends MBAJob {
  capturedAt: string;
  source: "live-feed" | "manual";
}

/** A fit reading written by the job-search triage skill. Score is an integer 0 to 100. */
export interface MBAFitAssessment {
  score: number;
  rationale: string;
  scoredAt: string;
}

export type MBAInterviewOutcome = "scheduled" | "done" | "passed" | "failed";

/** One posting fact worth keeping on the card, such as base pay, work arrangement, or close date. */
export interface MBAApplicationFact {
  label: string;
  value: string;
}

export interface MBAInterviewRound {
  label: string;
  date: string | null;
  outcome: MBAInterviewOutcome;
  notes: string;
}

export interface MBATrackedApplication {
  id: string;
  jobId: string | null;
  jobSnapshot: MBAApplicationJobSnapshot;
  status: MBAApplicationStatus;
  priority: MBAApplicationPriority;
  notes: string;
  contact: string;
  sourceUrl: string;
  followUpDate: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  appliedAt: string | null;
  archivedAt: string | null;
  /** Optional in the type so older fixtures compile; the sanitizer always emits them. */
  fit?: MBAFitAssessment | null;
  appliedVia?: string;
  /** Repo-relative folder holding the tailored materials, e.g. private/job-search/roles/acme-pm. */
  materialsDir?: string | null;
  interviewRounds?: MBAInterviewRound[];
  /** Written by the materials skill from the posting; read-only on the dashboard. 12 max. */
  facts?: MBAApplicationFact[];
}

export type MBACandidateTriage = "sourced" | "reviewed" | "dismissed";

/** A sourced role that has not been promoted into the pipeline. Lives in private/job-search/candidates.json. */
export interface MBAJobCandidate {
  id: string;
  job: MBAApplicationJobSnapshot;
  triage: MBACandidateTriage;
  fit: MBAFitAssessment | null;
  sourcedAt: string;
  updatedAt: string;
}

export interface MBAJobCandidatesFileV1 {
  schema: "mba-candidates";
  version: 1;
  exportedAt: string;
  candidates: MBAJobCandidate[];
}

/** private/job-search/targets.json. Empty arrays mean no filter. */
export interface MBAJobSearchTargets {
  roleFamilies: MBAJobRoleFamily[];
  locations: string[];
  excludeTitleTerms: string[];
  companiesAvoid: string[];
  /** Skip feed postings older than this many days. 0 means no cap. */
  maxPostingAgeDays: number;
}

export interface MBAApplicationsExportV1 {
  schema: "mba-applications-export";
  version: 1;
  exportedAt: string;
  applications: MBATrackedApplication[];
}

export interface MBAJobsSearchState {
  view: MBAJobsView;
  external: MBAExternalLeadsState;
  q: string;
  location: string;
  sort: MBASortOrder;
  category: MBACategoryFilter;
  roleType: MBARoleTypeFilter;
  roleFamily: MBARoleFamilyFilter;
}
