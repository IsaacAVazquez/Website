/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/investmentsData", () => ({
  getInvestmentContext: jest.fn(),
  getInvestmentDataEnvelope: jest.fn(),
}));

import { GET } from "../route";
import { getInvestmentContext, getInvestmentDataEnvelope } from "@/lib/investmentsData";

const mockGetInvestmentContext = getInvestmentContext as jest.MockedFunction<
  typeof getInvestmentContext
>;
const mockGetInvestmentDataEnvelope =
  getInvestmentDataEnvelope as jest.MockedFunction<typeof getInvestmentDataEnvelope>;

function makeRequest(symbol: string, section = "info") {
  return GET(
    new NextRequest(
      `http://localhost:3000/api/investments/data/${symbol}?section=${section}`
    ),
    { params: Promise.resolve({ symbol }) }
  );
}

describe("GET /api/investments/data/[symbol]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns prefetched envelopes for curated symbols", async () => {
    mockGetInvestmentContext.mockResolvedValue({
      source: "prefetched",
      capabilities: { info: true, news: true, compare: true },
      lastUpdated: "2026-03-16T08:00:00.000Z",
      seeded: true,
      snapshot: {
        symbol: "AAPL",
        source: "prefetched",
        capabilities: { info: true, news: true, compare: true },
        lastUpdated: "2026-03-16T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
          sections: {
            price: "2026-03-15",
          },
        },
        sections: { info: { shortName: "Apple" } },
      },
    });
    mockGetInvestmentDataEnvelope.mockResolvedValue({
      data: { shortName: "Apple" },
      source: "prefetched",
      capabilities: { info: true, news: true, compare: true },
      lastUpdated: "2026-03-16T08:00:00.000Z",
      freshness: {
        snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
        sections: {
          price: "2026-03-15",
        },
      },
    });

    const response = await makeRequest("AAPL");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("prefetched");
    expect(body.capabilities.compare).toBe(true);
    expect(body.data.shortName).toBe("Apple");
    expect(body.freshness).toEqual({
      snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
      sections: {
        price: "2026-03-15",
      },
    });
    expect(mockGetInvestmentContext).toHaveBeenCalledWith("AAPL", {
      assetOrigin: "http://localhost:3000",
    });
    expect(mockGetInvestmentDataEnvelope).toHaveBeenCalledWith(
      "AAPL",
      "info",
      expect.objectContaining({ source: "prefetched", seeded: true }),
      { assetOrigin: "http://localhost:3000" }
    );
  });

  it("rejects invalid ticker symbols", async () => {
    const response = await makeRequest("BAD SYMBOL");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid symbol/i);
    expect(mockGetInvestmentContext).not.toHaveBeenCalled();
  });

  it("rejects transcript sections now that the feature is removed", async () => {
    const response = await makeRequest("AAPL", "transcripts");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid section/i);
    expect(mockGetInvestmentContext).not.toHaveBeenCalled();
  });

  it("returns 404 for valid non-curated symbols and does not leak internal state", async () => {
    // ZZZZZ is well-formed but not in the curated allowlist (loaded from
    // public/data/investments/index.json). The route now rejects it before
    // doing any filesystem access, so the mocked downstream is never hit.
    const response = await makeRequest("ZZZZZ");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ error: "Symbol not found" });
    expect(mockGetInvestmentContext).not.toHaveBeenCalled();
  });

  it("returns a generic 503 without leaking internal source/capabilities when the dataset is unavailable", async () => {
    mockGetInvestmentContext.mockRejectedValue(
      Object.assign(new Error("Curated investments dataset is temporarily unavailable."), {
        status: 503,
        source: "prefetched",
        capabilities: {},
        lastUpdated: null,
      })
    );

    const response = await makeRequest("AAPL");
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ error: "Internal server error" });
    expect(body.source).toBeUndefined();
    expect(body.capabilities).toBeUndefined();
    expect(mockGetInvestmentContext).toHaveBeenCalledWith("AAPL", {
      assetOrigin: "http://localhost:3000",
    });
  });

  it("returns a trimmed 404 without leaking freshness metadata when a section is unavailable", async () => {
    // Hardening: the route no longer echoes internal freshness, source,
    // capabilities, or the upstream error message on failure responses.
    mockGetInvestmentContext.mockResolvedValue({
      source: "prefetched",
      capabilities: { info: true, compare: true },
      lastUpdated: "2026-03-16T08:00:00.000Z",
      seeded: true,
      snapshot: {
        symbol: "AAPL",
        source: "prefetched",
        capabilities: { info: true, compare: true },
        lastUpdated: "2026-03-16T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
          sections: {
            price: "2026-03-15",
          },
        },
        sections: { info: { shortName: "Apple" } },
      },
    });
    mockGetInvestmentDataEnvelope.mockRejectedValue(
      Object.assign(new Error('Section "news" not available for AAPL'), {
        status: 404,
        source: "prefetched",
        capabilities: { info: true, compare: true },
        lastUpdated: "2026-03-16T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
          sections: { price: "2026-03-15" },
        },
      })
    );

    const response = await makeRequest("AAPL", "news");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ error: "Symbol not found" });
    expect(body.freshness).toBeUndefined();
    expect(body.source).toBeUndefined();
  });
});
