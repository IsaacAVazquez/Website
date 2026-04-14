// ---------------------------------------------------------------------------
// MBA Internship Notifications – shared types
// ---------------------------------------------------------------------------

export type MBAATSType = "greenhouse" | "lever" | "ashby" | "manual";
export type MBACategory = "big-tech" | "fintech" | "startup";

export interface MBACompany {
  id: string;
  name: string;
  atsType: MBAATSType;
  atsSlug: string;
  category: MBACategory;
  careersUrl: string;
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

export type MBASortOrder = "newest" | "oldest";
export type MBACategoryFilter = MBACategory | "all";

export interface MBAJobsSearchState {
  sort: MBASortOrder;
  category: MBACategoryFilter;
}
