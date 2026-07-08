/**
 * @jest-environment node
 */
jest.mock("@/lib/worldCupSnapshot", () => ({
  createEmptyWorldCupTeamSnapshot: jest.fn(() => ({
    team: null,
    standing: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    generatedAt: "2026-07-06T00:00:00.000Z",
  })),
  getWorldCupTeamSnapshot: jest.fn(),
  isValidWorldCupTeamId: jest.fn(),
  isWorldCupTeamIdShape: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { GET } from "../route";
import {
  getWorldCupTeamSnapshot,
  isValidWorldCupTeamId,
  isWorldCupTeamIdShape,
} from "@/lib/worldCupSnapshot";
import { logger } from "@/lib/logger";

const mockGetWorldCupTeamSnapshot = getWorldCupTeamSnapshot as jest.MockedFunction<
  typeof getWorldCupTeamSnapshot
>;
const mockIsValidWorldCupTeamId = isValidWorldCupTeamId as jest.MockedFunction<
  typeof isValidWorldCupTeamId
>;
const mockIsWorldCupTeamIdShape = isWorldCupTeamIdShape as jest.MockedFunction<
  typeof isWorldCupTeamIdShape
>;
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>;

describe("GET /api/world-cup/teams/[teamId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects malformed team ids with a 400 before hitting the data loader", async () => {
    mockIsWorldCupTeamIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "!" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid team id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockIsValidWorldCupTeamId).not.toHaveBeenCalled();
    expect(mockGetWorldCupTeamSnapshot).not.toHaveBeenCalled();
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when a shaped id is not in the snapshot", async () => {
    mockIsWorldCupTeamIdShape.mockReturnValue(true);
    mockIsValidWorldCupTeamId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "atlantis" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetWorldCupTeamSnapshot).not.toHaveBeenCalled();
    // A missing-but-well-formed id is expected input, not a server fault.
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("treats a prototype key like 'constructor' as a 404, not a 200", async () => {
    // Exercise the REAL guards: "constructor" passes the slug-shape regex but is
    // not an own key of teamSnapshots, so isValidWorldCupTeamId's Object.hasOwn
    // check must keep it from resolving through the prototype chain into a
    // cacheable 200 that serializes a built-in.
    const actual = jest.requireActual(
      "@/lib/worldCupSnapshot"
    ) as typeof import("@/lib/worldCupSnapshot");
    mockIsWorldCupTeamIdShape.mockImplementation(actual.isWorldCupTeamIdShape);
    mockIsValidWorldCupTeamId.mockImplementation(actual.isValidWorldCupTeamId);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "constructor" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.team).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetWorldCupTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns the team snapshot with cache headers", async () => {
    mockIsWorldCupTeamIdShape.mockReturnValue(true);
    mockIsValidWorldCupTeamId.mockReturnValue(true);
    mockGetWorldCupTeamSnapshot.mockResolvedValue({
      team: {
        id: "mexico",
        name: "Mexico",
        code: "MEX",
        group: "A",
        crest: "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
      },
      standing: null,
      recentFixtures: [],
      upcomingFixtures: [],
      form: {
        sequence: ["W", "D", "W"],
        wins: 2,
        draws: 1,
        losses: 0,
        goalsFor: 5,
        goalsAgainst: 2,
      },
      generatedAt: "2026-07-06T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "mexico" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.team.name).toBe("Mexico");
    expect(body.form.sequence).toEqual(["W", "D", "W"]);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetWorldCupTeamSnapshot).toHaveBeenCalledWith("mexico");
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("logs and returns a stable empty payload when the team lookup fails", async () => {
    mockIsWorldCupTeamIdShape.mockReturnValue(true);
    mockIsValidWorldCupTeamId.mockReturnValue(true);
    mockGetWorldCupTeamSnapshot.mockRejectedValue(
      Object.assign(new Error("World Cup team snapshot is not available."), {
        status: 503,
      })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "mexico" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(body.recentFixtures).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      "World Cup team API error",
      expect.any(Error)
    );
  });
});
