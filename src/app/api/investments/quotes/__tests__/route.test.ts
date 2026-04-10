/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/finnhub", () => {
  const actual = jest.requireActual("@/lib/finnhub");
  return {
    ...actual,
    fetchFinnhubQuote: jest.fn(),
  };
});

import { GET } from "../route";
import { fetchFinnhubQuote } from "@/lib/finnhub";

const mockFetchFinnhubQuote = fetchFinnhubQuote as jest.MockedFunction<typeof fetchFinnhubQuote>;

const errorQuote = (symbol: string, error: string) => ({
  symbol,
  price: 0,
  change: 0,
  changePercent: 0,
  dayHigh: 0,
  dayLow: 0,
  open: 0,
  previousClose: 0,
  volume: 0,
  marketCap: 0,
  name: symbol,
  error,
});

describe("GET /api/investments/quotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns friendly placeholder errors when live quote fetches fail", async () => {
    mockFetchFinnhubQuote.mockResolvedValueOnce(
      errorQuote("AAPL", "Live price is temporarily unavailable. Showing the latest saved data instead.")
    );

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
    mockFetchFinnhubQuote.mockResolvedValueOnce(
      errorQuote("AAPL", "Live price is temporarily unavailable right now. Try again in a few minutes.")
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
    mockFetchFinnhubQuote
      .mockResolvedValueOnce({
        symbol: "AAPL",
        price: 203.1,
        change: 2.1,
        changePercent: 1.05,
        dayHigh: 204,
        dayLow: 200.5,
        open: 201.5,
        previousClose: 201,
        volume: 0,
        marketCap: 0,
        name: "AAPL",
      })
      .mockResolvedValueOnce(
        errorQuote("MSFT", "Live price is temporarily unavailable. Showing the latest saved data instead.")
      );

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
