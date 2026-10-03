import { act, cleanup, renderHook } from "@testing-library/react";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { createPool, SCORE_POOLS_STORAGE_KEY } from "@/lib/scorePools/persistence";
import { useScorePools } from "../useScorePools";

function stored() {
  const raw = window.localStorage.getItem(SCORE_POOLS_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

const manualResult = {
  ninetyMinutes: { home: 1, away: 1 },
  afterExtraTime: null,
  penaltyWinner: "home" as const,
};

const manualOdds = {
  home: 2.1,
  draw: 3.3,
  away: 3.6,
  line: 2.5,
  over: 1.9,
  under: 1.95,
  enteredAt: "2026-08-01T10:00:00.000Z",
};

describe("useScorePools", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("starts empty with nothing stored", () => {
    const { result } = renderHook(() => useScorePools());
    expect(result.current.store).toEqual({ version: 1, activePoolId: null, pools: [] });
    expect(result.current.pools).toEqual([]);
    expect(result.current.activePool).toBeNull();
  });

  it("falls back to an empty store on corrupt or wrong-version storage", () => {
    window.localStorage.setItem(SCORE_POOLS_STORAGE_KEY, "{not json");
    const corrupt = renderHook(() => useScorePools());
    expect(corrupt.result.current.pools).toEqual([]);
    corrupt.unmount();

    resetBrowserStorageMemory();
    window.localStorage.setItem(
      SCORE_POOLS_STORAGE_KEY,
      JSON.stringify({ version: 99, pools: [createPool("epl", "Old")] }),
    );
    const wrongVersion = renderHook(() => useScorePools());
    expect(wrongVersion.result.current.pools).toEqual([]);
  });

  it("recovers from corrupt storage on the first write", () => {
    window.localStorage.setItem(SCORE_POOLS_STORAGE_KEY, "{not json");
    const { result } = renderHook(() => useScorePools());
    act(() => {
      result.current.addPool("epl", "Fresh");
    });
    expect(result.current.pools.map((pool) => pool.name)).toEqual(["Fresh"]);
    expect(stored().pools).toHaveLength(1);
  });

  it("reads a valid stored store", () => {
    const pool = createPool("epl", "Office");
    window.localStorage.setItem(
      SCORE_POOLS_STORAGE_KEY,
      JSON.stringify({ version: 1, activePoolId: pool.id, pools: [pool] }),
    );
    const { result } = renderHook(() => useScorePools());
    expect(result.current.activePool).toEqual(pool);
  });

  it("adds pools, makes the newest active, and persists them", () => {
    const { result } = renderHook(() => useScorePools());
    let first = "";
    let second = "";
    act(() => {
      first = result.current.addPool("epl", "Office");
    });
    act(() => {
      second = result.current.addPool("laliga", "Family");
    });
    expect(first).toMatch(/^pool-/);
    expect(result.current.pools.map((pool) => pool.id)).toEqual([first, second]);
    expect(result.current.activePool?.id).toBe(second);
    expect(result.current.activePool?.leagueKey).toBe("laliga");
    expect(stored().activePoolId).toBe(second);

    act(() => {
      result.current.setActivePool(first);
    });
    expect(result.current.activePool?.name).toBe("Office");
  });

  it("removes pools, moving the active pool only when the active one goes", () => {
    const { result } = renderHook(() => useScorePools());
    const ids: string[] = [];
    act(() => {
      ids.push(result.current.addPool("epl", "A"));
    });
    act(() => {
      ids.push(result.current.addPool("epl", "B"));
    });
    act(() => {
      ids.push(result.current.addPool("epl", "C"));
    });
    // C is active; removing A leaves C active.
    act(() => {
      result.current.removePool(ids[0]);
    });
    expect(result.current.activePool?.id).toBe(ids[2]);
    // Removing the active C falls back to the first remaining pool.
    act(() => {
      result.current.removePool(ids[2]);
    });
    expect(result.current.activePool?.id).toBe(ids[1]);
    act(() => {
      result.current.removePool(ids[1]);
    });
    expect(result.current.pools).toEqual([]);
    expect(result.current.activePool).toBeNull();
  });

  it("sets, batches, and clears submissions on one pool only", () => {
    const { result } = renderHook(() => useScorePools());
    let target = "";
    let other = "";
    act(() => {
      other = result.current.addPool("epl", "Other");
    });
    act(() => {
      target = result.current.addPool("epl", "Target");
    });
    act(() => {
      result.current.setSubmission(target, "f1", { home: 1, away: 0 }, "t1");
    });
    act(() => {
      result.current.setSubmissions(
        target,
        [
          { fixtureId: "f1", score: { home: 2, away: 2 } },
          { fixtureId: "f2", score: { home: 0, away: 1 } },
        ],
        "t2",
      );
    });
    const pool = () => result.current.pools.find((entry) => entry.id === target);
    expect(pool()?.submissions).toEqual({
      f1: { score: { home: 2, away: 2 }, submittedAt: "t2" },
      f2: { score: { home: 0, away: 1 }, submittedAt: "t2" },
    });
    expect(result.current.pools.find((entry) => entry.id === other)?.submissions).toEqual({});

    act(() => {
      result.current.clearSubmission(target, "f1");
    });
    expect(Object.keys(pool()?.submissions ?? {})).toEqual(["f2"]);
  });

  it("stores flags only while at least one is set", () => {
    const { result } = renderHook(() => useScorePools());
    let id = "";
    act(() => {
      id = result.current.addPool("epl", "Office");
    });
    act(() => {
      result.current.setFixtureFlags(id, "f1", { deadRubber: true });
      result.current.setFixtureFlags(id, "f2", { mustWinHome: true });
    });
    expect(result.current.activePool?.flags).toEqual({
      f1: { deadRubber: true },
      f2: { mustWinHome: true },
    });
    act(() => {
      result.current.setFixtureFlags(id, "f1", { deadRubber: false });
      result.current.setFixtureFlags(id, "f2", null);
    });
    expect(result.current.activePool?.flags).toEqual({});
  });

  it("sets and clears manual results and odds", () => {
    const { result } = renderHook(() => useScorePools());
    let id = "";
    act(() => {
      id = result.current.addPool("epl", "Office");
    });
    act(() => {
      result.current.setManualResult(id, "f1", manualResult);
      result.current.setManualOdds(id, "f1", manualOdds);
    });
    expect(result.current.activePool?.manualResults).toEqual({ f1: manualResult });
    expect(result.current.activePool?.manualOdds).toEqual({ f1: manualOdds });
    act(() => {
      result.current.setManualResult(id, "f1", null);
      result.current.setManualOdds(id, "f1", null);
    });
    expect(result.current.activePool?.manualResults).toEqual({});
    expect(result.current.activePool?.manualOdds).toEqual({});
  });

  it("adds, updates, and removes rivals", () => {
    const { result } = renderHook(() => useScorePools());
    let id = "";
    act(() => {
      id = result.current.addPool("epl", "Office");
    });
    act(() => {
      result.current.addRival(id, "Sam");
      result.current.addRival(id, "Alex");
    });
    const [sam, alex] = result.current.activePool?.rivals ?? [];
    expect(sam.name).toBe("Sam");
    expect(sam.id).toMatch(/^rival-/);

    act(() => {
      result.current.updateRival(id, sam.id, (rival) => ({
        ...rival,
        pointsAdjustment: 4,
        picks: { f1: { home: 1, away: 0 } },
      }));
    });
    expect(result.current.activePool?.rivals[0]).toEqual({
      ...sam,
      pointsAdjustment: 4,
      picks: { f1: { home: 1, away: 0 } },
    });
    expect(result.current.activePool?.rivals[1]).toEqual(alex);

    act(() => {
      result.current.removeRival(id, sam.id);
    });
    expect(result.current.activePool?.rivals).toEqual([alex]);
  });

  it("leaves pools alone when updating an unknown pool id", () => {
    const { result } = renderHook(() => useScorePools());
    act(() => {
      result.current.addPool("epl", "Office");
    });
    const before = result.current.pools;
    act(() => {
      result.current.updatePool("missing", (pool) => ({ ...pool, name: "Changed" }));
    });
    expect(result.current.pools).toEqual(before);
  });

  it("builds each write on the freshest stored value, keeping another tab's pool", () => {
    const { result } = renderHook(() => useScorePools());
    act(() => {
      result.current.addPool("epl", "Mine");
    });
    // Another tab writes straight to storage without this tab hearing about it.
    const current = stored();
    const theirs = createPool("epl", "Theirs");
    window.localStorage.setItem(
      SCORE_POOLS_STORAGE_KEY,
      JSON.stringify({ ...current, pools: [...current.pools, theirs] }),
    );
    act(() => {
      result.current.addPool("epl", "Mine too");
    });
    expect(result.current.pools.map((pool) => pool.name)).toEqual(["Mine", "Theirs", "Mine too"]);
  });

  it("picks up another tab's write through the storage event", () => {
    const { result } = renderHook(() => useScorePools());
    expect(result.current.pools).toEqual([]);
    const pool = createPool("epl", "From another tab");
    const value = JSON.stringify({ version: 1, activePoolId: pool.id, pools: [pool] });
    window.localStorage.setItem(SCORE_POOLS_STORAGE_KEY, value);
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: SCORE_POOLS_STORAGE_KEY, newValue: value }),
      );
    });
    expect(result.current.activePool?.name).toBe("From another tab");
  });

  it("keeps working in memory when storage writes throw", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    const { result } = renderHook(() => useScorePools());
    act(() => {
      result.current.addPool("epl", "Office");
    });
    expect(result.current.activePool?.name).toBe("Office");
    expect(window.localStorage.getItem(SCORE_POOLS_STORAGE_KEY)).toBeNull();
  });
});
