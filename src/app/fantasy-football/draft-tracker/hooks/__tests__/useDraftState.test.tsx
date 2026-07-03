import { renderHook, waitFor } from "@testing-library/react";
import {
  FANTASY_DRAFT_STORAGE_KEY,
  useDraftState,
} from "../useDraftState";

describe("useDraftState persisted-state loading", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads an older v2 blob missing undoHistory/teams/draftId without crashing", async () => {
    // A draft saved by a build that predates the undo/redo and teams fields —
    // same storage version, smaller shape. The tracker must hydrate it with
    // defaults instead of white-screening on undefined fields.
    const oldBlob = {
      settings: {
        totalTeams: 8,
        userTeam: 3,
        scoringFormat: "PPR",
        draftType: "snake",
        rounds: 15,
        timerSeconds: 90,
        leagueName: "Legacy League",
        draftDate: "2026-06-01T12:00:00.000Z",
      },
      picks: [
        {
          pickNumber: 1,
          round: 1,
          teamNumber: 1,
          timestamp: "2026-06-01T12:01:00.000Z",
          player: {
            id: "p1",
            name: "Test Player",
            team: "SF",
            position: "RB",
            rank: 1,
            tier: 1,
          },
        },
      ],
      currentPick: 2,
      currentRound: 1,
      isActive: true,
    };
    localStorage.setItem(FANTASY_DRAFT_STORAGE_KEY, JSON.stringify(oldBlob));

    const { result } = renderHook(() => useDraftState());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    // The persisted fields survive…
    expect(result.current.draftState.settings.leagueName).toBe("Legacy League");
    expect(result.current.draftState.currentPick).toBe(2);
    expect(result.current.draftState.picks).toHaveLength(1);

    // …and the missing fields hydrate to safe defaults.
    expect(result.current.draftState.undoHistory).toEqual([]);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.draftState.teams).toHaveLength(8);
    expect(typeof result.current.draftState.draftId).toBe("string");

    // Teams rebuilt from picks keep roster consistency.
    expect(result.current.draftState.teams[0].picks).toHaveLength(1);
    expect(result.current.draftState.teams[0].positionCounts.RB).toBe(1);
  });

  it("still drops a corrupt blob and starts clean", async () => {
    localStorage.setItem(FANTASY_DRAFT_STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useDraftState());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks).toEqual([]);
    expect(result.current.draftState.undoHistory).toEqual([]);
  });
});
