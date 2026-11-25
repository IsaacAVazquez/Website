import { act, renderHook } from "@testing-library/react";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { getDraftTelemetryStorageKey, type DraftTurnRecord } from "@/lib/draftTelemetry";
import { useDraftTelemetry } from "../useDraftTelemetry";

function turn(pick: number, chosenPlayerId: string): DraftTurnRecord {
  return {
    pick,
    nextUserPick: null,
    chosenPlayerId,
    chosenPlayerName: chosenPlayerId,
    bestAvailableId: null,
    bestAvailableName: null,
    waitPosition: null,
    waitBaselineId: null,
    waitBaselineName: null,
    waitBaselineRank: null,
    expectedSurvivorId: null,
    expectedSurvivorName: null,
    expectedSurvivorRank: null,
    waitCostSpots: null,
    waitCostPoints: null,
    atRiskPlayerId: null,
    atRiskPlayerName: null,
    atRiskPosition: null,
    recommendedIds: [],
    modelVersion: null,
    snapshotRevision: null,
    rankingAsOf: null,
    marketAsOf: null,
    vorpAsOf: null,
    waitCandidates: [],
    recordedAt: "2026-08-31T00:00:00.000Z",
  };
}

function stored(draftId: string): unknown {
  return JSON.parse(localStorage.getItem(getDraftTelemetryStorageKey(draftId)) ?? "null");
}

describe("useDraftTelemetry", () => {
  beforeEach(() => {
    localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("sweeps other rooms' records on a write and keeps the current room's", () => {
    localStorage.setItem(getDraftTelemetryStorageKey("room-a"), JSON.stringify([turn(1, "wr-1")]));
    localStorage.setItem(getDraftTelemetryStorageKey("room-b"), JSON.stringify([turn(1, "rb-1")]));
    localStorage.setItem("unrelated-key", "kept");

    const { result } = renderHook(() => useDraftTelemetry("room-a"));
    // Reading a room sweeps nothing.
    expect(stored("room-b")).not.toBeNull();

    act(() => result.current.appendRecord(turn(12, "wr-2")));

    expect(stored("room-b")).toBeNull();
    expect(localStorage.getItem("unrelated-key")).toBe("kept");
    expect(stored("room-a")).toMatchObject([{ pick: 1 }, { pick: 12, chosenPlayerId: "wr-2" }]);
    expect(result.current.records.map((entry) => entry.pick)).toEqual([1, 12]);
  });

  it("replaces a re-logged turn and every record after it", () => {
    localStorage.setItem(
      getDraftTelemetryStorageKey("room-a"),
      JSON.stringify([turn(1, "wr-1"), turn(12, "wr-2"), turn(13, "rb-2")])
    );
    const { result } = renderHook(() => useDraftTelemetry("room-a"));

    act(() => result.current.appendRecord(turn(12, "te-1")));

    expect(result.current.records.map((entry) => entry.chosenPlayerId)).toEqual(["wr-1", "te-1"]);
  });

  it("loads the new room's records when the draft id changes", () => {
    localStorage.setItem(getDraftTelemetryStorageKey("room-a"), JSON.stringify([turn(1, "wr-1")]));
    localStorage.setItem(getDraftTelemetryStorageKey("room-b"), JSON.stringify([turn(3, "rb-1")]));

    const { result, rerender } = renderHook(({ draftId }) => useDraftTelemetry(draftId), {
      initialProps: { draftId: "room-a" },
    });
    expect(result.current.records.map((entry) => entry.chosenPlayerId)).toEqual(["wr-1"]);

    rerender({ draftId: "room-b" });

    expect(result.current.records.map((entry) => entry.chosenPlayerId)).toEqual(["rb-1"]);
  });
});
