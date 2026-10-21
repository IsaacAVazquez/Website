import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  GitHubTrendingRouteState,
  GitHubTrendingSegmentKind,
  GitHubTrendingClientSnapshot,
  GitHubTrendingSortKey,
} from "@/types/githubTrending";
import { enumValue } from "@/lib/utils";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

const GITHUB_TRENDING_ROUTE = "/github-trending-pulse";

export const GITHUB_TRENDING_KIND_OPTIONS = ["language", "topic"] as const;
export const GITHUB_TRENDING_SORT_OPTIONS = [
  "momentum",
  "stars",
  "updated",
] as const;

export const GITHUB_TRENDING_KIND_LABELS: Record<
  GitHubTrendingSegmentKind,
  string
> = {
  language: "Language",
  topic: "Topic",
};

export const GITHUB_TRENDING_SORT_LABELS: Record<
  GitHubTrendingSortKey,
  string
> = {
  momentum: "Momentum",
  stars: "Stars",
  updated: "Updated",
};

export const DEFAULT_GITHUB_TRENDING_STATE: GitHubTrendingRouteState = {
  kind: "language",
  segment: "all",
  sort: "momentum",
  selectedRepoId: null,
};

export function normalizeGitHubTrendingState(
  input: SearchParamInput
): GitHubTrendingRouteState {
  const repoId = Number.parseInt(readParam(input, "repo") ?? "", 10);

  return {
    kind: readEnum(input, "view", GITHUB_TRENDING_KIND_OPTIONS, DEFAULT_GITHUB_TRENDING_STATE.kind),
    segment: readParam(input, "segment")?.trim() || "all",
    sort: readEnum(input, "sort", GITHUB_TRENDING_SORT_OPTIONS, DEFAULT_GITHUB_TRENDING_STATE.sort),
    selectedRepoId: Number.isFinite(repoId) ? repoId : null,
  };
}

export function resolveGitHubTrendingState(
  state: GitHubTrendingRouteState,
  snapshot: GitHubTrendingClientSnapshot
): GitHubTrendingRouteState {
  const segments = state.kind === "language" ? snapshot.languages : snapshot.topics;
  const validSegments = new Set(segments.map((segment) => segment.key));
  const validRepoIds = new Set(snapshot.repositories.map((repo) => repo.id));

  return {
    kind: enumValue(state.kind, GITHUB_TRENDING_KIND_OPTIONS, DEFAULT_GITHUB_TRENDING_STATE.kind),
    segment:
      state.segment === "all" || validSegments.has(state.segment)
        ? state.segment
        : "all",
    sort: enumValue(state.sort, GITHUB_TRENDING_SORT_OPTIONS, DEFAULT_GITHUB_TRENDING_STATE.sort),
    selectedRepoId:
      state.selectedRepoId && validRepoIds.has(state.selectedRepoId)
        ? state.selectedRepoId
        : null,
  };
}

export function buildGitHubTrendingHref(
  state: GitHubTrendingRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    GITHUB_TRENDING_ROUTE,
    {
      view: state.kind,
      segment: state.segment,
      sort: state.sort,
      repo: state.selectedRepoId || null,
    },
    { ...DEFAULT_GITHUB_TRENDING_STATE, view: DEFAULT_GITHUB_TRENDING_STATE.kind },
    baseSearchParams
  );
}
