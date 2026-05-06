import type {
  GitHubTrendingRepository,
  GitHubTrendingSegment,
  GitHubTrendingSnapshot,
} from "@/types/githubTrending";
import {
  buildGitHubTrendingHref,
  DEFAULT_GITHUB_TRENDING_STATE,
  normalizeGitHubTrendingState,
  resolveGitHubTrendingState,
} from "../github-trending-state";

const repo: GitHubTrendingRepository = {
  id: 42,
  nodeId: "R_42",
  name: "fixture",
  fullName: "openai/fixture",
  owner: "openai",
  description: "Fixture repository",
  url: "https://github.com/openai/fixture",
  homepageUrl: null,
  primaryLanguage: "TypeScript",
  topics: ["ai"],
  stars: 1000,
  forks: 100,
  openIssues: 10,
  watchers: 1000,
  licenseSpdxId: "MIT",
  pushedAt: "2026-05-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z",
  weeklyStars: 120,
  weeklyStarsStatus: "measured",
  weeklyStarsBaselineDate: null,
  starHistory: [],
  matchedSegments: ["typescript", "ai"],
  trendScore: 98,
};

function segment(overrides: Partial<GitHubTrendingSegment>): GitHubTrendingSegment {
  return {
    key: "typescript",
    label: "TypeScript",
    kind: "language",
    query: "language:typescript",
    sourceUrl: "https://github.com/search",
    repoIds: [42],
    repoCount: 1,
    totalStars: 1000,
    weeklyStars: 120,
    topRepoId: 42,
    ...overrides,
  };
}

const snapshot: GitHubTrendingSnapshot = {
  generatedAt: "2026-05-04T00:00:00.000Z",
  windowDays: 7,
  activityWindowDays: 30,
  sourceLabel: "Fixture",
  sourceUrl: "https://github.com/search",
  repositories: [repo],
  languages: [segment({ key: "typescript", label: "TypeScript", kind: "language" })],
  topics: [segment({ key: "ai", label: "AI", kind: "topic", query: "topic:ai" })],
  totals: {
    repositories: 1,
    languages: 1,
    topics: 1,
    totalStars: 1000,
    weeklyStars: 120,
    measuredWeeklyDeltaCount: 1,
    partialWeeklyDeltaCount: 0,
    baselineCount: 0,
  },
};

describe("github-trending-state", () => {
  it("normalizes valid and invalid params", () => {
    expect(normalizeGitHubTrendingState({})).toEqual(DEFAULT_GITHUB_TRENDING_STATE);
    expect(
      normalizeGitHubTrendingState({
        view: "topic",
        segment: " ai ",
        sort: "stars",
        repo: "42",
      })
    ).toEqual({
      kind: "topic",
      segment: "ai",
      sort: "stars",
      selectedRepoId: 42,
    });
    expect(
      normalizeGitHubTrendingState({
        view: "owner",
        sort: "forks",
        repo: "not-a-number",
      })
    ).toEqual(DEFAULT_GITHUB_TRENDING_STATE);
  });

  it("resolves segment and repository ids against the snapshot", () => {
    expect(
      resolveGitHubTrendingState(
        {
          kind: "topic",
          segment: "ai",
          sort: "updated",
          selectedRepoId: 42,
        },
        snapshot
      )
    ).toEqual({
      kind: "topic",
      segment: "ai",
      sort: "updated",
      selectedRepoId: 42,
    });

    expect(
      resolveGitHubTrendingState(
        {
          kind: "language",
          segment: "missing",
          sort: "momentum",
          selectedRepoId: 99,
        },
        snapshot
      )
    ).toEqual({
      kind: "language",
      segment: "all",
      sort: "momentum",
      selectedRepoId: null,
    });
  });

  it("builds hrefs while preserving unrelated params and clearing defaults", () => {
    expect(
      buildGitHubTrendingHref(
        {
          kind: "topic",
          segment: "ai",
          sort: "stars",
          selectedRepoId: 42,
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/github-trending-pulse?ref=portfolio&view=topic&segment=ai&sort=stars&repo=42");

    expect(
      buildGitHubTrendingHref(
        DEFAULT_GITHUB_TRENDING_STATE,
        new URLSearchParams("ref=portfolio&view=topic&segment=ai&sort=stars&repo=42")
      )
    ).toBe("/github-trending-pulse?ref=portfolio");
  });
});
