/**
 * @jest-environment node
 */
jest.mock("@/lib/mlbSnapshot", () => ({
  createEmptyMlbSummarySnapshot: jest.fn(() => ({
    season: "2026",
    updatedAt: "2026-04-03T00:00:00.000Z",
    sourceLabel: "MLB Stats API",
    sourceUrls: { standings: "", schedule: "", leaders: "" },
    teams: [],
    standings: [],
    recentGames: [],
    upcomingGames: [],
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
  })),
  getMlbSummarySnapshot: jest.fn(),
}));

import { GET } from "../route";
import { getMlbSummarySnapshot } from "@/lib/mlbSnapshot";

const mockGetMlbSummarySnapshot = getMlbSummarySnapshot as jest.MockedFunction<
  typeof getMlbSummarySnapshot
>;

describe("GET /api/mlb/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the normalized MLB summary with cache headers", async () => {
    mockGetMlbSummarySnapshot.mockResolvedValue({
      season: "2026",
      updatedAt: "2026-04-03T00:00:00.000Z",
      sourceLabel: "MLB Stats API",
      sourceUrls: { standings: "standings", schedule: "schedule", leaders: "leaders" },
      teams: [
        {
          id: "147",
          name: "New York Yankees",
          shortName: "Yankees",
          abbreviation: "NYY",
          league: "AL",
          division: "AL East",
          venue: "Yankee Stadium",
          logo: null,
        },
      ],
      standings: [
        {
          id: "147",
          code: "NYY",
          name: "New York Yankees",
          shortName: "Yankees",
          league: "AL",
          division: "AL East",
          divisionRank: 1,
          leagueRank: 2,
          wildCardRank: null,
          gamesBack: 0,
          wildCardGamesBack: null,
          wins: 92,
          losses: 60,
          pct: 0.605,
          runsScored: 760,
          runsAllowed: 650,
          runDifferential: 110,
          streak: "W3",
          last10: "7-3",
        },
      ],
      recentGames: [],
      upcomingGames: [],
      hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
      pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.standings[0].shortName).toBe("Yankees");
    expect(body.teams[0].abbreviation).toBe("NYY");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=60, stale-while-revalidate=300"
    );
    expect(response.headers.get("X-Data-Source")).toBe(
      "statsapi-runtime-with-snapshot-fallback"
    );
    expect(mockGetMlbSummarySnapshot).toHaveBeenCalledWith({ preferLive: true });
  });

  it("returns a stable empty payload when the snapshot is unavailable", async () => {
    mockGetMlbSummarySnapshot.mockRejectedValue(
      Object.assign(new Error("MLB summary is not available."), { status: 503 })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not available/i);
    expect(body.standings).toEqual([]);
    expect(body.teams).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
