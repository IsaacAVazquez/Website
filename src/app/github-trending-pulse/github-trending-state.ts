import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  GitHubTrendingRouteState,
  GitHubTrendingSegmentKind,
  GitHubTrendingSnapshot,
  GitHubTrendingSortKey,
} from "@/types/githubTrending";

export const GITHUB_TRENDING_ROUTE = "/github-trending-pulse";

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

const VALID_KINDS = new Set<GitHubTrendingSegmentKind>(
  GITHUB_TRENDING_KIND_OPTIONS
);
const VALID_SORTS = new Set<GitHubTrendingSortKey>(
  GITHUB_TRENDING_SORT_OPTIONS
);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_GITHUB_TRENDING_STATE: GitHubTrendingRouteState = {
  kind: "language",
  segment: "all",
  sort: "momentum",
  selectedRepoId: null,
};

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return (input as URLSearchParams).get(key);
  }
  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }
  return rawValue ?? null;
}

export function normalizeGitHubTrendingState(
  input: SearchParamInput
): GitHubTrendingRouteState {
  const kind = readParam(input, "view");
  const segment = readParam(input, "segment");
  const sort = readParam(input, "sort");
  const repo = readParam(input, "repo");
  const repoId = repo ? Number.parseInt(repo, 10) : Number.NaN;

  return {
    kind: VALID_KINDS.has((kind ?? "") as GitHubTrendingSegmentKind)
      ? (kind as GitHubTrendingSegmentKind)
      : DEFAULT_GITHUB_TRENDING_STATE.kind,
    segment: segment && segment.trim().length > 0 ? segment.trim() : "all",
    sort: VALID_SORTS.has((sort ?? "") as GitHubTrendingSortKey)
      ? (sort as GitHubTrendingSortKey)
      : DEFAULT_GITHUB_TRENDING_STATE.sort,
    selectedRepoId: Number.isFinite(repoId) ? repoId : null,
  };
}

export function resolveGitHubTrendingState(
  state: GitHubTrendingRouteState,
  snapshot: GitHubTrendingSnapshot
): GitHubTrendingRouteState {
  const segments = state.kind === "language" ? snapshot.languages : snapshot.topics;
  const validSegments = new Set(segments.map((segment) => segment.key));
  const validRepoIds = new Set(snapshot.repositories.map((repo) => repo.id));

  return {
    kind: VALID_KINDS.has(state.kind)
      ? state.kind
      : DEFAULT_GITHUB_TRENDING_STATE.kind,
    segment:
      state.segment === "all" || validSegments.has(state.segment)
        ? state.segment
        : "all",
    sort: VALID_SORTS.has(state.sort)
      ? state.sort
      : DEFAULT_GITHUB_TRENDING_STATE.sort,
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
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.kind === DEFAULT_GITHUB_TRENDING_STATE.kind) {
    params.delete("view");
  } else {
    params.set("view", state.kind);
  }

  if (state.segment === DEFAULT_GITHUB_TRENDING_STATE.segment) {
    params.delete("segment");
  } else {
    params.set("segment", state.segment);
  }

  if (state.sort === DEFAULT_GITHUB_TRENDING_STATE.sort) {
    params.delete("sort");
  } else {
    params.set("sort", state.sort);
  }

  if (!state.selectedRepoId) {
    params.delete("repo");
  } else {
    params.set("repo", state.selectedRepoId.toString());
  }

  const query = params.toString();
  return `${GITHUB_TRENDING_ROUTE}${query ? `?${query}` : ""}`;
}
