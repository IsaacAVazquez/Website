/**
 * @jest-environment node
 */
jest.mock("@/lib/laLigaSnapshot", () => ({
  createEmptyLaLigaSummarySnapshot: jest.fn(() => ({
    season: "2025/26",
    matchday: 0,
    updatedAt: "2026-04-03T00:00:00.000Z",
    sourceLabel: "Football-Data.org",
    sourceUrls: { standings: "", scorers: "", assists: "" },
    clubs: [],
    scorers: [],
    assists: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
  })),
  getLaLigaSummarySnapshot: jest.fn(),
}));

import { GET } from "../route";
import { getLaLigaSummarySnapshot } from "@/lib/laLigaSnapshot";

const mockGetLaLigaSummarySnapshot = getLaLigaSummarySnapshot as jest.MockedFunction<
  typeof getLaLigaSummarySnapshot
>;

describe("GET /api/la-liga/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the normalized La Liga summary with cache headers", async () => {
    mockGetLaLigaSummarySnapshot.mockResolvedValue({
      season: "2025/26",
      matchday: 30,
      updatedAt: "2026-04-03T00:00:00.000Z",
      sourceLabel: "Football-Data.org",
      sourceUrls: { standings: "standings", scorers: "scorers", assists: "assists" },
      clubs: [
        {
          id: "86",
          code: "RMA",
          name: "Real Madrid CF",
          shortName: "Real Madrid",
          position: 1,
          points: 72,
          played: 30,
          won: 22,
          drawn: 6,
          lost: 2,
          goalsFor: 68,
          goalsAgainst: 24,
          goalDifference: 44,
        },
      ],
      scorers: [],
      assists: [],
      recentFixtures: [],
      upcomingFixtures: [],
      teams: [
        {
          id: "86",
          name: "Real Madrid CF",
          shortName: "Real Madrid",
          tla: "RMA",
          crest: null,
          venue: "Santiago Bernabeu",
        },
      ],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.clubs[0].shortName).toBe("Real Madrid");
    expect(body.matchday).toBe(30);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
  });

  it("returns a stable empty payload when the snapshot is unavailable", async () => {
    mockGetLaLigaSummarySnapshot.mockRejectedValue(
      Object.assign(new Error("La Liga summary is not available."), { status: 503 })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not available/i);
    expect(body.clubs).toEqual([]);
    expect(body.teams).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
