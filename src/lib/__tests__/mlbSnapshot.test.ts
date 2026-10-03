/**
 * @jest-environment node
 */
function mockGames(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index + 1}` }));
}

jest.mock("@/data/mlbSnapshot", () => ({
  mlbSnapshot: {
    season: "2026",
    generatedAt: "2026-07-19T12:00:00.000Z",
    updatedAt: "2026-07-19",
    sourceLabel: "MLB Stats API",
    sourceUrls: { standings: "standings", schedule: "schedule", leaders: "leaders" },
    teams: [],
    standings: [],
    recentGames: mockGames("recent", 12),
    upcomingGames: mockGames("upcoming", 3),
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
    teamSnapshots: {
      "147": {
        team: { id: "147", name: "New York Yankees" },
        recentGames: mockGames("nyy-recent", 7),
        upcomingGames: mockGames("nyy-upcoming", 2),
        form: { sequence: ["W"], wins: 1, losses: 0, runsFor: 5, runsAgainst: 2 },
        generatedAt: "2026-07-19T12:00:00.000Z",
      },
      "999": null,
    },
  },
}));

import {
  createEmptyMlbTeamSnapshot,
  getMlbSummarySnapshot,
  getMlbTeamSnapshot,
  isMlbTeamIdShape,
  isValidMlbTeamId,
} from "../mlbSnapshot";

describe("getMlbSummarySnapshot", () => {
  it("returns the committed summary without the team snapshots", async () => {
    const summary = await getMlbSummarySnapshot();

    expect(summary.updatedAt).toBe("2026-07-19");
    expect("teamSnapshots" in summary).toBe(false);
  });
});

describe("MLB snapshot caps and lookups", () => {
  it("caps the summary's game lists at ten", async () => {
    const summary = await getMlbSummarySnapshot();
    expect(summary.recentGames).toHaveLength(10);
    expect(summary.upcomingGames).toHaveLength(3);
  });

  it("caps a team's games at five and 404s unknown, null, or prototype ids", async () => {
    const team = await getMlbTeamSnapshot("147");
    expect(team.recentGames).toHaveLength(5);
    expect(team.upcomingGames).toHaveLength(2);
    expect(team.form.wins).toBe(1);

    await expect(getMlbTeamSnapshot("111")).rejects.toMatchObject({
      status: 404,
      message: "MLB team snapshot was not found.",
    });
    await expect(getMlbTeamSnapshot("999")).rejects.toMatchObject({ status: 404 });
    await expect(getMlbTeamSnapshot("constructor")).rejects.toMatchObject({ status: 404 });
  });

  it("accepts positive integer ids of up to five digits", () => {
    expect(isMlbTeamIdShape("147")).toBe(true);
    expect(isMlbTeamIdShape("0")).toBe(false);
    expect(isMlbTeamIdShape("123456")).toBe(false);
    expect(isMlbTeamIdShape("nyy")).toBe(false);
    expect(isValidMlbTeamId("147")).toBe(true);
    expect(isValidMlbTeamId("111")).toBe(false);
  });

  it("builds an empty team snapshot for the unavailable state", () => {
    const empty = createEmptyMlbTeamSnapshot();
    expect(empty).toMatchObject({
      team: null,
      recentGames: [],
      upcomingGames: [],
      form: { sequence: [], wins: 0, losses: 0, runsFor: 0, runsAgainst: 0 },
    });
    expect(Number.isNaN(Date.parse(empty.generatedAt))).toBe(false);
  });
});
