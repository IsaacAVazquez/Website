/**
 * @jest-environment node
 */

const realFetch = global.fetch;

function providerResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      c: 203.1,
      d: 2.1,
      dp: 1.05,
      h: 204,
      l: 200.5,
      o: 201.5,
      pc: 201,
      t: Math.floor(Date.now() / 1000),
      ...overrides,
    }),
  };
}

async function loadClient() {
  jest.resetModules();
  process.env.FINNHUB_API_KEY = "test-key";
  return import("@/lib/finnhub");
}

describe("Finnhub quote parsing", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(providerResponse()) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = realFetch;
    delete process.env.FINNHUB_API_KEY;
  });

  it("preserves the provider market timestamp", async () => {
    const timestamp = Math.floor(Date.now() / 1000) - 90;
    global.fetch = jest.fn().mockResolvedValue(
      providerResponse({ t: timestamp })
    ) as unknown as typeof fetch;
    const { fetchFinnhubQuote } = await loadClient();

    const quote = await fetchFinnhubQuote("AAPL");

    expect(quote).toMatchObject({
      symbol: "AAPL",
      price: 203.1,
      source: "finnhub",
      asOf: new Date(timestamp * 1000).toISOString(),
    });
  });

  it("rejects a quote whose provider timestamp is materially old", async () => {
    const oldTimestamp = Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000);
    global.fetch = jest.fn().mockResolvedValue(
      providerResponse({ t: oldTimestamp })
    ) as unknown as typeof fetch;
    const { fetchFinnhubQuote } = await loadClient();

    const quote = await fetchFinnhubQuote("AAPL");

    expect(quote.error).toMatch(/unavailable/i);
    expect(quote.price).toBe(0);
  });

  it("rejects incomplete day-move fields instead of coercing them to zero", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      providerResponse({ d: null })
    ) as unknown as typeof fetch;
    const { fetchFinnhubQuote } = await loadClient();

    const quote = await fetchFinnhubQuote("AAPL");

    expect(quote.error).toMatch(/unavailable/i);
    expect(quote.price).toBe(0);
  });

  it("coalesces concurrent requests and reuses the short per-symbol cache", async () => {
    const { fetchFinnhubQuote } = await loadClient();

    const [first, second] = await Promise.all([
      fetchFinnhubQuote("AAPL"),
      fetchFinnhubQuote("AAPL"),
    ]);
    const third = await fetchFinnhubQuote("AAPL");

    expect(first.price).toBe(203.1);
    expect(second).toEqual(first);
    expect(third).toEqual(first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("maps the curated Berkshire symbol to Finnhub class-share notation", async () => {
    const { fetchFinnhubQuote } = await loadClient();

    const quote = await fetchFinnhubQuote("BRK-B");

    expect(quote.symbol).toBe("BRK-B");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("symbol=BRK.B"),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Finnhub-Token": "test-key" }),
      }),
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).not.toContain("token=");
  });

  it("aborts newly started provider work at the caller's shorter deadline", async () => {
    let capturedSignal: AbortSignal | undefined;
    global.fetch = jest.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          capturedSignal = init?.signal ?? undefined;
          capturedSignal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    ) as unknown as typeof fetch;
    const { fetchFinnhubQuote } = await loadClient();
    jest.useFakeTimers();

    const pending = fetchFinnhubQuote("AAPL", { timeoutMs: 5 });
    jest.advanceTimersByTime(5);
    const quote = await pending;

    expect(capturedSignal?.aborted).toBe(true);
    expect(quote.error).toMatch(/temporarily unavailable/i);
  });
});
