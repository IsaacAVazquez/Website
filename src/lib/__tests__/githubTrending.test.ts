import {
  buildGitHubTrendingSnapshot,
  calculateWeeklyStars,
} from "@/lib/githubTrending";
import type { GitHubTrendingSourceRepository } from "@/lib/githubTrending";

function repo(
  id: number,
  overrides: Partial<GitHubTrendingSourceRepository> = {}
): GitHubTrendingSourceRepository {
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
    topics: ["developer-tools"],
    stars: 100,
    forks: 10,
    openIssues: 2,
    watchers: 100,
    licenseSpdxId: "MIT",
    pushedAt: "2026-04-28T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-04-28T00:00:00.000Z",
    ...overrides,
  };
}

describe("GitHub trending snapshot helpers", () => {
  it("calculates measured weekly star deltas from persisted history", () => {
    const result = calculateWeeklyStars(
      [
        { date: "2026-04-21", stars: 100 },
        { date: "2026-04-28", stars: 145 },
      ],
      145,
      "2026-04-28T12:00:00.000Z",
      7
    );

    expect(result).toEqual({
      weeklyStars: 45,
      status: "measured",
      baselineDate: "2026-04-21",
    });
  });

  it("deduplicates repositories across language and topic segments", () => {
    const snapshot = buildGitHubTrendingSnapshot({
      generatedAt: "2026-04-28T12:00:00.000Z",
      windowDays: 7,
      activityWindowDays: 45,
      sourceLabel: "GitHub Search API",
      sourceUrl: "https://docs.github.com/rest/search/search#search-repositories",
      segments: [
        {
          key: "language-typescript",
          label: "TypeScript",
          kind: "language",
          query: "language:TypeScript",
          sourceUrl: "https://github.com/search",
          repositories: [repo(1, { stars: 150 }), repo(2, { stars: 120 })],
        },
        {
          key: "topic-developer-tools",
          label: "Developer Tools",
          kind: "topic",
          query: "topic:developer-tools",
          sourceUrl: "https://github.com/search",
          repositories: [repo(1, { stars: 150 })],
        },
      ],
    });

    expect(snapshot.repositories).toHaveLength(2);
    expect(snapshot.repositories[0].matchedSegments).toEqual([
      "language-typescript",
      "topic-developer-tools",
    ]);
    expect(snapshot.languages[0].repoCount).toBe(2);
    expect(snapshot.topics[0].repoCount).toBe(1);
  });
});
