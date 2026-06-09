/**
 * @jest-environment node
 */
jest.mock("@/lib/nbaSnapshot", () => ({
  createEmptyNbaSummarySnapshot: jest.fn(() => ({
    season: "2025/26",
    updatedAt: "2026-04-03T00:00:00.000Z",
    sourceLabel: "ESPN",
    sourceUrls: { standings: "", leaders: "", scoreboard: "" },
    teamsByConference: { east: [], west: [] },
    scorers: [],
    rebounders: [],
    assistLeaders: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
  })),
  getNbaSummarySnapshot: jest.fn(),
}));

import { GET } from "../route";
import { getNbaSummarySnapshot } from "@/lib/nbaSnapshot";

const mockGetNbaSummarySnapshot = getNbaSummarySnapshot as jest.MockedFunction<
  typeof getNbaSummarySnapshot
>;

describe("GET /api/nba/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the normalized NBA summary with cache headers", async () => {
    mockGetNbaSummarySnapshot.mockResolvedValue({
      season: "2025/26",
      updatedAt: "2026-04-03T00:00:00.000Z",
      sourceLabel: "ESPN",
      sourceUrls: { standings: "standings", leaders: "leaders", scoreboard: "scoreboard" },
      teamsByConference: {
        east: [
          {
            id: "bos",
            abbreviation: "BOS",
            name: "Boston Celtics",
            shortName: "Celtics",
            conference: "east",
            division: "Atlantic",
            conferenceSeed: 1,
            position: 1,
            wins: 61,
            losses: 21,
            winPercent: 0.744,
            gamesBack: 0,
            gamesPlayed: 82,
            pointsFor: 9880,
            pointsAgainst: 9300,
            pointDifferential: 580,
            streak: "W4",
            homeRecord: "32-9",
            awayRecord: "29-12",
            lastTen: "8-2",
          },
        ],
        west: [],
      },
      scorers: [],
      rebounders: [],
      assistLeaders: [],
      recentFixtures: [],
      upcomingFixtures: [],
      teams: [
        {
          id: "bos",
          name: "Boston Celtics",
          shortName: "Celtics",
          abbreviation: "BOS",
          logo: null,
          conference: "east",
          division: "Atlantic",
          venue: "TD Garden",
        },
      ],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.teamsByConference.east[0].shortName).toBe("Celtics");
    expect(body.teams[0].abbreviation).toBe("BOS");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
  });

  it("returns a stable empty payload when the snapshot is unavailable", async () => {
    mockGetNbaSummarySnapshot.mockRejectedValue(
      Object.assign(new Error("NBA summary is not available."), { status: 503 })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not available/i);
    expect(body.teamsByConference.east).toEqual([]);
    expect(body.teams).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
