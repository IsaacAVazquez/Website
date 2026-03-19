/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { GET, HEAD } from "../route";

jest.mock("@/lib/fantasyPositionData", () => ({
  getFantasyPositionData: jest.fn((position: string, scoring: string) => {
    const data: Record<string, Record<string, any[]>> = {
      STANDARD: {
        QB: [
          {
            id: "std-qb-1",
            name: "Josh Allen",
            position: "QB",
            averageRank: 1.39,
            projectedPoints: 364,
            standardDeviation: 0.58,
            team: "BUF",
            tier: 1,
            expertRanks: [1, 2, 1],
          },
        ],
        RB: [],
        WR: [],
        TE: [],
        K: [],
        DST: [],
      },
      PPR: {
        QB: [],
        RB: [
          {
            id: "ppr-rb-1",
            name: "Christian McCaffrey",
            position: "RB",
            averageRank: 1,
            projectedPoints: 291,
            standardDeviation: 0.1,
            team: "SF",
            tier: 1,
            expertRanks: [1, 1, 1],
          },
        ],
        WR: [],
        TE: [],
        K: [],
        DST: [],
      },
      HALF_PPR: {
        QB: [],
        RB: [],
        WR: [
          {
            id: "half-wr-1",
            name: "CeeDee Lamb",
            position: "WR",
            averageRank: 4,
            projectedPoints: 248,
            standardDeviation: 0.8,
            team: "DAL",
            tier: 1,
            expertRanks: [4, 5, 4],
          },
        ],
        TE: [],
        K: [],
        DST: [],
      },
    };

    return data[scoring]?.[position] ?? [];
  }),
}));

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/sample-data");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url.toString());
}

describe("GET /api/sample-data", () => {
  it("returns success:true with pagination metadata", async () => {
    const res = await GET(makeRequest({ position: "QB", scoring: "standard" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toBeDefined();
    expect(typeof body.pagination.total).toBe("number");
    expect(typeof body.pagination.totalPages).toBe("number");
  });

  it("returns player data for a specific position and scoring format", async () => {
    const res = await GET(makeRequest({ position: "RB", scoring: "ppr" }));
    const body = await res.json();

    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].position).toBe("RB");
    expect(body.metadata.scoringFormat).toBe("PPR");
  });

  it("returns all-positions data when no position is specified", async () => {
    const res = await GET(makeRequest({ scoring: "half_ppr" }));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.metadata.position).toBe("all");
    expect(body.metadata.scoringFormat).toBe("HALF_PPR");
  });

  it("applies pagination correctly", async () => {
    const res = await GET(makeRequest({ position: "QB", scoring: "standard", page: "1", limit: "1" }));
    const body = await res.json();

    expect(body.data.length).toBeLessThanOrEqual(1);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(1);
  });

  it("returns empty data array for a position with no players in that scoring format", async () => {
    const res = await GET(makeRequest({ position: "WR", scoring: "ppr" }));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it("includes metadata with position, scoring, and cache fields", async () => {
    const res = await GET(makeRequest({ position: "QB", scoring: "standard" }));
    const body = await res.json();

    expect(body.metadata).toBeDefined();
    expect(body.metadata.position).toBe("QB");
    expect(body.metadata.scoringFormat).toBe("STANDARD");
    expect(body.metadata.cached).toBe(true);
  });
});

describe("HEAD /api/sample-data", () => {
  it("returns 200 with Cache-Control header", async () => {
    const res = await HEAD(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("max-age=3600");
  });

  it("returns Last-Modified header", async () => {
    const res = await HEAD(makeRequest());
    expect(res.headers.get("Last-Modified")).toBeTruthy();
  });
});
