import { updateAgentEditions, editionChanges } from "../agentEditions";
import type {
  GitHubTrendingRepository,
  GitHubTrendingSnapshot,
} from "@/types/githubTrending";

// An inline snapshot, so a refresh that returns an empty Agents segment in the
// committed data cannot fail this test.
const repository = (id: number, weeklyStars: number) =>
  ({
    id,
    fullName: `owner/repo-${id}`,
    stars: 1000 + id,
    weeklyStars,
    weeklyStarsStatus: "measured",
    trendScore: weeklyStars,
  }) as GitHubTrendingRepository;
const snapshot = {
  repositories: [repository(1, 50), repository(2, 125), repository(3, 75)],
  topics: [{ key: "topic-agents", repoIds: [1, 2, 3] }],
} as GitHubTrendingSnapshot;

const fresh = (generatedAt: string) => ({
  ...snapshot,
  generatedAt,
  sourceStatus: {
    status: "fresh" as const,
    failedSegments: [],
    reusedSegments: [],
  },
});
it("updates this week's observation and freezes earlier weeks without fabricating a backfill", () => {
  const first = updateAgentEditions([], fresh("2026-10-20T10:00:00Z"));
  expect(first).toHaveLength(1);
  expect(first[0].weekStart).toBe("2026-10-19");
  expect(first[0].repositories.map((repo) => [repo.id, repo.rank])).toEqual([
    [2, 1],
    [3, 2],
    [1, 3],
  ]);
  const sameWeek = updateAgentEditions(first, fresh("2026-10-25T10:00:00Z"));
  expect(sameWeek).toHaveLength(1);
  const next = updateAgentEditions(sameWeek, fresh("2026-11-02T10:00:00Z"));
  expect(next).toHaveLength(2);
  expect(next[1]).toEqual(sameWeek[0]);
  expect(updateAgentEditions(next, fresh("2026-10-20T10:00:00Z"))).toEqual(
    next,
  );
});
it("keeps the archive when agent data was reused and reports entrants and departures by identity", () => {
  const first = updateAgentEditions([], fresh("2026-10-20T10:00:00Z"));
  expect(
    updateAgentEditions(first, {
      ...fresh("2026-10-26T10:00:00Z"),
      sourceStatus: {
        status: "degraded",
        failedSegments: ["Agents"],
        reusedSegments: ["Agents"],
      },
    }),
  ).toEqual(first);
  const previous = first[0];
  const current = { ...previous, repositories: previous.repositories.slice(1) };
  const changes = editionChanges(current, previous);
  expect(changes.departed).toEqual([previous.repositories[0]]);
  expect(editionChanges(previous, current).entrants).toEqual([
    previous.repositories[0],
  ]);
});
