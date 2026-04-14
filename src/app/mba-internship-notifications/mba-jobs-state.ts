// ---------------------------------------------------------------------------
// MBA Internship Notifications – URL state management
// ---------------------------------------------------------------------------

import { MBA_ROLE_FAMILIES, MBA_ROLE_FAMILY_LABELS } from "@/constants/mba-role-taxonomy";
import type {
  MBACategoryFilter,
  MBAJobsSearchState,
  MBARoleFamilyFilter,
  MBARoleTypeFilter,
  MBASortOrder,
} from "@/types/mba-jobs";

export const MBA_JOBS_ROUTE = "/mba-internship-notifications";

export const SORT_OPTIONS = ["relevance", "newest", "oldest"] as const;
export const CATEGORY_OPTIONS = ["all", "big-tech", "fintech", "startup"] as const;
export const ROLE_TYPE_OPTIONS = ["all", "internship", "full-time"] as const;
export const ROLE_FAMILY_OPTIONS = ["all", ...MBA_ROLE_FAMILIES] as const;

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
  q: "",
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
  const rawQuery = readParam(input, "q");
  const rawSort = readParam(input, "sort");
  const rawCategory = readParam(input, "category");
  const rawRoleType = readParam(input, "roleType");
  const rawRoleFamily = readParam(input, "roleFamily");
  return {
    q: rawQuery?.trim() ?? DEFAULT_MBA_JOBS_STATE.q,
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
  if (query) params.set("q", query);
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
