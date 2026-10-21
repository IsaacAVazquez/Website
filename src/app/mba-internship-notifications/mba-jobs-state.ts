// ---------------------------------------------------------------------------
// Job search tracker – URL state management. The default feed is full-time
// roles; the internship filter stays available for anyone who wants it.
// ---------------------------------------------------------------------------

import { MBA_ROLE_FAMILIES, MBA_ROLE_FAMILY_LABELS } from "@/constants/mba-role-taxonomy";
import type {
  MBACategoryFilter,
  MBAExternalLeadsState,
  MBAJobsSearchState,
  MBAJobsView,
  MBARoleFamilyFilter,
  MBARoleTypeFilter,
  MBASortOrder,
} from "@/types/mba-jobs";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

const MBA_JOBS_ROUTE = "/mba-internship-notifications";

// Cards rendered per "Show more" step on the live grid, and the slice the page
// serializes for the first paint. A job card runs about 800px tall on a phone,
// so 60 at once printed a 46,000px page there.
export const JOB_PAGE_SIZE = 12;

export const VIEW_OPTIONS = ["feed", "applications", "candidates"] as const;
const EXTERNAL_OPTIONS = ["off", "on"] as const;
export const SORT_OPTIONS = ["relevance", "newest", "oldest"] as const;
export const CATEGORY_OPTIONS = ["all", "big-tech", "fintech", "startup"] as const;
export const ROLE_TYPE_OPTIONS = ["all", "internship", "full-time"] as const;
export const ROLE_FAMILY_OPTIONS = ["all", ...MBA_ROLE_FAMILIES] as const;

export const VIEW_LABELS: Record<MBAJobsView, string> = {
  feed: "Role feed",
  applications: "Application pipeline",
  candidates: "Candidates",
};

export const EXTERNAL_LABELS: Record<MBAExternalLeadsState, string> = {
  off: "Direct feeds",
  on: "Direct + external leads",
};

export const SORT_LABELS: Record<MBASortOrder, string> = {
  relevance: "Best match",
  newest: "Newest first",
  oldest: "Oldest first",
};

export const CATEGORY_LABELS: Record<MBACategoryFilter, string> = {
  all: "All companies",
  "big-tech": "Big Tech",
  fintech: "Fintech",
  startup: "Startup",
};

export const ROLE_TYPE_LABELS: Record<MBARoleTypeFilter, string> = {
  all: "All",
  internship: "Internship",
  "full-time": "Full-Time",
  unclear: "Unclear",
};

export const ROLE_FAMILY_LABELS: Record<MBARoleFamilyFilter, string> =
  MBA_ROLE_FAMILY_LABELS;

export const DEFAULT_MBA_JOBS_STATE: MBAJobsSearchState = {
  view: "feed",
  external: "off",
  q: "",
  location: "",
  sort: "relevance",
  category: "all",
  roleType: "full-time",
  roleFamily: "all",
};

export function normalizeMBAJobsState(input: SearchParamInput): MBAJobsSearchState {
  const d = DEFAULT_MBA_JOBS_STATE;
  return {
    view: readEnum(input, "view", VIEW_OPTIONS, d.view),
    external: readEnum(input, "external", EXTERNAL_OPTIONS, d.external),
    q: readParam(input, "q")?.trim() ?? d.q,
    location: readParam(input, "location")?.trim() ?? d.location,
    sort: readEnum(input, "sort", SORT_OPTIONS, d.sort),
    category: readEnum(input, "category", CATEGORY_OPTIONS, d.category),
    roleType: readEnum(input, "roleType", ROLE_TYPE_OPTIONS, d.roleType),
    roleFamily: readEnum(input, "roleFamily", ROLE_FAMILY_OPTIONS, d.roleFamily),
  };
}

export function buildMBAJobsHref(state: MBAJobsSearchState): string {
  return buildHref(
    MBA_JOBS_ROUTE,
    {
      view: state.view,
      external: state.external,
      q: state.q.trim(),
      location: state.location.trim(),
      sort: state.sort,
      category: state.category,
      roleType: state.roleType,
      roleFamily: state.roleFamily,
    },
    DEFAULT_MBA_JOBS_STATE
  );
}
