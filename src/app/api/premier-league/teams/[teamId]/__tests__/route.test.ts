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
  isPremierLeagueTeamIdShape: jest.fn(),
  isValidPremierLeagueTeamId: jest.fn(),
}));

import { GET } from "../route";
import {
  getPremierLeagueTeamSnapshot,
  isPremierLeagueTeamIdShape,
  isValidPremierLeagueTeamId,
} from "@/lib/premierLeagueSnapshot";

const mockGetPremierLeagueTeamSnapshot =
  getPremierLeagueTeamSnapshot as jest.MockedFunction<typeof getPremierLeagueTeamSnapshot>;
const mockIsPremierLeagueTeamIdShape =
  isPremierLeagueTeamIdShape as jest.MockedFunction<typeof isPremierLeagueTeamIdShape>;
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

  it("rejects malformed team ids with a 400 before hitting the data loader", async () => {
    // "abc" is not a numeric PL id, so the shape check rejects it first.
    mockIsPremierLeagueTeamIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "abc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid team id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetPremierLeagueTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when the id has the right shape but isn't in the snapshot", async () => {
    mockIsPremierLeagueTeamIdShape.mockReturnValue(true);
    mockIsValidPremierLeagueTeamId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "9999" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetPremierLeagueTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns the club snapshot with cache headers", async () => {
    mockIsPremierLeagueTeamIdShape.mockReturnValue(true);
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
    mockIsPremierLeagueTeamIdShape.mockReturnValue(true);
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
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
