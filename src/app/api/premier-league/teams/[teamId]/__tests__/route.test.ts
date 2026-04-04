/**
 * @jest-environment node
 */
jest.mock("@/lib/premierLeagueSnapshot", () => ({
  createEmptyPremierLeagueTeamSnapshot: jest.fn(() => ({
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    generatedAt: "2026-04-03T00:00:00.000Z",
  })),
  getPremierLeagueTeamSnapshot: jest.fn(),
  isValidPremierLeagueTeamId: jest.fn(),
}));

import { GET } from "../route";
import {
  getPremierLeagueTeamSnapshot,
  isValidPremierLeagueTeamId,
} from "@/lib/premierLeagueSnapshot";

const mockGetPremierLeagueTeamSnapshot =
  getPremierLeagueTeamSnapshot as jest.MockedFunction<typeof getPremierLeagueTeamSnapshot>;
const mockIsValidPremierLeagueTeamId =
  isValidPremierLeagueTeamId as jest.MockedFunction<typeof isValidPremierLeagueTeamId>;

describe("GET /api/premier-league/teams/[teamId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects invalid team ids before hitting the data loader", async () => {
    mockIsValidPremierLeagueTeamId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "abc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid team id/i);
    expect(mockGetPremierLeagueTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns the club snapshot with cache headers", async () => {
    mockIsValidPremierLeagueTeamId.mockReturnValue(true);
    mockGetPremierLeagueTeamSnapshot.mockResolvedValue({
      team: {
        id: "57",
        name: "Arsenal FC",
        shortName: "Arsenal",
        tla: "ARS",
        crest: null,
        venue: "Emirates Stadium",
        founded: 1886,
        clubColors: "Red / White",
        website: "https://www.arsenal.com",
        address: null,
      },
      recentFixtures: [],
      upcomingFixtures: [],
      form: {
        sequence: ["W", "W", "D", "L", "W"],
        wins: 3,
        draws: 1,
        losses: 1,
        points: 10,
        goalsFor: 9,
        goalsAgainst: 5,
      },
      generatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "57" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.team.shortName).toBe("Arsenal");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetPremierLeagueTeamSnapshot).toHaveBeenCalledWith("57");
  });

  it("returns a stable empty payload when the snapshot team lookup fails", async () => {
    mockIsValidPremierLeagueTeamId.mockReturnValue(true);
    mockGetPremierLeagueTeamSnapshot.mockRejectedValue(
      Object.assign(new Error("Premier League team snapshot was not found."), {
        status: 503,
      })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "57" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(body.recentFixtures).toEqual([]);
  });
});
