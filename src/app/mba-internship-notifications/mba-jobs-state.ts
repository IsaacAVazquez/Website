// ---------------------------------------------------------------------------
// MBA Internship Notifications – URL state management
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

export const MBA_JOBS_ROUTE = "/mba-internship-notifications";

export const VIEW_OPTIONS = ["feed", "applications"] as const;
export const EXTERNAL_OPTIONS = ["off", "on"] as const;
export const SORT_OPTIONS = ["relevance", "newest", "oldest"] as const;
export const CATEGORY_OPTIONS = ["all", "big-tech", "fintech", "startup"] as const;
export const ROLE_TYPE_OPTIONS = ["all", "internship", "full-time"] as const;
export const ROLE_FAMILY_OPTIONS = ["all", ...MBA_ROLE_FAMILIES] as const;

export const VIEW_LABELS: Record<MBAJobsView, string> = {
  feed: "Role feed",
  applications: "Application pipeline",
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
  roleType: "all",
  roleFamily: "all",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

type SearchParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined | null>;

function readParam(input: SearchParamInput, key: string): string | undefined {
  if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
  const v = input[key];
  return Array.isArray(v) ? v[0] : (v ?? undefined);
}

function isValidOption<T extends string>(
  value: string | undefined,
  options: readonly T[]
): value is T {
  return !!value && (options as readonly string[]).includes(value);
}

export function normalizeMBAJobsState(input: SearchParamInput): MBAJobsSearchState {
  const rawView = readParam(input, "view");
  const rawExternal = readParam(input, "external");
  const rawQuery = readParam(input, "q");
  const rawLocation = readParam(input, "location");
  const rawSort = readParam(input, "sort");
  const rawCategory = readParam(input, "category");
  const rawRoleType = readParam(input, "roleType");
  const rawRoleFamily = readParam(input, "roleFamily");
  return {
    view: isValidOption(rawView, VIEW_OPTIONS)
      ? rawView
      : DEFAULT_MBA_JOBS_STATE.view,
    external: isValidOption(rawExternal, EXTERNAL_OPTIONS)
      ? rawExternal
      : DEFAULT_MBA_JOBS_STATE.external,
    q: rawQuery?.trim() ?? DEFAULT_MBA_JOBS_STATE.q,
    location: rawLocation?.trim() ?? DEFAULT_MBA_JOBS_STATE.location,
    sort: isValidOption(rawSort, SORT_OPTIONS)
      ? rawSort
      : DEFAULT_MBA_JOBS_STATE.sort,
    category: isValidOption(rawCategory, CATEGORY_OPTIONS)
      ? rawCategory
      : DEFAULT_MBA_JOBS_STATE.category,
    roleType: isValidOption(rawRoleType, ROLE_TYPE_OPTIONS)
      ? rawRoleType
      : DEFAULT_MBA_JOBS_STATE.roleType,
    roleFamily: isValidOption(rawRoleFamily, ROLE_FAMILY_OPTIONS)
      ? rawRoleFamily
      : DEFAULT_MBA_JOBS_STATE.roleFamily,
  };
}

export function buildMBAJobsHref(state: MBAJobsSearchState): string {
  const params = new URLSearchParams();
  const query = state.q.trim();
  const location = state.location.trim();
  if (state.view !== DEFAULT_MBA_JOBS_STATE.view) params.set("view", state.view);
  if (state.external !== DEFAULT_MBA_JOBS_STATE.external)
    params.set("external", state.external);
  if (query) params.set("q", query);
  if (location) params.set("location", location);
  if (state.sort !== DEFAULT_MBA_JOBS_STATE.sort) params.set("sort", state.sort);
  if (state.category !== DEFAULT_MBA_JOBS_STATE.category)
    params.set("category", state.category);
  if (state.roleType !== DEFAULT_MBA_JOBS_STATE.roleType)
    params.set("roleType", state.roleType);
  if (state.roleFamily !== DEFAULT_MBA_JOBS_STATE.roleFamily)
    params.set("roleFamily", state.roleFamily);
  const qs = params.toString();
  return qs ? `${MBA_JOBS_ROUTE}?${qs}` : MBA_JOBS_ROUTE;
}
