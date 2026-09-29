/**
 * @jest-environment node
 */
jest.mock("@/data/mlbSnapshot", () => ({
  mlbSnapshot: {
    season: "2026",
    generatedAt: "2026-07-19T12:00:00.000Z",
    updatedAt: "2026-07-19",
    sourceLabel: "MLB Stats API",
    sourceUrls: { standings: "standings", schedule: "schedule", leaders: "leaders" },
    teams: [],
    standings: [],
    recentGames: [],
    upcomingGames: [],
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
    teamSnapshots: {},
  },
}));

import { getMlbSummarySnapshot } from "../mlbSnapshot";

describe("getMlbSummarySnapshot", () => {
  it("returns the committed summary without the team snapshots", async () => {
    const summary = await getMlbSummarySnapshot();

    expect(summary.updatedAt).toBe("2026-07-19");
    expect("teamSnapshots" in summary).toBe(false);
  });
});
