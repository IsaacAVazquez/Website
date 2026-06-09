/**
 * @jest-environment node
 */
jest.mock("@/lib/nflSnapshot", () => ({
  createEmptyNflTeamSnapshot: jest.fn(() => ({
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      ties: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    },
    generatedAt: "2026-04-03T00:00:00.000Z",
  })),
  getNflTeamSnapshot: jest.fn(),
  isNflTeamIdShape: jest.fn(),
  isValidNflTeamId: jest.fn(),
}));

import { GET } from "../route";
import {
  getNflTeamSnapshot,
  isNflTeamIdShape,
  isValidNflTeamId,
} from "@/lib/nflSnapshot";

const mockGetNflTeamSnapshot = getNflTeamSnapshot as jest.MockedFunction<
  typeof getNflTeamSnapshot
>;
const mockIsNflTeamIdShape = isNflTeamIdShape as jest.MockedFunction<typeof isNflTeamIdShape>;
const mockIsValidNflTeamId = isValidNflTeamId as jest.MockedFunction<typeof isValidNflTeamId>;

describe("GET /api/nfl/teams/[teamId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects malformed team ids with a 400 before hitting the data loader", async () => {
    mockIsNflTeamIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "123" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid team id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetNflTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when a shaped id is not in the snapshot", async () => {
    mockIsNflTeamIdShape.mockReturnValue(true);
    mockIsValidNflTeamId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "zzz" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetNflTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns the team snapshot with cache headers", async () => {
    mockIsNflTeamIdShape.mockReturnValue(true);
    mockIsValidNflTeamId.mockReturnValue(true);
    mockGetNflTeamSnapshot.mockResolvedValue({
      team: {
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
        wordmark: null,
      },
      recentFixtures: [],
      upcomingFixtures: [],
      form: {
        sequence: ["W", "W", "W", "L", "W"],
        wins: 4,
        ties: 0,
        losses: 1,
        pointsFor: 141,
        pointsAgainst: 98,
      },
      generatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "kc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.team.abbr).toBe("KC");
    expect(body.form.pointsFor).toBe(141);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetNflTeamSnapshot).toHaveBeenCalledWith("kc");
  });

  it("returns a stable empty payload when the team lookup fails", async () => {
    mockIsNflTeamIdShape.mockReturnValue(true);
    mockIsValidNflTeamId.mockReturnValue(true);
    mockGetNflTeamSnapshot.mockRejectedValue(
      Object.assign(new Error("NFL team snapshot was not found."), { status: 503 })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "kc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(body.recentFixtures).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
