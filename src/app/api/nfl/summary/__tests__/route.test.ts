/**
 * @jest-environment node
 */
jest.mock("@/lib/nflSnapshot", () => ({
  createEmptyNflSummarySnapshot: jest.fn(() => ({
    season: "2026",
    week: 0,
    updatedAt: "2026-04-03T00:00:00.000Z",
    sourceLabel: "NFLverse",
    sourceUrls: { standings: "", games: "", teams: "", leaders: "" },
    teams: [],
    leaders: { passing: [], rushing: [], receiving: [], sacks: [] },
    recentFixtures: [],
    upcomingFixtures: [],
    teamOptions: [],
  })),
  getNflSummarySnapshot: jest.fn(),
}));

import { GET } from "../route";
import { getNflSummarySnapshot } from "@/lib/nflSnapshot";

const mockGetNflSummarySnapshot = getNflSummarySnapshot as jest.MockedFunction<
  typeof getNflSummarySnapshot
>;

describe("GET /api/nfl/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the normalized NFL summary with cache headers", async () => {
    mockGetNflSummarySnapshot.mockResolvedValue({
      season: "2026",
      week: 12,
      updatedAt: "2026-04-03T00:00:00.000Z",
      sourceLabel: "NFLverse",
      sourceUrls: { standings: "standings", games: "games", teams: "teams", leaders: "leaders" },
      teams: [
        {
          id: "kc",
          abbr: "KC",
          name: "Kansas City Chiefs",
          shortName: "Chiefs",
          conference: "AFC",
          division: "AFC West",
          divisionRank: 1,
          conferenceRank: 2,
          wins: 10,
          losses: 2,
          ties: 0,
          winPct: 0.833,
          pointsFor: 330,
          pointsAgainst: 240,
          pointDifferential: 90,
          seed: 2,
          playoffResult: null,
        },
      ],
      leaders: { passing: [], rushing: [], receiving: [], sacks: [] },
      recentFixtures: [],
      upcomingFixtures: [],
      teamOptions: [
        {
          id: "kc",
          abbr: "KC",
          name: "Kansas City Chiefs",
          shortName: "Chiefs",
          location: "Kansas City",
          nickname: "Chiefs",
          conference: "AFC",
          division: "AFC West",
          primaryColor: null,
          secondaryColor: null,
          logo: null,
        },
      ],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.teams[0].shortName).toBe("Chiefs");
    expect(body.teamOptions[0].abbr).toBe("KC");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
  });

  it("returns a stable empty payload when the snapshot is unavailable", async () => {
    mockGetNflSummarySnapshot.mockRejectedValue(
      Object.assign(new Error("NFL summary is not available."), { status: 503 })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not available/i);
    expect(body.teams).toEqual([]);
    expect(body.teamOptions).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
