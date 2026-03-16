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

  it("returns prefetched envelopes for seeded symbols", async () => {
    mockGetInvestmentContext.mockResolvedValue({
      source: "prefetched",
      capabilities: { info: true, news: true, compare: true },
      lastUpdated: "2026-03-16T08:00:00.000Z",
      seeded: true,
    });
    mockGetInvestmentDataEnvelope.mockResolvedValue({
      data: { shortName: "Apple" },
      source: "prefetched",
      capabilities: { info: true, news: true, compare: true },
      lastUpdated: "2026-03-16T08:00:00.000Z",
    });

    const response = await makeRequest("AAPL");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("prefetched");
    expect(body.capabilities.compare).toBe(true);
    expect(body.data.shortName).toBe("Apple");
  });

  it("returns on-demand envelopes for uncached valid symbols", async () => {
    mockGetInvestmentContext.mockResolvedValue({
      source: "on-demand",
      capabilities: {
        info: true,
        fundamentals: true,
        growth: true,
        compare: false,
      },
      lastUpdated: "2026-03-16T08:05:00.000Z",
      seeded: false,
      snapshot: {
        fetchedAt: "2026-03-16T08:05:00.000Z",
        capabilities: { info: true },
        sections: {},
      },
    });
    mockGetInvestmentDataEnvelope.mockResolvedValue({
      data: { shortName: "Shopify" },
      source: "on-demand",
      capabilities: {
        info: true,
        fundamentals: true,
        growth: true,
        compare: false,
      },
      lastUpdated: "2026-03-16T08:05:00.000Z",
    });

    const response = await makeRequest("SHOP");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("on-demand");
    expect(body.capabilities.compare).toBe(false);
    expect(body.data.shortName).toBe("Shopify");
  });

  it("rejects invalid ticker symbols", async () => {
    const response = await makeRequest("BAD SYMBOL");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid symbol/i);
    expect(mockGetInvestmentContext).not.toHaveBeenCalled();
  });

  it("returns a capability-aware 404 for unsupported on-demand sections", async () => {
    mockGetInvestmentContext.mockResolvedValue({
      source: "on-demand",
      capabilities: {
        info: true,
        fundamentals: true,
        industry: false,
        compare: false,
      },
      lastUpdated: "2026-03-16T08:05:00.000Z",
      seeded: false,
      snapshot: {
        fetchedAt: "2026-03-16T08:05:00.000Z",
        capabilities: { info: true },
        sections: {},
      },
    });
    mockGetInvestmentDataEnvelope.mockRejectedValue(
      Object.assign(
        new Error('Section "industry" is available for curated research symbols only.'),
        {
          status: 404,
          source: "on-demand",
          capabilities: {
            info: true,
            fundamentals: true,
            industry: false,
            compare: false,
          },
          lastUpdated: "2026-03-16T08:05:00.000Z",
        }
      )
    );

    const response = await makeRequest("SHOP", "industry");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.source).toBe("on-demand");
    expect(body.capabilities.industry).toBe(false);
    expect(body.error).toMatch(/curated research symbols only/i);
  });

  it("maps upstream Yahoo 429s to a temporary 503 response", async () => {
    mockGetInvestmentContext.mockResolvedValue({
      source: "on-demand",
      capabilities: {
        info: true,
        fundamentals: true,
        growth: true,
        compare: false,
      },
      lastUpdated: "2026-03-16T08:05:00.000Z",
      seeded: false,
      snapshot: {
        fetchedAt: "2026-03-16T08:05:00.000Z",
        capabilities: { info: true },
        sections: {},
      },
    });
    mockGetInvestmentDataEnvelope.mockRejectedValue(
      Object.assign(new Error("Rate limited"), {
        status: 429,
        source: "on-demand",
        capabilities: {
          info: true,
          fundamentals: true,
          growth: true,
          compare: false,
        },
        lastUpdated: "2026-03-16T08:05:00.000Z",
      })
    );

    const response = await makeRequest("SHOP");
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.source).toBe("on-demand");
    expect(body.error).toMatch(/temporarily rate-limited/i);
  });
});
