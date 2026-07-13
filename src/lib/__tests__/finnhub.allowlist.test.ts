/**
 * @jest-environment node
 *
 * Regression coverage for the curated-symbol allowlist that gates the Finnhub
 * quote proxies. The bug this guards against: inside the deployed Netlify
 * function, public/data/investments/index.json is stripped from the bundle, so
 * the old readFileSync-only loader failed closed and every symbol was rejected
 * as "not eligible for live pricing" — even with a valid Finnhub key. The
 * allowlist must fall back to the committed public asset over HTTP.
 */
jest.mock("fs", () => ({ readFileSync: jest.fn() }));

import { readFileSync } from "fs";
import {
  FinnhubAllowlistUnavailableError,
  getAllowedSymbols,
  isAllowedSymbol,
  __resetAllowlistCacheForTests,
} from "@/lib/finnhub";

const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const realFetch = global.fetch;

function enoent(): NodeJS.ErrnoException {
  return Object.assign(new Error("ENOENT: no such file or directory"), {
    code: "ENOENT",
  });
}

function mockPublicAsset(symbols: string[]) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ symbols }),
  }) as unknown as typeof fetch;
}

describe("finnhub allowlist resolution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetAllowlistCacheForTests();
    delete process.env.URL;
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it("uses the local file when present and never hits the network", async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ symbols: ["AAPL", "MSFT"] }));
    global.fetch = jest.fn() as unknown as typeof fetch;

    const allowlist = await getAllowedSymbols();

    expect(allowlist.has("AAPL")).toBe(true);
    expect(await isAllowedSymbol("MSFT")).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("falls back to the public asset over HTTP when the local file is absent", async () => {
    // Simulate the deployed function: the bundled file is gone.
    mockReadFileSync.mockImplementation(() => {
      throw enoent();
    });
    process.env.URL = "https://isaacavazquez.com";
    mockPublicAsset(["AAPL", "MSFT"]);

    const allowlist = await getAllowedSymbols();

    expect(allowlist.has("AAPL")).toBe(true);
    expect(await isAllowedSymbol("MSFT")).toBe(true);
    expect(await isAllowedSymbol("ZZZZZ")).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://isaacavazquez.com/data/investments/index.json",
      expect.objectContaining({ cache: "force-cache" })
    );
  });

  it("rejects malformed symbols even when they are not in the allowlist", async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ symbols: ["AAPL"] }));

    expect(await isAllowedSymbol("BAD SYMBOL")).toBe(false);
    expect(await isAllowedSymbol(".AAPL")).toBe(false);
  });

  it("reports a total miss as unavailable but does not cache the failure", async () => {
    mockReadFileSync.mockImplementation(() => {
      throw enoent();
    });
    // The bundled file is gone and the public-asset fetch fails too → total miss.
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    await expect(getAllowedSymbols()).rejects.toBeInstanceOf(
      FinnhubAllowlistUnavailableError
    );

    // A later request (asset now reachable) must recover rather than stay
    // wedged on a cached empty set for the life of the process.
    process.env.URL = "https://isaacavazquez.com";
    mockPublicAsset(["AAPL"]);
    const secondAttempt = await getAllowedSymbols();
    expect(secondAttempt.has("AAPL")).toBe(true);
  });

  it("does not re-fetch once a non-empty allowlist is cached", async () => {
    mockReadFileSync.mockImplementation(() => {
      throw enoent();
    });
    process.env.URL = "https://isaacavazquez.com";
    mockPublicAsset(["AAPL", "MSFT"]);

    await getAllowedSymbols();
    await getAllowedSymbols();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
