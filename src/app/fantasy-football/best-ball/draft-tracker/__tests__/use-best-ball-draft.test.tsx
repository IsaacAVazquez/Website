import { act, renderHook } from "@testing-library/react";
import type { Player } from "@/types";
import { useBestBallDraft } from "../use-best-ball-draft";
import {
  addBestBallDraftPick,
  createBestBallDraftState,
  getBestBallDraftBackupKey,
  getBestBallDraftStorageKey,
  type BestBallRoomRules,
} from "../best-ball-draft-state";

const rules: BestBallRoomRules = {
  contestId: "best-ball-mania",
  rulesSchemaVersion: 2,
  competitionFormat: "tournament",
  lineupVariant: "standard",
  scoring: "HALF_PPR",
  teams: 12,
  rounds: 18,
  rosterSize: 18,
  lineup: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 },
};
const key = getBestBallDraftStorageKey(2026, rules.contestId);
const player = (id: string): Player => ({
  id, name: `Player ${id}`, team: "SF", position: "WR", averageRank: 1,
});

function useRoom(season = 2026) {
  return useBestBallDraft({ season, rules });
}

describe("useBestBallDraft save revisions", () => {
  beforeEach(() => localStorage.clear());

  it.each(["notification", "missed notification"])(
    "preserves unsaved picks and protects an external revision after a %s",
    (notification) => {
      const { result } = renderHook(() => useRoom());
      const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota");
      });
      try {
        act(() => {
          result.current.draftPlayer(player("local-first"));
          result.current.draftPlayer(player("local-second"));
        });
        expect(result.current.state.picks).toHaveLength(2);
      } finally {
        write.mockRestore();
      }

      const external = addBestBallDraftPick(createBestBallDraftState(2026, rules, 1), player("external"));
      const raw = JSON.stringify(external);
      localStorage.setItem(key, raw);
      act(() => {
        if (notification === "notification") {
          window.dispatchEvent(new StorageEvent("storage", { key, newValue: raw }));
        }
        result.current.draftPlayer(player("next-local"));
      });

      expect(result.current.state.picks.map((pick) => pick.player.id)).toEqual(
        expect.arrayContaining(["local-first", "local-second"])
      );
      expect(result.current.state.picks.some((pick) => pick.player.id === "external")).toBe(false);
      expect(result.current.persistenceError).toMatch(/another tab|conflict/i);
      expect(localStorage.getItem(key)).toBe(raw);

      act(() => result.current.resetDraft());
      expect(result.current.state.picks).toEqual([]);
      expect(result.current.persistenceError).toBeNull();
      expect(JSON.parse(localStorage.getItem(key)!).picks).toEqual([]);
    }
  );

  it("saves consecutive memory-only picks when writes recover and the durable revision is unchanged", () => {
    const { result } = renderHook(() => useRoom());
    const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    try {
      act(() => result.current.draftPlayer(player("memory-first")));
      expect(result.current.persistenceError).toMatch(/cannot be saved/i);
    } finally {
      write.mockRestore();
    }
    act(() => result.current.draftPlayer(player("memory-second")));
    expect(result.current.state.picks.map((pick) => pick.player.id)).toEqual(["memory-first", "memory-second"]);
    expect(JSON.parse(localStorage.getItem(key)!).picks).toHaveLength(2);
    expect(result.current.persistenceError).toBeNull();
  });

  it("synchronizes two mounted rooms and keeps batched picks and undo/redo", () => {
    const first = renderHook(() => useRoom());
    const second = renderHook(() => useRoom());
    act(() => first.result.current.draftPlayer(player("first")));
    expect(second.result.current.state.picks.map((pick) => pick.player.id)).toEqual(["first"]);
    act(() => {
      second.result.current.draftPlayer(player("second"));
      second.result.current.draftPlayer(player("third"));
    });
    expect(first.result.current.state.picks.map((pick) => pick.player.id)).toEqual(["first", "second", "third"]);
    act(() => first.result.current.undoToPick(2));
    expect(second.result.current.state.picks).toHaveLength(1);
    act(() => {
      second.result.current.redoLastPick();
      second.result.current.redoLastPick();
    });
    expect(first.result.current.state.picks).toHaveLength(3);
    expect(JSON.parse(localStorage.getItem(key)!).picks).toHaveLength(3);
  });

  it("rejects an outdated pick after a missed event and saves only on explicit retry", () => {
    const { result } = renderHook(() => useRoom());
    const external = addBestBallDraftPick(createBestBallDraftState(2026, rules, 1), player("external"));
    const raw = JSON.stringify(external);
    localStorage.setItem(key, raw);
    act(() => result.current.draftPlayer(player("retry")));
    expect(localStorage.getItem(key)).toBe(raw);
    expect(result.current.state.picks.map((pick) => pick.player.id)).toEqual(["external"]);
    expect(result.current.persistenceError).toMatch(/try that action again/i);
    act(() => result.current.draftPlayer(player("retry")));
    expect(result.current.state.picks.map((pick) => pick.player.id)).toEqual(["external", "retry"]);
    expect(result.current.persistenceError).toBeNull();
  });

  it("loads a cross-tab notification without rewriting it", () => {
    const { result } = renderHook(() => useRoom());
    const raw = JSON.stringify(addBestBallDraftPick(createBestBallDraftState(2026, rules, 1), player("external")));
    localStorage.setItem(key, raw);
    act(() => window.dispatchEvent(new StorageEvent("storage", { key, newValue: raw })));
    expect(result.current.state.picks).toHaveLength(1);
    expect(localStorage.getItem(key)).toBe(raw);
  });

  it("backs up a corrupt save and persists a fresh room", () => {
    localStorage.setItem(key, "{invalid");
    const { result } = renderHook(() => useRoom());
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.restoreNotice).toMatch(/local backup/i);
    expect(localStorage.getItem(getBestBallDraftBackupKey(2026, rules.contestId))).toBe("{invalid");
    expect(JSON.parse(localStorage.getItem(key)!).picks).toEqual([]);
  });

  it("changes rooms when the season key changes without overwriting the prior room", () => {
    const { result, rerender } = renderHook(({ season }) => useRoom(season), { initialProps: { season: 2026 } });
    act(() => result.current.draftPlayer(player("first")));
    const prior = localStorage.getItem(key);
    rerender({ season: 2027 });
    expect(result.current.state.season).toBe(2027);
    expect(result.current.state.picks).toEqual([]);
    act(() => result.current.draftPlayer(player("next-season")));
    expect(localStorage.getItem(key)).toBe(prior);
    expect(JSON.parse(localStorage.getItem(getBestBallDraftStorageKey(2027, rules.contestId))!).picks[0].player.id).toBe("next-season");
  });

  it("keeps consecutive picks in memory when storage reads and writes are blocked", () => {
    const read = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    try {
      const { result } = renderHook(() => useRoom());
      act(() => {
        result.current.startDraft();
        result.current.draftPlayer(player("first"));
        result.current.draftPlayer(player("second"));
      });
      expect(result.current.state.picks).toHaveLength(2);
      expect(result.current.persistenceError).toMatch(/cannot be saved/i);
    } finally {
      read.mockRestore();
      write.mockRestore();
    }
  });
});


it("backs up an invalid external room without rewriting the external revision", () => {
  localStorage.clear();
  const { result } = renderHook(() => useRoom());
  act(() => result.current.draftPlayer(player("existing")));
  localStorage.setItem(key, "{external invalid");
  act(() => window.dispatchEvent(new StorageEvent("storage", { key, newValue: "{external invalid" })));
  expect(result.current.state.picks).toEqual([]);
  expect(result.current.restoreNotice).toMatch(/local backup/i);
  expect(localStorage.getItem(getBestBallDraftBackupKey(2026, rules.contestId))).toBe("{external invalid");
  expect(localStorage.getItem(key)).toBe("{external invalid");
});
