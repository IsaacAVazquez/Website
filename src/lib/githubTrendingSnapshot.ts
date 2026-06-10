import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import type {
  GitHubTrendingClientSnapshot,
  GitHubTrendingSnapshot,
} from "@/types/githubTrending";

export async function getGitHubTrendingSnapshot(): Promise<GitHubTrendingSnapshot> {
  return githubTrendingSnapshot;
}

/**
 * Snapshot view safe to pass to the client component. Strips per-repository
 * build bookkeeping (starHistory, nodeId, watchers, homepageUrl, createdAt,
 * updatedAt) that the UI never reads — roughly halving the serialized
 * payload embedded in every page response.
 */
export async function getGitHubTrendingClientSnapshot(): Promise<GitHubTrendingClientSnapshot> {
  const { repositories, ...rest } = githubTrendingSnapshot;
  return {
    ...rest,
    repositories: repositories.map(
      ({
        nodeId: _nodeId,
        homepageUrl: _homepageUrl,
        watchers: _watchers,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        starHistory: _starHistory,
        ...repo
      }) => repo
    ),
  };
}
