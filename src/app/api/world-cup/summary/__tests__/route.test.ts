/**
 * @jest-environment node
 */
jest.mock("@/lib/worldCupSnapshot", () => ({
  createEmptyWorldCupSummarySnapshot: jest.fn(() => ({
    tournament: null,
    groups: [],
    knockout: [],
    recentFixtures: [],
    upcomingFixtures: [],
    scorers: [],
    teamOptions: [],
  })),
  getWorldCupSummarySnapshot: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { GET } from "../route";
import { getWorldCupSummarySnapshot } from "@/lib/worldCupSnapshot";
import { logger } from "@/lib/logger";

const mockGetWorldCupSummarySnapshot =
  getWorldCupSummarySnapshot as jest.MockedFunction<
    typeof getWorldCupSummarySnapshot
  >;
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>;

describe("GET /api/world-cup/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the world cup summary with cache headers", async () => {
    mockGetWorldCupSummarySnapshot.mockResolvedValue({
      tournament: {
        name: "2026 FIFA World Cup",
        season: "2026",
        hosts: ["Mexico", "United States", "Canada"],
        startDate: "2026-06-11",
        endDate: "2026-07-19",
        phase: "Knockout stage",
        status: "The knockout bracket is underway.",
        format: "48 teams across 12 groups of four.",
        teamCount: 48,
        groupCount: 12,
        matchCount: 104,
        venues: [],
        generatedAt: "2026-07-06T20:35:02.501Z",
      },
      groups: [],
      knockout: [],
      recentFixtures: [],
      upcomingFixtures: [],
      scorers: [
        {
          rank: 1,
          name: "Kylian Mbappe",
          teamId: "france",
          teamCode: "FRA",
          goals: 6,
          assists: 2,
          penalties: 1,
        },
      ],
      teamOptions: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tournament.name).toBe("2026 FIFA World Cup");
    expect(body.tournament.phase).toBe("Knockout stage");
    expect(body.scorers[0].name).toBe("Kylian Mbappe");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("returns the empty fallback without logging for a sub-500 failure", async () => {
    mockGetWorldCupSummarySnapshot.mockRejectedValue(
      Object.assign(new Error("Unknown World Cup feed."), {
        status: 404,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Unknown World Cup feed.");
    expect(body.groups).toEqual([]);
    expect(body.scorers).toEqual([]);
    expect(body.teamOptions).toEqual([]);
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    // 4xx is a client/expected failure — do not page the logger.
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("logs and returns the empty fallback for a 5xx failure", async () => {
    mockGetWorldCupSummarySnapshot.mockRejectedValue(
      Object.assign(new Error("World Cup snapshot is not available."), {
        status: 503,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.groups).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      "World Cup summary API error",
      expect.any(Error)
    );
  });

  it("defaults to a logged 500 when the thrown error has no status", async () => {
    mockGetWorldCupSummarySnapshot.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("boom");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});
