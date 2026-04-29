import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import type { GitHubTrendingSnapshot } from "@/types/githubTrending";

export async function getGitHubTrendingSnapshot(): Promise<GitHubTrendingSnapshot> {
  return githubTrendingSnapshot;
}
