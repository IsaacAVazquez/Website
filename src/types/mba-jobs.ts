// ---------------------------------------------------------------------------
// MBA Internship Notifications – shared types
// ---------------------------------------------------------------------------

export type MBAATSType = "greenhouse" | "lever" | "manual";
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

export interface MBAJobsApiResponse {
  jobs: MBAJob[];
  fetchedAt: string;
  errors: { companyId: string; message: string }[];
  companiesRequested: string[];
}

export type MBASortOrder = "newest" | "oldest";
export type MBACategoryFilter = MBACategory | "all";

export interface MBAJobsSearchState {
  sort: MBASortOrder;
  category: MBACategoryFilter;
}
