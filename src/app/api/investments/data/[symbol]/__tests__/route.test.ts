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

  it("returns a curated-universe 404 for valid non-curated symbols", async () => {
    mockGetInvestmentContext.mockRejectedValue(
      Object.assign(new Error("SHOP is not in the curated research universe."), {
        status: 404,
        source: "prefetched",
        capabilities: {},
        lastUpdated: null,
      })
    );

    const response = await makeRequest("SHOP");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.source).toBe("prefetched");
    expect(body.error).toMatch(/curated research universe/i);
  });

  it("returns a dataset-specific 503 when curated research data is unavailable", async () => {
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
    expect(body.source).toBe("prefetched");
    expect(body.error).toMatch(/curated investments dataset/i);
    expect(mockGetInvestmentContext).toHaveBeenCalledWith("AAPL", {
      assetOrigin: "http://localhost:3000",
    });
  });
});
