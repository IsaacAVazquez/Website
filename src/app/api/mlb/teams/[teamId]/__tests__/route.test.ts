/**
 * @jest-environment node
 */
jest.mock("@/lib/mlbSnapshot", () => ({
  createEmptyMlbTeamSnapshot: jest.fn(() => ({
    team: null,
    recentGames: [],
    upcomingGames: [],
    form: {
      sequence: [],
      wins: 0,
      losses: 0,
      runsFor: 0,
      runsAgainst: 0,
    },
    generatedAt: "2026-04-03T00:00:00.000Z",
  })),
  getMlbTeamSnapshot: jest.fn(),
  isMlbTeamIdShape: jest.fn(),
  isValidMlbTeamId: jest.fn(),
}));

import { GET } from "../route";
import {
  getMlbTeamSnapshot,
  isMlbTeamIdShape,
  isValidMlbTeamId,
} from "@/lib/mlbSnapshot";

const mockGetMlbTeamSnapshot = getMlbTeamSnapshot as jest.MockedFunction<
  typeof getMlbTeamSnapshot
>;
const mockIsMlbTeamIdShape = isMlbTeamIdShape as jest.MockedFunction<typeof isMlbTeamIdShape>;
const mockIsValidMlbTeamId = isValidMlbTeamId as jest.MockedFunction<typeof isValidMlbTeamId>;

describe("GET /api/mlb/teams/[teamId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects malformed team ids with a 400 before hitting the data loader", async () => {
    mockIsMlbTeamIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "abc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid team id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetMlbTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when a shaped id is not in the snapshot", async () => {
    mockIsMlbTeamIdShape.mockReturnValue(true);
    mockIsValidMlbTeamId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "99999" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetMlbTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns the team snapshot with cache headers", async () => {
    mockIsMlbTeamIdShape.mockReturnValue(true);
    mockIsValidMlbTeamId.mockReturnValue(true);
    mockGetMlbTeamSnapshot.mockResolvedValue({
      team: {
        id: "147",
        name: "New York Yankees",
        shortName: "Yankees",
        abbreviation: "NYY",
        league: "AL",
        division: "AL East",
        venue: "Yankee Stadium",
        logo: null,
        founded: 1901,
        primaryColor: null,
      },
      recentGames: [],
      upcomingGames: [],
      form: {
        sequence: ["W", "W", "L", "W", "W"],
        wins: 4,
        losses: 1,
        runsFor: 29,
        runsAgainst: 18,
      },
      generatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "147" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.team.abbreviation).toBe("NYY");
    expect(body.form.runsFor).toBe(29);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetMlbTeamSnapshot).toHaveBeenCalledWith("147");
  });

  it("returns a stable empty payload when the team lookup fails", async () => {
    mockIsMlbTeamIdShape.mockReturnValue(true);
    mockIsValidMlbTeamId.mockReturnValue(true);
    mockGetMlbTeamSnapshot.mockRejectedValue(
      Object.assign(new Error("MLB team snapshot was not found."), { status: 503 })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "147" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(body.recentGames).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
