import fs from "fs";
import { renderHook, waitFor } from "@testing-library/react";
import {
  resetFantasyWeeklySnapshotCacheForTests,
  useFantasyWeeklySnapshot,
} from "../useFantasyWeeklySnapshot";
import { normalizeFantasyWeeklySnapshot } from "@/lib/fantasyWeeklySnapshot";

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
});
