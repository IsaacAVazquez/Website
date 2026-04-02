/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/yahooFinance", () => {
  const actual = jest.requireActual("@/lib/yahooFinance");
  return {
    ...actual,
    yahooFetch: jest.fn(),
  };
});

import { GET } from "../route";
import { yahooFetch } from "@/lib/yahooFinance";

const mockYahooFetch = yahooFetch as jest.MockedFunction<typeof yahooFetch>;

describe("GET /api/investments/quotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns friendly placeholder errors when live quote fetches fail", async () => {
    mockYahooFetch.mockRejectedValueOnce(new Error("network down"));

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.allFailed).toBe(true);
    expect(body.rateLimited).toBe(false);
    expect(body.quotes[0].symbol).toBe("AAPL");
    expect(body.quotes[0].error).toMatch(/temporarily unavailable/i);
  });

  it("surfaces rate-limited responses without failing the route", async () => {
    mockYahooFetch.mockResolvedValueOnce(
      new Response("rate limited", { status: 429 })
    );

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.allFailed).toBe(true);
    expect(body.rateLimited).toBe(true);
    expect(body.quotes[0].error).toMatch(/few minutes/i);
  });

  it("returns partial success when one symbol fails and another succeeds", async () => {
    mockYahooFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            chart: {
              result: [
                {
                  meta: {
                    regularMarketPrice: 203.1,
                    previousClose: 201,
                    regularMarketDayHigh: 204,
                    regularMarketDayLow: 200.5,
                    regularMarketOpen: 201.5,
                    regularMarketVolume: 1000000,
                    shortName: "Apple Inc.",
                  },
                },
              ],
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      )
      .mockRejectedValueOnce(new Error("network down"));

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL,MSFT")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.allFailed).toBe(false);
    expect(body.rateLimited).toBe(false);
    expect(body.quotes).toHaveLength(2);
    expect(body.quotes[0].symbol).toBe("AAPL");
    expect(body.quotes[0].error).toBeUndefined();
    expect(body.quotes[1].symbol).toBe("MSFT");
    expect(body.quotes[1].error).toMatch(/temporarily unavailable/i);
  });
});
