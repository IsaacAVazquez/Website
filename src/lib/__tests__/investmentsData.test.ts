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

describe("investmentsData curated index resolution", () => {
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
  });

  it("loads curated symbols from public assets when the filesystem copy is unavailable", async () => {
    mockReadFile.mockRejectedValueOnce(makeEnoent());
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        symbols: ["AAPL", "MSFT"],
        failed: [],
        lastUpdated: "2026-03-16T08:00:00.000Z",
      }),
    });

    const { getInvestmentsIndex } =
      jest.requireActual("../investmentsData") as typeof import("../investmentsData");

    const index = await getInvestmentsIndex({ assetOrigin: "https://isaacvazquez.com" });

    expect(index.symbols).toEqual(["AAPL", "MSFT"]);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://isaacvazquez.com/data/investments/index.json",
      { cache: "force-cache" }
    );
  });

  it("throws an explicit prefetched-dataset 503 when the curated index cannot be resolved", async () => {
    mockReadFile.mockRejectedValue(makeEnoent());
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { getInvestmentsIndex } =
      jest.requireActual("../investmentsData") as typeof import("../investmentsData");

    await expect(
      getInvestmentsIndex({ assetOrigin: "https://isaacvazquez.com" })
    ).rejects.toMatchObject({
      status: 503,
      source: "prefetched",
    });
  });
});
