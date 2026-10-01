import fs from "fs";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  resetFantasyWeeklySnapshotCacheForTests,
  useFantasyWeeklySnapshot,
} from "../useFantasyWeeklySnapshot";
import {
  FANTASY_WEEKLY_SNAPSHOT_URL,
  normalizeFantasyWeeklySnapshot,
} from "@/lib/fantasyWeeklySnapshot";

const published = JSON.parse(fs.readFileSync("public/data/fantasy/weekly.json", "utf8"));
const full = normalizeFantasyWeeklySnapshot(published);
// What the weekly page seeds: one scoring format's complete boards.
const seed = { ...full, boards: { ppr: full.boards.ppr } };

describe("useFantasyWeeklySnapshot", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    resetFantasyWeeklySnapshotCacheForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("starts from a server seed without a loading state, then fills in the other formats", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => published,
    });

    const { result } = renderHook(() => useFantasyWeeklySnapshot(seed));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.snapshot?.boards.ppr).toEqual(full.boards.ppr);
    expect(result.current.snapshot?.boards.standard).toBeUndefined();
    await waitFor(() =>
      expect(result.current.snapshot?.boards.standard).toEqual(full.boards.standard)
    );
  });

  it("keeps the seeded board when the background fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useFantasyWeeklySnapshot(seed));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.snapshot?.boards.ppr).toEqual(full.boards.ppr);
  });

  it("loads from the network when the page had nothing to seed", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => published,
    });

    const { result } = renderHook(() => useFantasyWeeklySnapshot());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.snapshot?.boards.ppr).toEqual(full.boards.ppr));
    expect(result.current.isLoading).toBe(false);
  });

  // force-cache hands back a stored copy without checking its age, and the
  // version in the URL was the redraft revision, which stopped moving at
  // kickoff. Together they pinned a browser to the first board it ever stored.
  it("requests the file with no version and leaves caching to the response headers", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => published,
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useFantasyWeeklySnapshot());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/data/fantasy/weekly.json");
    expect(url).toBe(FANTASY_WEEKLY_SNAPSHOT_URL);
    expect(init).not.toHaveProperty("cache");
  });

  it("prefers a newer server seed and keeps it when the fetched file is older", async () => {
    const older = { ...published, week: 3, generatedAt: "2026-09-22T17:00:00Z" };
    const newer = { ...full, week: 4, generatedAt: "2026-09-30T17:00:00Z", boards: { ppr: full.boards.ppr } };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => older });
    const first = renderHook(() => useFantasyWeeklySnapshot());
    await waitFor(() => expect(first.result.current.snapshot?.week).toBe(3));
    first.unmount();

    const next = renderHook(() => useFantasyWeeklySnapshot(newer));
    expect(next.result.current.snapshot?.week).toBe(4);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(jest.mocked(global.fetch).mock.calls[1][1]?.cache).toBe("no-cache");
    await act(async () => {});
    await waitFor(() => expect(next.result.current.error).not.toBeNull());
    expect(next.result.current.snapshot?.week).toBe(4);
    expect(next.result.current.snapshot?.boards.standard).toBeUndefined();
  });

  it("uses a newer seed on prop changes even while an older request is pending", async () => {
    let resolveResponse!: (response: unknown) => void;
    global.fetch = jest.fn().mockReturnValue(new Promise(resolve => { resolveResponse = resolve; }));
    const older = { ...seed, week: 3, generatedAt: "2026-09-22T17:00:00Z" };
    const newer = { ...seed, week: 4, generatedAt: "2026-09-30T17:00:00Z" };
    const { result, rerender } = renderHook(({ initial }) => useFantasyWeeklySnapshot(initial), {
      initialProps: { initial: older },
    });
    rerender({ initial: newer });
    expect(result.current.snapshot?.week).toBe(4);
    await act(async () => resolveResponse({ ok: true, status: 200, json: async () => ({ ...published, ...older, boards: published.boards }) }));
    expect(result.current.snapshot?.week).toBe(4);
  });

  it("revalidates an expired cache on focus and fills all formats with the new board", async () => {
    let now = Date.now();
    jest.spyOn(Date, "now").mockImplementation(() => now);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...published, week: 3 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...published, week: 4 }) });
    const { result } = renderHook(() => useFantasyWeeklySnapshot());
    await waitFor(() => expect(result.current.snapshot?.week).toBe(3));
    act(() => window.dispatchEvent(new Event("focus")));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    now += 60 * 60 * 1000;
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(result.current.snapshot?.week).toBe(4));
    expect(result.current.snapshot?.boards.standard).toEqual(full.boards.standard);
    expect(jest.mocked(global.fetch).mock.calls[1][1]?.cache).toBe("no-cache");
  });

  it("expires a cached 404 so a later visit can load the published board", async () => {
    let now = Date.now();
    jest.spyOn(Date, "now").mockImplementation(() => now);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => published });
    const first = renderHook(() => useFantasyWeeklySnapshot());
    await waitFor(() => expect(first.result.current.notPublished).toBe(true));
    first.unmount();
    now += 60 * 60 * 1000;
    const next = renderHook(() => useFantasyWeeklySnapshot());
    await waitFor(() => expect(next.result.current.snapshot?.week).toBe(full.week));
    expect(next.result.current.notPublished).toBe(false);
  });

  it("preserves a published seed when the browser still receives a 404", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const { result } = renderHook(() => useFantasyWeeklySnapshot(seed));
    await act(async () => {});
    expect(result.current.snapshot?.week).toBe(seed.week);
    expect(result.current.notPublished).toBe(false);
  });
});
