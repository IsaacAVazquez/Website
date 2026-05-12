// ---------------------------------------------------------------------------
// MBA Internship Notifications – shared types
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
export type MBAJobsView = "feed" | "applications";
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
  | "chief-of-staff";

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
