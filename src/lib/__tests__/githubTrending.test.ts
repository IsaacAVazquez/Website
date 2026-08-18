import {
  buildGitHubTrendingSnapshot,
  calculateWeeklyStars,
} from "@/lib/githubTrending";
import type { GitHubTrendingSourceRepository } from "@/lib/githubTrending";
import type { GitHubTrendingSnapshot } from "@/types/githubTrending";

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

  // A segment whose fetch fails is restored from the previous snapshot, which
  // carries the previous run's star counts. Writing those under today's date
  // recorded a measurement that never happened, and the series only ever sets
  // today's key, so it could not be corrected later. The false point became the
  // baseline on exactly one day, day N+7, widening the seven-day window to eight
  // and overstating weeklyStars while the page still labeled it "measured".
  const previousSnapshotWith = (starHistory: Array<{ date: string; stars: number }>) =>
    ({
      repositories: [
        {
          ...repo(1, { stars: 100 }),
          weeklyStars: 0,
          weeklyStarsStatus: "measured",
          weeklyStarsBaselineDate: starHistory[0]?.date ?? null,
          starHistory,
          matchedSegments: ["language-typescript"],
          trendScore: 0,
        },
      ],
    }) as unknown as GitHubTrendingSnapshot;

  const buildWith = (
    segments: Parameters<typeof buildGitHubTrendingSnapshot>[0]["segments"],
    previousSnapshot: GitHubTrendingSnapshot
  ) =>
    buildGitHubTrendingSnapshot({
      generatedAt: "2026-04-28T12:00:00.000Z",
      windowDays: 7,
      activityWindowDays: 45,
      sourceLabel: "GitHub Search API",
      sourceUrl: "https://docs.github.com/rest/search/search#search-repositories",
      previousSnapshot,
      segments,
    });

  const typescriptSegment = (
    overrides: { stars?: number; reused?: boolean } = {}
  ) => ({
    key: "language-typescript",
    label: "TypeScript",
    kind: "language" as const,
    query: "language:TypeScript",
    sourceUrl: "https://github.com/search",
    repositories: [repo(1, { stars: overrides.stars ?? 100 })],
    ...(overrides.reused ? { reused: true } : {}),
  });

  it("skips today's star point for a reused segment", () => {
    const previous = previousSnapshotWith([
      { date: "2026-04-21", stars: 60 },
      { date: "2026-04-27", stars: 100 },
    ]);

    const snapshot = buildWith([typescriptSegment({ reused: true })], previous);
    const history = snapshot.repositories[0].starHistory;

    expect(history.map((point) => point.date)).toEqual([
      "2026-04-21",
      "2026-04-27",
    ]);
    expect(history.some((point) => point.date === "2026-04-28")).toBe(false);
  });

  it("records today's star point for a live segment", () => {
    const previous = previousSnapshotWith([
      { date: "2026-04-21", stars: 60 },
      { date: "2026-04-27", stars: 100 },
    ]);

    const snapshot = buildWith([typescriptSegment({ stars: 130 })], previous);
    const history = snapshot.repositories[0].starHistory;

    expect(history).toContainEqual({ date: "2026-04-28", stars: 130 });
  });

  it("prefers a live segment's reading when a repo is in both a live and a reused segment", () => {
    const previous = previousSnapshotWith([
      { date: "2026-04-21", stars: 60 },
      { date: "2026-04-27", stars: 100 },
    ]);

    // The reused segment is listed first, so without ordering the stale reading
    // would seed the repo and today's point would be skipped despite a live
    // reading existing for it.
    const snapshot = buildWith(
      [
        { ...typescriptSegment({ reused: true }), key: "topic-security", label: "Security", kind: "topic" as const },
        typescriptSegment({ stars: 130 }),
      ],
      previous
    );
    const history = snapshot.repositories[0].starHistory;

    expect(history).toContainEqual({ date: "2026-04-28", stars: 130 });
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
