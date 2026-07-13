/**
 * @jest-environment node
 */
jest.mock("@/lib/bayAreaTransitSnapshot", () => ({
  createEmptyTransitSummary: jest.fn(() => ({
    system: null,
    heroStats: {
      lineCount: 0,
      stationCount: 0,
      activeAdvisories: 0,
      elevatorOutages: 0,
      trainsTracked: 0,
    },
    lines: [],
    stations: [],
    advisories: [],
    elevator: [],
    defaultStation: null,
  })),
  getTransitSummary: jest.fn(),
}));

import { GET } from "../route";
import { getTransitSummary } from "@/lib/bayAreaTransitSnapshot";

const mockGetTransitSummary = getTransitSummary as jest.MockedFunction<typeof getTransitSummary>;

describe("GET /api/bay-area-transit/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the transit summary with cache headers", async () => {
    mockGetTransitSummary.mockResolvedValue({
      system: {
        name: "Bay Area Rapid Transit",
        abbr: "BART",
        source: "BART API",
        feedTime: "2026-04-03T12:00:00.000Z",
        generatedAt: "2026-04-03T12:00:05.000Z",
        seed: false,
      },
      heroStats: {
        lineCount: 6,
        stationCount: 50,
        activeAdvisories: 1,
        elevatorOutages: 2,
        trainsTracked: 42,
      },
      lines: [],
      stations: [],
      advisories: [],
      elevator: [],
      defaultStation: "embr",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.system.abbr).toBe("BART");
    expect(body.heroStats.stationCount).toBe(50);
    expect(body.defaultStation).toBe("embr");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(response.headers.get("X-Data-Revision")).toMatch(/^[a-f0-9]{64}$/);
    expect(response.headers.get("X-Data-Source")).toBe("git-snapshot");
  });

  it("returns a stable empty payload when the summary lookup fails", async () => {
    mockGetTransitSummary.mockRejectedValue(
      Object.assign(new Error("Transit snapshot is not available."), {
        status: 503,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.system).toBeNull();
    expect(body.lines).toEqual([]);
    expect(body.stations).toEqual([]);
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
