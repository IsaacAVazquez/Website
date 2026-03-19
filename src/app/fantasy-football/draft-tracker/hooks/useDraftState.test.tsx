import { act, renderHook, waitFor } from "@testing-library/react";
import {
  calculateDraftOrder,
  FANTASY_DRAFT_STORAGE_KEY,
  useDraftState,
} from "./useDraftState";

const SAMPLE_PLAYER = {
  id: "player-1",
  name: "Bijan Robinson",
  team: "ATL",
  position: "RB" as const,
  averageRank: 1,
  projectedPoints: 275,
  standardDeviation: 1.2,
  expertRanks: [1],
};

describe("useDraftState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calculates snake order correctly", () => {
    expect(calculateDraftOrder(1, 4, "snake")).toBe(1);
    expect(calculateDraftOrder(4, 4, "snake")).toBe(4);
    expect(calculateDraftOrder(5, 4, "snake")).toBe(4);
    expect(calculateDraftOrder(8, 4, "snake")).toBe(1);
    expect(calculateDraftOrder(9, 4, "snake")).toBe(1);
  });

  it("advances picks as players are logged", () => {
    const { result } = renderHook(() => useDraftState());

    act(() => {
      result.current.updateSettings({
        totalTeams: 4,
        rounds: 3,
        userTeam: 2,
      });
    });

    act(() => {
      result.current.draftPlayer(SAMPLE_PLAYER);
    });

    expect(result.current.draftState.picks).toHaveLength(1);
    expect(result.current.draftState.picks[0].teamNumber).toBe(1);
    expect(result.current.draftState.currentPick).toBe(2);
    expect(result.current.currentTeamNumber).toBe(2);
  });

  it("persists the draft to localStorage", async () => {
    const { result, unmount } = renderHook(() => useDraftState());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.draftPlayer(SAMPLE_PLAYER);
    });

    expect(JSON.parse(localStorage.getItem(FANTASY_DRAFT_STORAGE_KEY) || "{}").picks).toHaveLength(1);

    unmount();

    const { result: restoredResult } = renderHook(() => useDraftState());
    await waitFor(() => expect(restoredResult.current.isLoaded).toBe(true));

    expect(restoredResult.current.draftState.picks).toHaveLength(1);
    expect(restoredResult.current.draftState.picks[0].player.name).toBe("Bijan Robinson");
  });
});
