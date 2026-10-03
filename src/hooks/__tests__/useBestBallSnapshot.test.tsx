import fs from "fs";
import { renderHook, waitFor } from "@testing-library/react";
import { useBestBallSnapshot } from "../useBestBallSnapshot";

const published = JSON.parse(fs.readFileSync("public/data/fantasy/best-ball.json", "utf8"));

describe("useBestBallSnapshot", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // The best ball file is rebuilt on its own schedule, so the redraft revision
  // says nothing about it, and force-cache never asks how old a stored copy is.
  it("requests the file with no version and leaves caching to the response headers", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => published,
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useBestBallSnapshot());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.snapshot?.generatedAt).toBe(published.generatedAt);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/data/fantasy/best-ball.json");
    expect(init).not.toHaveProperty("cache");
  });
});

describe("useBestBallSnapshot loading states", () => {
  const originalFetch = global.fetch;

  type HookModule = typeof import("../useBestBallSnapshot");
  type RtlModule = typeof import("@testing-library/react/pure");

  // The snapshot cache is module state, so each case loads a fresh hook module
  // together with its own copy of React Testing Library (one React instance).
  // The pure entry registers no global hooks, so cleanup runs by hand below.
  let cleanupFresh: (() => void) | null = null;

  function freshHook(): HookModule & RtlModule {
    let loaded!: HookModule & RtlModule;
    jest.isolateModules(() => {
      loaded = {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
        ...(require("@testing-library/react/pure") as RtlModule),
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
        ...(require("../useBestBallSnapshot") as HookModule),
      };
    });
    cleanupFresh = loaded.cleanup;
    return loaded;
  }

  function okResponse(body: unknown) {
    return { ok: true, status: 200, json: async () => body };
  }

  afterEach(() => {
    cleanupFresh?.();
    cleanupFresh = null;
    global.fetch = originalFetch;
  });

  it("reports an error and no snapshot when the file request fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    const { renderHook: render, waitFor: wait, useBestBallSnapshot: useHook } = freshHook();

    const { result } = render(() => useHook());
    expect(result.current.isLoading).toBe(true);
    await wait(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBe("Best ball rankings are unavailable right now.");
  });

  it("treats a payload that fails validation as unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ schemaVersion: -1 }));
    const { renderHook: render, waitFor: wait, useBestBallSnapshot: useHook } = freshHook();

    const { result } = render(() => useHook());
    await wait(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).not.toBeNull();
  });

  it("refetches on retry after a failure", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(okResponse(published));
    global.fetch = fetchMock;
    const { renderHook: render, waitFor: wait, act: run, useBestBallSnapshot: useHook } = freshHook();

    const { result } = render(() => useHook());
    await wait(() => expect(result.current.error).not.toBeNull());

    run(() => result.current.retry());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await wait(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.snapshot?.generatedAt).toBe(published.generatedAt);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares one request between concurrent hooks and serves later mounts from the cache", async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse(published));
    global.fetch = fetchMock;
    const { renderHook: render, waitFor: wait, useBestBallSnapshot: useHook } = freshHook();

    const first = render(() => useHook());
    const second = render(() => useHook());
    await wait(() => {
      expect(first.result.current.isLoading).toBe(false);
      expect(second.result.current.isLoading).toBe(false);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const later = render(() => useHook());
    // A cached snapshot renders on the first pass with no loading state.
    expect(later.result.current.isLoading).toBe(false);
    expect(later.result.current.snapshot?.generatedAt).toBe(published.generatedAt);
    await wait(() => expect(later.result.current.snapshot).not.toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ignores a response that lands after the hook unmounted", async () => {
    let resolveFetch!: (value: unknown) => void;
    global.fetch = jest.fn(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      })
    ) as unknown as typeof fetch;
    const { renderHook: render, act: run, useBestBallSnapshot: useHook } = freshHook();

    const { result, unmount } = render(() => useHook());
    unmount();
    await run(async () => {
      resolveFetch(okResponse(published));
      await Promise.resolve();
    });

    // The last rendered state is untouched: still loading, nothing stored.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
