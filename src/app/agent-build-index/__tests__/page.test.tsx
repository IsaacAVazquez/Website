import { render, screen, within } from "@testing-library/react";
import type {
  GitHubTrendingRepository,
  GitHubTrendingSegment,
  GitHubTrendingSnapshot,
} from "@/types/githubTrending";
import AgentBuildIndexPage from "../page";

jest.mock("@/components/newsletter/NewsletterSignup", () => ({
  NewsletterSignup: () => null,
}));

// The page builds its index at module scope, so the snapshot is swapped before
// the import. Repository 2 is on a partial window and sits in both groups, and
// repository 3 has no history yet.
jest.mock("@/data/githubTrendingSnapshot", () => {
  const repository = (
    id: number,
    weeklyStars: number,
    weeklyStarsStatus: GitHubTrendingRepository["weeklyStarsStatus"]
  ): GitHubTrendingRepository => ({
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
    stars: 5000,
    forks: 100,
    openIssues: 2,
    watchers: 5000,
    licenseSpdxId: "MIT",
    pushedAt: "2026-10-11T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-10-11T00:00:00.000Z",
    weeklyStars,
    weeklyStarsStatus,
    weeklyStarsBaselineDate: "2026-10-05",
    starHistory: [],
    matchedSegments: ["topic-agents"],
    trendScore: weeklyStars,
  });
  const topic = (
    key: string,
    label: string,
    weeklyStars: number,
    repoIds: number[]
  ): GitHubTrendingSegment => ({
    key,
    label,
    kind: "topic",
    query: `topic:${key}`,
    sourceUrl: "https://github.com/search",
    repoIds,
    repoCount: repoIds.length,
    totalStars: 5000 * repoIds.length,
    weeklyStars,
    topRepoId: repoIds[0] ?? null,
  });
  const snapshot: GitHubTrendingSnapshot = {
    generatedAt: "2026-10-12T17:01:04.086Z",
    windowDays: 7,
    activityWindowDays: 45,
    sourceLabel: "GitHub Search API",
    sourceUrl: "https://docs.github.com/rest/search/search",
    repositories: [
      repository(1, 3687, "measured"),
      repository(2, 900, "partial"),
      repository(3, 0, "baseline"),
    ],
    languages: [],
    topics: [
      topic("topic-agents", "Agents", 4587, [1, 2, 3]),
      topic("topic-llm", "LLMs", 900, [2]),
      topic("topic-security", "Security", 3687, [1]),
    ],
    totals: {
      repositories: 2,
      languages: 0,
      topics: 3,
      totalStars: 10000,
      weeklyStars: 4587,
      measuredWeeklyDeltaCount: 1,
      partialWeeklyDeltaCount: 1,
      baselineCount: 0,
    },
  };
  return { githubTrendingSnapshot: snapshot };
});

describe("AgentBuildIndexPage", () => {
  it("marks a topic total that includes repositories without a full window", () => {
    render(<AgentBuildIndexPage />);

    const topics = screen.getByRole("heading", { name: "Where the tracked attention sits" })
      .parentElement as HTMLElement;
    const row = (label: string) => within(topics).getByText(label).closest("li") as HTMLElement;

    // The mark is a block on screen, and the space keeps it off the figure in plain text.
    expect(row("Agents")).toHaveTextContent("+4.6K 2 partial");
    expect(within(row("Agents")).getByText("2 partial")).toBeVisible();
    expect(within(row("LLMs")).getByText("1 partial")).toBeVisible();
    expect(within(row("Security")).queryByText(/partial/)).toBeNull();
  });

  it("follows the agent group's sentence with the one that explains the partial mark", () => {
    render(<AgentBuildIndexPage />);

    const topics = screen.getByRole("heading", { name: "Where the tracked attention sits" })
      .parentElement as HTMLElement;
    expect(topics.querySelector("p")).toHaveTextContent(
      "Agents lead the tracked topic groups in this snapshot with +4.6K stars over 7 days, across 15K total stars. Where a total is marked partial, that many of its repositories were not measured over the full 7 days."
    );
  });

  it("prints a repository on a new baseline as a baseline and not as no change", () => {
    render(<AgentBuildIndexPage />);

    const ranked = within(
      screen.getByRole("region", { name: "The repositories moving fastest this week" })
    );
    const row = ranked.getByText("New baseline").closest("li") as HTMLElement;
    expect(within(row).getByText("Baseline")).toBeVisible();
    expect(ranked.queryByText("No change")).toBeNull();
  });

  it("prints a ranked gain in the thousands to one decimal", () => {
    render(<AgentBuildIndexPage />);

    const ranked = within(
      screen.getByRole("region", { name: "The repositories moving fastest this week" })
    );
    expect(ranked.getByText("+3.7K")).toBeVisible();
    expect(ranked.getByText("+900")).toBeVisible();
  });
});
