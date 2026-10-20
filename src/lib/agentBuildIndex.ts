import type {
  GitHubTrendingRepository,
  GitHubTrendingSegment,
  GitHubTrendingSnapshot,
} from "@/types/githubTrending";

const AGENT_SEGMENT_KEY = "topic-agents";

export interface AgentBuildIndex {
  generatedAt: string;
  windowDays: number;
  activityWindowDays: number;
  sourceLabel: string;
  sourceUrl: string;
  agentSegment: GitHubTrendingSegment | null;
  repositories: GitHubTrendingRepository[];
  topicSegments: AgentBuildIndexTopic[];
  measuredRepositoryCount: number;
}

/** A topic group with the number of its repositories whose gain is not a full-window measurement. */
interface AgentBuildIndexTopic extends GitHubTrendingSegment {
  unmeasuredCount: number;
}

/**
 * Builds the focused agent view from the broader GitHub snapshot without
 * copying or reshaping repository history. The page is server-rendered, so the
 * full history remains on the server and no client bundle carries it.
 */
export function getAgentBuildIndex(
  snapshot: GitHubTrendingSnapshot
): AgentBuildIndex {
  const agentSegment =
    snapshot.topics.find((segment) => segment.key === AGENT_SEGMENT_KEY) ?? null;
  const repoById = new Map(
    snapshot.repositories.map((repository) => [repository.id, repository])
  );
  const repositories = (agentSegment?.repoIds ?? [])
    .map((id) => repoById.get(id))
    .filter(
      (repository): repository is GitHubTrendingRepository =>
        repository !== undefined
    )
    .toSorted(
      (left, right) =>
        right.weeklyStars - left.weeklyStars ||
        right.trendScore - left.trendScore
    );

  return {
    generatedAt: snapshot.generatedAt,
    windowDays: snapshot.windowDays,
    activityWindowDays: snapshot.activityWindowDays,
    sourceLabel: snapshot.sourceLabel,
    sourceUrl: snapshot.sourceUrl,
    agentSegment,
    repositories,
    // A topic's weekly figure sums every repository in it, so the page needs to
    // know how many of those sit on a partial window or a new baseline.
    topicSegments: snapshot.topics
      .toSorted((left, right) => right.weeklyStars - left.weeklyStars)
      .map((topic) => ({
        ...topic,
        unmeasuredCount: topic.repoIds.filter(
          (id) => repoById.get(id)?.weeklyStarsStatus !== "measured"
        ).length,
      })),
    measuredRepositoryCount: repositories.filter(
      (repository) => repository.weeklyStarsStatus === "measured"
    ).length,
  };
}

