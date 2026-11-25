import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import type {
  GitHubTrendingClientSnapshot,
} from "@/types/githubTrending";

/**
 * Snapshot view safe to pass to the client component. Strips per-repository
 * build bookkeeping (starHistory, nodeId, watchers, homepageUrl, createdAt,
 * updatedAt), the owner and name that fullName already carries, and the Agent
 * Build Index's weekly editions, none of which the trending page reads, so
 * they stay out of the payload embedded in every page response.
 */
export async function getGitHubTrendingClientSnapshot(): Promise<GitHubTrendingClientSnapshot> {
  const { repositories, agentEditions: _agentEditions, ...rest } = githubTrendingSnapshot;
  return {
    ...rest,
    repositories: repositories.map(
      ({
        nodeId: _nodeId,
        owner: _owner,
        name: _name,
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
