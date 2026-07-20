/**
 * @jest-environment node
 */
jest.mock("@/lib/formula1Snapshot", () => ({
  createEmptyFormula1Summary: jest.fn(() => ({
    sourceLabel: "OpenF1 historical snapshot",
    sourceUrls: {
      docs: "https://openf1.org/docs/",
      apiBase: "https://openf1.org/",
      meetings: "https://api.openf1.org/v1/meetings",
      sessions: "https://api.openf1.org/v1/sessions",
      drivers: "https://api.openf1.org/v1/drivers",
      driverStandings: "https://api.openf1.org/v1/championship_drivers",
      constructorStandings: "https://api.openf1.org/v1/championship_teams",
    },
    season: 2026,
    generatedAt: "2026-04-15T00:00:00.000Z",
    defaultMeetingKey: null,
    standingsMeetingKey: null,
    meetings: [],
    driverStandings: [],
    constructorStandings: [],
    seasonMetrics: {
      season: 2026,
      totalRaces: 0,
      completedRaces: 0,
      upcomingRaces: 0,
      sprintWeekends: 0,
    },
    nextMeeting: null,
    lastCompletedMeeting: null,
  })),
  getFormula1Summary: jest.fn(),
}));

import { GET } from "../route";
import { getFormula1Summary } from "@/lib/formula1Snapshot";

const mockGetFormula1Summary = getFormula1Summary as jest.MockedFunction<
  typeof getFormula1Summary
>;

describe("GET /api/formula-1/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the Formula 1 summary with cache headers", async () => {
    mockGetFormula1Summary.mockResolvedValue({
      sourceLabel: "OpenF1 historical snapshot",
      sourceUrls: {
        docs: "https://openf1.org/docs/",
        apiBase: "https://openf1.org/",
        meetings: "https://api.openf1.org/v1/meetings?year=2026",
        sessions: "https://api.openf1.org/v1/sessions?year=2026",
        drivers: "https://api.openf1.org/v1/drivers?session_key=11253",
        driverStandings: "https://api.openf1.org/v1/championship_drivers?session_key=11253",
        constructorStandings: "https://api.openf1.org/v1/championship_teams?session_key=11253",
      },
      season: 2026,
      generatedAt: "2026-04-15T00:00:00.000Z",
      defaultMeetingKey: "1283",
      standingsMeetingKey: "1281",
      meetings: [],
      driverStandings: [],
      constructorStandings: [],
      seasonMetrics: {
        season: 2026,
        totalRaces: 24,
        completedRaces: 4,
        upcomingRaces: 20,
        sprintWeekends: 6,
      },
      nextMeeting: null,
      lastCompletedMeeting: null,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.season).toBe(2026);
    expect(body.defaultMeetingKey).toBe("1283");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
  });

  it("returns a stable empty payload when the summary lookup fails", async () => {
    mockGetFormula1Summary.mockRejectedValue(
      Object.assign(new Error("Formula 1 snapshot is not available."), {
        status: 503,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.meetings).toEqual([]);
    expect(body.driverStandings).toEqual([]);
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
