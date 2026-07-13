/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";

jest.mock("@/lib/rateLimit", () => ({
  fantasyRateLimiter: {
    check: jest.fn().mockReturnValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    }),
  },
  getClientIdentifier: jest.fn().mockReturnValue("test-client"),
  rateLimitResponse: jest.fn((result) =>
    NextResponse.json({ success: false, rateLimited: true, result }, { status: 429 })
  ),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/lib/fantasySnapshotServer", () => ({
  loadFantasySnapshot: jest.fn(),
}));

import { fantasyRateLimiter, rateLimitResponse } from "@/lib/rateLimit";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";
import { normalizeFantasySnapshot } from "@/lib/fantasy";
import { loadFantasySnapshot } from "@/lib/fantasySnapshotServer";
import { GET } from "../route";

const mockRateLimiter = fantasyRateLimiter as jest.Mocked<typeof fantasyRateLimiter>;
const mockRateLimitResponse = rateLimitResponse as jest.MockedFunction<typeof rateLimitResponse>;
const mockLoadFantasySnapshot = loadFantasySnapshot as jest.MockedFunction<typeof loadFantasySnapshot>;

const legacyPprSnapshot = {
  season: 2026,
  week: 0,
  generatedAt: "2026-03-18T00:00:00.000Z",
  scoringFormat: "PPR",
  source: "legacy snapshot",
  positions: {},
  overall: [
    {
      id: "legacy-rb",
      name: "Saquon Barkley",
      team: "PHI",
      position: "RB",
      averageRank: 1,
      standardDeviation: 1.4,
      lastUpdated: "2026-04-15T15:29:20.000Z",
    },
  ],
};

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/fantasy-data");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url.toString());
}

describe("GET /api/fantasy-data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimiter.check.mockReturnValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    });
    mockLoadFantasySnapshot.mockImplementation(async (scoring) => {
      switch (scoring) {
        case "ppr":
          return normalizeFantasySnapshot(legacyPprSnapshot, "ppr");
        case "half_ppr":
          return buildFantasySnapshot("half_ppr");
        case "standard":
        default:
          return buildFantasySnapshot("standard");
      }
    });
  });

  it("returns snapshot-backed players for a valid position slice", async () => {
    const response = await GET(makeRequest({ position: "rb", scoring: "standard" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.players.length).toBeGreaterThan(20);
    expect(body.metadata.position).toBe("rb");
    expect(body.metadata.scoringFormat).toBe("STANDARD");
    expect(body.metadata.slice.available).toBe(true);
    expect(body.metadata.slice.rangeKind).toBe("position");
    expect(body.metadata.upstreamUpdatedAt).toMatch(/^20\d{2}-/);
    expect(response.headers.get("Netlify-Vary")).toBe("query");
  });

  it("returns unavailable metadata instead of overall fallback data for an overall-only legacy ppr slice", async () => {
    const response = await GET(makeRequest({ position: "rb", scoring: "ppr" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.players.length).toBe(0);
    expect(body.metadata.position).toBe("rb");
    expect(body.metadata.scoringFormat).toBe("PPR");
    expect(body.metadata.slice.available).toBe(false);
    expect(body.metadata.slice.sourceKind).toBe("unavailable");
    expect(body.metadata.slice.reason).toMatch(/unavailable/i);
  });

  it("normalizes scoring aliases and upper-case positions", async () => {
    const response = await GET(makeRequest({ position: "QB", scoring: "HALF" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.position).toBe("qb");
    expect(body.metadata.scoringFormat).toBe("HALF_PPR");
    expect(body.metadata.slice.available).toBe(true);
    expect(body.metadata.slice.sourceKind).toBe("shared_position_consensus");
  });

  it.each([
    ["scoring", { scoring: "" }],
    ["position", { position: "" }],
    ["all", { all: "" }],
  ])("treats an empty %s parameter as absent and serves defaults", async (_parameter, params) => {
    const response = await GET(makeRequest(params));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.players).toBeDefined();
    expect(body.metadata.position).toBe("overall");
    expect(body.metadata.scoringFormat).toBe("PPR");
  });

  it.each([
    [{ scoring: "points-per-reception" }, "scoring"],
    [{ position: "defense" }, "position"],
    [{ all: "yes" }, "all"],
  ])("rejects invalid query values without caching them", async (params, parameter) => {
    const response = await GET(makeRequest(params));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Netlify-Vary")).toBeNull();
    expect(body.error).toContain(parameter);
    expect(mockLoadFantasySnapshot).not.toHaveBeenCalled();
  });

  it("returns the full snapshot when all=true", async () => {
    const response = await GET(makeRequest({ all: "true", scoring: "standard" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.overall.length).toBeGreaterThan(100);
    expect(body.data.positions.FLEX.length).toBeGreaterThan(100);
    expect(body.metadata.position).toBe("all");
    expect(body.metadata.scoringFormat).toBe("STANDARD");
    expect(body.metadata.upstreamUpdatedAt).toMatch(/^20\d{2}-/);
    expect(body.metadata.slice).toBeNull();
    expect(body.metadata.slices.overall.sourceKind).toBe("overall_consensus");
    expect(body.metadata.slices.dst.available).toBe(true);
    expect(body.data.overall.every((player: Record<string, unknown>) => !("projectedPoints" in player))).toBe(true);
    expect(body.data.overall.every((player: Record<string, unknown>) => !("expertRanks" in player))).toBe(true);
  });

  it("uses the rate limit response when the request is limited", async () => {
    mockRateLimiter.check.mockReturnValueOnce({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await GET(makeRequest({ position: "qb" }));

    expect(mockRateLimitResponse).toHaveBeenCalled();
    expect(response.status).toBe(429);
  });
});
