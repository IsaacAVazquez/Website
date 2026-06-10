/**
 * @jest-environment node
 */
jest.mock("@/lib/nbaSnapshot", () => ({
  createEmptyNbaTeamSnapshot: jest.fn(() => ({
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    },
    generatedAt: "2026-04-03T00:00:00.000Z",
  })),
  getNbaTeamSnapshot: jest.fn(),
  isNbaTeamIdShape: jest.fn(),
  isValidNbaTeamId: jest.fn(),
}));

import { GET } from "../route";
import {
  getNbaTeamSnapshot,
  isNbaTeamIdShape,
  isValidNbaTeamId,
} from "@/lib/nbaSnapshot";

const mockGetNbaTeamSnapshot = getNbaTeamSnapshot as jest.MockedFunction<
  typeof getNbaTeamSnapshot
>;
const mockIsNbaTeamIdShape = isNbaTeamIdShape as jest.MockedFunction<typeof isNbaTeamIdShape>;
const mockIsValidNbaTeamId = isValidNbaTeamId as jest.MockedFunction<typeof isValidNbaTeamId>;

describe("GET /api/nba/teams/[teamId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects malformed team ids with a 400 before hitting the data loader", async () => {
    mockIsNbaTeamIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "!" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid team id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetNbaTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when a shaped id is not in the snapshot", async () => {
    mockIsNbaTeamIdShape.mockReturnValue(true);
    mockIsValidNbaTeamId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "zzzz" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetNbaTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns the team snapshot with cache headers", async () => {
    mockIsNbaTeamIdShape.mockReturnValue(true);
    mockIsValidNbaTeamId.mockReturnValue(true);
    mockGetNbaTeamSnapshot.mockResolvedValue({
      team: {
        id: "bos",
        name: "Boston Celtics",
        shortName: "Celtics",
        abbreviation: "BOS",
        logo: null,
        conference: "east",
        division: "Atlantic",
        venue: "TD Garden",
        founded: 1946,
        primaryColor: null,
      },
      recentFixtures: [],
      upcomingFixtures: [],
      form: {
        sequence: ["W", "W", "L", "W", "W"],
        wins: 4,
        losses: 1,
        pointsFor: 592,
        pointsAgainst: 540,
      },
      generatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "bos" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.team.abbreviation).toBe("BOS");
    expect(body.form.pointsFor).toBe(592);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetNbaTeamSnapshot).toHaveBeenCalledWith("bos");
  });

  it("returns a stable empty payload when the team lookup fails", async () => {
    mockIsNbaTeamIdShape.mockReturnValue(true);
    mockIsValidNbaTeamId.mockReturnValue(true);
    mockGetNbaTeamSnapshot.mockRejectedValue(
      Object.assign(new Error("NBA team snapshot was not found."), { status: 503 })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "bos" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(body.recentFixtures).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
