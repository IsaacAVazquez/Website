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
      "public, max-age=30, stale-while-revalidate=120"
    );
    expect(response.headers.get("X-Data-Revision")).toMatch(/^[a-f0-9]{64}$/);
    expect(response.headers.get("X-Data-Source")).toBe(
      "bart-runtime-with-snapshot-fallback"
    );
    expect(mockGetTransitSummary).toHaveBeenCalledWith({ preferLive: true });
  });

  it.each([
    [
      "stale-fallback",
      "every section came from the committed snapshot",
      "stale-fallback",
      "stale-fallback",
    ],
    ["degraded", "one feed fell back", "fresh", "stale-fallback"],
    ["fresh", "every feed answered", "fresh", "fresh"],
  ] as const)(
    "reports %s when %s",
    async (expected, _when, advisories, departures) => {
      mockGetTransitSummary.mockResolvedValue({
        system: {
          name: "Bay Area Rapid Transit",
          abbr: "BART",
          source: "BART public API (api.bart.gov)",
          feedTime: "09/27/2026 12:03:47 PM PDT",
          // Inside the freshness window, so age alone would read as fresh.
          generatedAt: new Date().toISOString(),
          seed: false,
        },
        heroStats: {
          lineCount: 6,
          stationCount: 50,
          activeAdvisories: 2,
          elevatorOutages: 1,
          trainsTracked: 460,
        },
        lines: [],
        stations: [],
        advisories: [],
        elevator: [],
        sectionStatus: { advisories, elevator: advisories, departures },
        defaultStation: "embr",
      });

      const response = await GET();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Data-Status")).toBe(expected);
    }
  );

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
