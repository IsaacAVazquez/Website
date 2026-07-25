import { getAgentBuildIndex } from "@/lib/agentBuildIndex";
import type {
  GitHubTrendingRepository,
  GitHubTrendingSegment,
  GitHubTrendingSnapshot,
} from "@/types/githubTrending";

function repository(
  id: number,
  weeklyStars: number,
  status: GitHubTrendingRepository["weeklyStarsStatus"] = "measured"
): GitHubTrendingRepository {
  return {
    id,
    nodeId: `node-${id}`,
    name: `repo-${id}`,
    fullName: `owner/repo-${id}`,
    owner: "owner",
    description: "Test repository",
    url: `https://github.com/owner/repo-${id}`,
    homepageUrl: null,
    primaryLanguage: "TypeScript",
    topics: ["agent"],
    stars: 1000,
    forks: 100,
    openIssues: 2,
    watchers: 1000,
    licenseSpdxId: "MIT",
    pushedAt: "2026-07-24T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
    weeklyStars,
    weeklyStarsStatus: status,
    weeklyStarsBaselineDate: "2026-07-17",
    starHistory: [],
    matchedSegments: ["topic-agents"],
    trendScore: weeklyStars * 10,
  };
}

function segment(
  key: string,
  weeklyStars: number,
  repoIds: number[]
): GitHubTrendingSegment {
  return {
    key,
    label: key,
    kind: "topic",
    query: `topic:${key}`,
    sourceUrl: "https://github.com/search",
    repoIds,
    repoCount: repoIds.length,
    totalStars: 1000,
    weeklyStars,
    topRepoId: repoIds[0] ?? null,
  };
}

describe("getAgentBuildIndex", () => {
  it("isolates the agent segment and orders repositories by weekly movement", () => {
    const repos = [
      repository(1, 50),
      repository(2, 125),
      repository(3, 75, "partial"),
    ];
    const snapshot = {
      generatedAt: "2026-07-24T10:00:00.000Z",
      windowDays: 7,
      activityWindowDays: 45,
      sourceLabel: "GitHub Search API",
      sourceUrl: "https://docs.github.com/rest/search/search",
      repositories: repos,
      languages: [],
      topics: [
        segment("topic-ai", 180, [1]),
        segment("topic-agents", 250, [1, 2, 3]),
      ],
      totals: {
        repositories: 3,
        languages: 0,
        topics: 2,
        totalStars: 3000,
        weeklyStars: 250,
        measuredWeeklyDeltaCount: 2,
        partialWeeklyDeltaCount: 1,
        baselineCount: 0,
      },
    } satisfies GitHubTrendingSnapshot;

    const index = getAgentBuildIndex(snapshot);

    expect(index.agentSegment?.key).toBe("topic-agents");
    expect(index.repositories.map((repo) => repo.id)).toEqual([2, 3, 1]);
    expect(index.topicSegments.map((topic) => topic.key)).toEqual([
      "topic-agents",
      "topic-ai",
    ]);
    expect(index.measuredRepositoryCount).toBe(2);
  });

  it("returns an empty focused view when the snapshot has no agent segment", () => {
    const snapshot = {
      generatedAt: "2026-07-24T10:00:00.000Z",
      windowDays: 7,
      activityWindowDays: 45,
      sourceLabel: "GitHub Search API",
      sourceUrl: "https://docs.github.com/rest/search/search",
      repositories: [],
      languages: [],
      topics: [],
      totals: {
        repositories: 0,
        languages: 0,
        topics: 0,
        totalStars: 0,
        weeklyStars: 0,
        measuredWeeklyDeltaCount: 0,
        partialWeeklyDeltaCount: 0,
        baselineCount: 0,
      },
    } satisfies GitHubTrendingSnapshot;

    const index = getAgentBuildIndex(snapshot);

    expect(index.agentSegment).toBeNull();
    expect(index.repositories).toEqual([]);
    expect(index.measuredRepositoryCount).toBe(0);
  });
});

