/**
 * @jest-environment node
 */

const mockReadFile = jest.fn();
const mockYahooFetch = jest.fn();
const mockFetch = jest.fn();

jest.mock("fs", () => ({
  promises: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
  },
}));

jest.mock("@/lib/yahooFinance", () => ({
  yahooFetch: (...args: unknown[]) => mockYahooFetch(...args),
}));

function makeEnoent() {
  return Object.assign(new Error("ENOENT"), { code: "ENOENT" });
}

describe("investmentsData prefetched dataset resolution", () => {
  beforeEach(() => {
    jest.resetModules();
    mockReadFile.mockReset();
    mockYahooFetch.mockReset();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    delete process.env.URL;
    delete process.env.DEPLOY_PRIME_URL;
    delete process.env.DEPLOY_URL;
    delete process.env.SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  it("loads curated symbols from public assets when the filesystem copy is unavailable", async () => {
    mockReadFile.mockRejectedValue(makeEnoent());
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        symbols: ["AAPL", "MSFT"],
        failed: [],
        lastUpdated: "2026-03-16T08:00:00.000Z",
      }),
    });

    const { getInvestmentContext } =
      jest.requireActual("../investmentsData") as typeof import("../investmentsData");

    const context = await getInvestmentContext("AAPL", {
      assetOrigin: "https://isaacavazquez.com",
    });

    expect(context.source).toBe("prefetched");
    expect(context.seeded).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://isaacavazquez.com/data/investments/index.json",
      { cache: "force-cache" }
    );
    expect(mockYahooFetch).not.toHaveBeenCalled();
  });

  it("throws an explicit prefetched-dataset 503 when the curated index cannot be resolved", async () => {
    mockReadFile.mockRejectedValue(makeEnoent());
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { getInvestmentContext } =
      jest.requireActual("../investmentsData") as typeof import("../investmentsData");

    await expect(
      getInvestmentContext("AAPL", { assetOrigin: "https://isaacavazquez.com" })
    ).rejects.toMatchObject({
      status: 503,
      source: "prefetched",
    });
    expect(mockYahooFetch).not.toHaveBeenCalled();
  });

  it("still uses the on-demand snapshot path for valid uncached symbols after the index loads", async () => {
    mockReadFile.mockRejectedValue(makeEnoent());
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        symbols: ["AAPL", "MSFT"],
        failed: [],
        lastUpdated: "2026-03-16T08:00:00.000Z",
      }),
    });
    mockYahooFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          quoteSummary: {
            result: [
              {
                price: {
                  shortName: "Shopify",
                  longName: "Shopify Inc.",
                  regularMarketPrice: 90,
                  marketCap: 1000000000,
                },
                summaryDetail: {
                  regularMarketPrice: 90,
                  trailingPE: 25,
                },
                defaultKeyStatistics: {
                  trailingEps: 3.5,
                  marketCap: 1000000000,
                  beta: 1.2,
                  priceToSalesTrailing12Months: 5,
                  priceToBook: 7,
                  pegRatio: 1.5,
                },
                financialData: {
                  returnOnEquity: 0.12,
                  returnOnAssets: 0.08,
                  returnOnCapital: 0.1,
                  grossMargins: 0.6,
                  operatingMargins: 0.2,
                  profitMargins: 0.15,
                  ebitdaMargins: 0.22,
                },
                assetProfile: {
                  sector: "Technology",
                  industry: "Software",
                },
                earnings: {
                  earningsChart: {
                    quarterly: [],
                  },
                },
                incomeStatementHistoryQuarterly: {
                  incomeStatementHistory: [],
                },
                incomeStatementHistory: {
                  incomeStatementHistory: [],
                },
                balanceSheetHistoryQuarterly: {
                  balanceSheetStatements: [],
                },
                balanceSheetHistory: {
                  balanceSheetStatements: [],
                },
                cashflowStatementHistoryQuarterly: {
                  cashflowStatements: [],
                },
                cashflowStatementHistory: {
                  cashflowStatements: [],
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          chart: {
            result: [
              {
                timestamp: [1710000000, 1710086400],
                indicators: {
                  quote: [
                    {
                      open: [89, 90],
                      high: [91, 92],
                      low: [88, 89],
                      close: [90, 91],
                      volume: [1000, 1100],
                    },
                  ],
                },
              },
            ],
          },
        }),
      });

    const { getInvestmentContext } =
      jest.requireActual("../investmentsData") as typeof import("../investmentsData");

    const context = await getInvestmentContext("SHOP", {
      assetOrigin: "https://isaacavazquez.com",
    });

    expect(context.source).toBe("on-demand");
    expect(context.seeded).toBe(false);
    expect(context.snapshot).toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockYahooFetch).toHaveBeenCalledTimes(2);
  });
});
