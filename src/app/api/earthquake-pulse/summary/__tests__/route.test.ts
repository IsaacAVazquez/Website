/**
 * @jest-environment node
 */
jest.mock("@/lib/earthquakeSnapshot", () => ({
  createEmptyEarthquakeSummary: jest.fn(() => ({
    generatedAt: "2026-07-06T00:00:00.000Z",
    feedUpdated: null,
    heroStats: {
      total24h: 0,
      total7d: 0,
      felt24h: 0,
      strongest24hMag: null,
      strongest24hPlace: null,
      significant30d: 0,
      largest7dMag: null,
      tsunamiAlerts7d: 0,
      deepestKm: null,
    },
    recent: [],
    significant: [],
    magnitudeBuckets: [],
    regions: [],
    quakeDetails: {},
  })),
  getEarthquakeSummary: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { GET } from "../route";
import { getEarthquakeSummary } from "@/lib/earthquakeSnapshot";
import { logger } from "@/lib/logger";

const mockGetEarthquakeSummary = getEarthquakeSummary as jest.MockedFunction<
  typeof getEarthquakeSummary
>;
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>;

describe("GET /api/earthquake-pulse/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the earthquake summary with cache headers", async () => {
    mockGetEarthquakeSummary.mockResolvedValue({
      generatedAt: "2026-07-06T12:00:00.000Z",
      feedUpdated: "2026-07-06T11:55:00.000Z",
      heroStats: {
        total24h: 42,
        total7d: 310,
        felt24h: 3,
        strongest24hMag: 5.4,
        strongest24hPlace: "off the coast of Chile",
        significant30d: 7,
        largest7dMag: 6.1,
        tsunamiAlerts7d: 0,
        deepestKm: 612,
      },
      recent: [],
      significant: [],
      magnitudeBuckets: [],
      regions: [],
      quakeDetails: {},
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.heroStats.strongest24hPlace).toBe("off the coast of Chile");
    expect(body.heroStats.total24h).toBe(42);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=60, stale-while-revalidate=300"
    );
    expect(response.headers.get("X-Data-Revision")).toMatch(/^[a-f0-9]{64}$/);
    expect(response.headers.get("X-Data-Source")).toBe(
      "usgs-runtime-with-snapshot-fallback"
    );
    expect(mockGetEarthquakeSummary).toHaveBeenCalledWith({ preferLive: true });
    expect(response.headers.get("Last-Modified")).toBe(
      "Mon, 06 Jul 2026 12:00:00 GMT"
    );
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("returns the empty fallback without logging for a sub-500 failure", async () => {
    mockGetEarthquakeSummary.mockRejectedValue(
      Object.assign(new Error("Unknown earthquake feed."), {
        status: 404,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Unknown earthquake feed.");
    expect(body.recent).toEqual([]);
    expect(body.significant).toEqual([]);
    expect(body.quakeDetails).toEqual({});
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    // 4xx is a client/expected failure — do not page the logger.
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("logs and returns the empty fallback for a 5xx failure", async () => {
    mockGetEarthquakeSummary.mockRejectedValue(
      Object.assign(new Error("Earthquake snapshot is not available."), {
        status: 503,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.recent).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Earthquake summary API error",
      expect.any(Error)
    );
  });

  it("defaults to a logged 500 when the thrown error has no status", async () => {
    mockGetEarthquakeSummary.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("boom");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});
