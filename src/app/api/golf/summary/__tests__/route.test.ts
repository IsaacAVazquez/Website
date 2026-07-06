/**
 * @jest-environment node
 */
jest.mock("@/lib/golfSnapshot", () => ({
  createEmptyGolfSummary: jest.fn(() => ({
    tournament: null,
    heroStats: {
      leaderName: null,
      leaderScore: null,
      playersUnderPar: 0,
      cutLine: null,
      fieldSize: 0,
    },
    leaderboard: [],
    players: [],
  })),
  getGolfSummary: jest.fn(),
}));

import { GET } from "../route";
import { getGolfSummary } from "@/lib/golfSnapshot";

const mockGetGolfSummary = getGolfSummary as jest.MockedFunction<typeof getGolfSummary>;

describe("GET /api/golf/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the golf summary with cache headers", async () => {
    mockGetGolfSummary.mockResolvedValue({
      tournament: {
        id: "harbour-town-classic-2026",
        name: "Harbour Town Classic",
        tour: "PGA Tour",
        course: "Harbour Town Golf Links",
        coursePar: 71,
        location: "Hilton Head Island, South Carolina",
        startDate: "2026-04-16",
        endDate: "2026-04-19",
        roundLabel: "Round 2 complete",
        status: "Cut line is set and Saturday pairings are next.",
        fieldSize: 132,
        cutLine: -1,
        cutState: "made",
        cutCount: 76,
        generatedAt: "2026-04-16T19:05:00.000Z",
      },
      heroStats: {
        leaderName: "Scottie Scheffler",
        leaderScore: -8,
        playersUnderPar: 14,
        cutLine: -1,
        cutState: "made",
        cutCount: 76,
        fieldSize: 132,
      },
      leaderboard: [],
      players: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tournament.name).toBe("Harbour Town Classic");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
  });

  it("returns a stable empty payload when the summary lookup fails", async () => {
    mockGetGolfSummary.mockRejectedValue(
      Object.assign(new Error("Golf snapshot is not available."), {
        status: 503,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.leaderboard).toEqual([]);
    expect(body.players).toEqual([]);
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
