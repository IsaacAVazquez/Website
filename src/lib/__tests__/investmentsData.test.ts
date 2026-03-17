/**
 * @jest-environment node
 */

const mockReadFile = jest.fn();
const mockFetch = jest.fn();

jest.mock("fs", () => ({
  promises: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
  },
}));

function makeEnoent() {
  return Object.assign(new Error("ENOENT"), { code: "ENOENT" });
}

describe("investmentsData curated snapshot resolution", () => {
  beforeEach(() => {
    jest.resetModules();
    mockReadFile.mockReset();
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
    mockReadFile
      .mockRejectedValueOnce(makeEnoent())
      .mockRejectedValueOnce(makeEnoent());
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          symbols: ["AAPL", "MSFT"],
          failed: [],
          lastUpdated: "2026-03-16T08:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          symbol: "AAPL",
          source: "prefetched",
          lastUpdated: "2026-03-16T08:00:00.000Z",
          capabilities: { info: true },
          sections: { info: { shortName: "Apple" } },
        }),
      });

    const { getInvestmentContext } =
      jest.requireActual("../investmentsData") as typeof import("../investmentsData");

    const context = await getInvestmentContext("AAPL", {
      assetOrigin: "https://isaacavazquez.com",
    });

    expect(context.source).toBe("prefetched");
    expect(context.seeded).toBe(true);
    expect(context.snapshot.sections.info).toEqual({ shortName: "Apple" });
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://isaacavazquez.com/data/investments/index.json",
      { cache: "force-cache" }
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://isaacavazquez.com/data/investments/AAPL/snapshot.json",
      { cache: "force-cache" }
    );
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
  });

  it("returns a curated-universe 404 for valid symbols outside the static index", async () => {
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

    await expect(
      getInvestmentContext("SHOP", { assetOrigin: "https://isaacavazquez.com" })
    ).rejects.toMatchObject({
      status: 404,
      source: "prefetched",
    });
  });
});
