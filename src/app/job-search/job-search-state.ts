import type { ReadonlyURLSearchParams } from "next/navigation";
import type { JobSearchView, JobSearchState } from "@/types/jobsearch";

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

export const DEFAULT_JOB_SEARCH_STATE: JobSearchState = {
  view: "tracker",
};

const VALID_VIEWS = new Set<JobSearchView>(["tracker", "cover-letter", "interview-prep"]);

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) return rawValue[0] ?? null;
  return rawValue ?? null;
}

export function normalizeJobSearchState(input: SearchParamInput): JobSearchState {
  const view = readParam(input, "view");

  return {
    view: VALID_VIEWS.has((view ?? "") as JobSearchView)
      ? (view as JobSearchView)
      : DEFAULT_JOB_SEARCH_STATE.view,
  };
}

export function buildJobSearchHref(state: Partial<JobSearchState>): string {
  const view = state.view ?? DEFAULT_JOB_SEARCH_STATE.view;

  if (view === DEFAULT_JOB_SEARCH_STATE.view) {
    return "/job-search";
  }

  return `/job-search?view=${view}`;
}
