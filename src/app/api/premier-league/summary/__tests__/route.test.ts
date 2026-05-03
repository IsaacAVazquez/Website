/**
 * @jest-environment node
 */
jest.mock("@/lib/premierLeagueSnapshot", () => ({
  createEmptyPremierLeagueSummary: jest.fn(() => ({
    competition: null,
    standings: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
    generatedAt: "2026-04-03T00:00:00.000Z",
  })),
  getPremierLeagueSummary: jest.fn(),
}));

import { GET } from "../route";
import { getPremierLeagueSummary } from "@/lib/premierLeagueSnapshot";

const mockGetPremierLeagueSummary = getPremierLeagueSummary as jest.MockedFunction<
  typeof getPremierLeagueSummary
>;

describe("GET /api/premier-league/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the normalized Premier League summary with cache headers", async () => {
    mockGetPremierLeagueSummary.mockResolvedValue({
      competition: {
        code: "PL",
        name: "Premier League",
        areaName: "England",
        emblem: null,
        seasonLabel: "2025/26",
        currentMatchday: 31,
        winner: null,
      },
      standings: [],
      recentFixtures: [],
      upcomingFixtures: [],
      teams: [],
      generatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.competition.name).toBe("Premier League");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
  });

  it("returns a stable empty payload when the snapshot is unavailable", async () => {
    mockGetPremierLeagueSummary.mockRejectedValue(
      Object.assign(new Error("Premier League snapshot is not available."), {
        status: 503,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not available/i);
    expect(body.standings).toEqual([]);
    expect(body.teams).toEqual([]);
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
