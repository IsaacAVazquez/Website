// ---------------------------------------------------------------------------
// MBA Internship Notifications – shared types
// ---------------------------------------------------------------------------

export type MBAATSType =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "direct-html"
  | "manual";
export type MBACategory = "big-tech" | "fintech" | "startup";
export type MBAJobRoleType = "internship" | "full-time" | "unclear";
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
}

export interface MBAJobsFetchError {
  companyId: string;
  companyName: string;
  message: string;
}

export interface MBAJobsApiResponse {
  jobs: MBAJob[];
  fetchedAt: string;
  errors: MBAJobsFetchError[];
  companiesRequested: string[];
}

export type MBASortOrder = "relevance" | "newest" | "oldest";
export type MBACategoryFilter = MBACategory | "all";
export type MBARoleTypeFilter = MBAJobRoleType | "all";
export type MBARoleFamilyFilter = MBAJobRoleFamily | "all";

export interface MBAJobsSearchState {
  q: string;
  location: string;
  sort: MBASortOrder;
  category: MBACategoryFilter;
  roleType: MBARoleTypeFilter;
  roleFamily: MBARoleFamilyFilter;
}
