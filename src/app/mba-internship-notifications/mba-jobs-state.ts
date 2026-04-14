// ---------------------------------------------------------------------------
// MBA Internship Notifications – URL state management
// ---------------------------------------------------------------------------

import type { MBAJobsSearchState, MBASortOrder, MBACategoryFilter } from "@/types/mba-jobs";

export const MBA_JOBS_ROUTE = "/mba-internship-notifications";

export const SORT_OPTIONS = ["newest", "oldest"] as const;
export const CATEGORY_OPTIONS = ["all", "big-tech", "fintech", "startup"] as const;

export const SORT_LABELS: Record<MBASortOrder, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};

export const CATEGORY_LABELS: Record<MBACategoryFilter, string> = {
  all: "All companies",
  "big-tech": "Big Tech",
  fintech: "Fintech",
  startup: "Startup",
};

export const DEFAULT_MBA_JOBS_STATE: MBAJobsSearchState = {
  sort: "newest",
  category: "all",
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
  const rawSort = readParam(input, "sort");
  const rawCategory = readParam(input, "category");
  return {
    sort: isValidOption(rawSort, SORT_OPTIONS)
      ? rawSort
      : DEFAULT_MBA_JOBS_STATE.sort,
    category: isValidOption(rawCategory, CATEGORY_OPTIONS)
      ? rawCategory
      : DEFAULT_MBA_JOBS_STATE.category,
  };
}

export function buildMBAJobsHref(state: MBAJobsSearchState): string {
  const params = new URLSearchParams();
  if (state.sort !== DEFAULT_MBA_JOBS_STATE.sort) params.set("sort", state.sort);
  if (state.category !== DEFAULT_MBA_JOBS_STATE.category)
    params.set("category", state.category);
  const qs = params.toString();
  return qs ? `${MBA_JOBS_ROUTE}?${qs}` : MBA_JOBS_ROUTE;
}
