import { updateAgentEditions, editionChanges } from "../agentEditions";
import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";

const fresh = (generatedAt: string) => ({
  ...githubTrendingSnapshot,
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
