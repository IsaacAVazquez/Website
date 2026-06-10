import { fireEvent, render, screen, within } from "@testing-library/react";
import type {
  GitHubTrendingRepository,
  GitHubTrendingSegment,
  GitHubTrendingSnapshot,
} from "@/types/githubTrending";
import { GitHubTrendingClient } from "../github-trending-client";
import { DEFAULT_GITHUB_TRENDING_STATE } from "../github-trending-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

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

describe("GitHubTrendingClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders trend filters and navigates segment type, segment, and sort changes", () => {
    render(
      <GitHubTrendingClient
        initialState={DEFAULT_GITHUB_TRENDING_STATE}
        snapshot={snapshot}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /github trending pulse/i })
    ).toBeVisible();

    const filters = screen.getByRole("region", { name: "GitHub trending filters" });

    fireEvent.click(
      within(filters).getByRole("tab", { name: "Topic" })
    );
    expect(mockPush).toHaveBeenLastCalledWith(
      "/github-trending-pulse?view=topic",
      { scroll: false }
    );

    fireEvent.click(within(filters).getByRole("button", { name: "Stars" }));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/github-trending-pulse?sort=stars",
      { scroll: false }
    );

    fireEvent.click(within(filters).getByRole("button", { name: "TypeScript" }));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/github-trending-pulse?segment=typescript",
      { scroll: false }
    );
  });
});
