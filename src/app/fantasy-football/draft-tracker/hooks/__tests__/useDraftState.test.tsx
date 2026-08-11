import { act, renderHook, waitFor } from "@testing-library/react";
import {
  calculateDraftOrder,
  FANTASY_DRAFT_STORAGE_KEY,
  useDraftState,
} from "../useDraftState";

const VALID_SETTINGS = {
  totalTeams: 8,
  userTeam: 3,
  scoringFormat: "PPR",
  draftType: "snake",
  rounds: 13,
  timerSeconds: 90,
  leagueName: "Saved League",
  draftDate: "2026-06-01T12:00:00.000Z",
} as const;

function persistedPlayer(id: string, position: "QB" | "RB" | "WR" | "TE" | "K" | "DST" = "RB") {
  return {
    id,
    name: `Player ${id}`,
    team: "SF",
    position,
    averageRank: 1,
    standardDeviation: 1,
    projectedPoints: 250,
    auctionValue: 22,
  };
}

function persistedPick(
  pickNumber: number,
  playerId = `player-${pickNumber}`,
  overrides: Record<string, unknown> = {}
) {
  return {
    pickNumber,
    round: Math.ceil(pickNumber / VALID_SETTINGS.totalTeams),
    teamNumber: calculateDraftOrder(
      pickNumber,
      VALID_SETTINGS.totalTeams,
      VALID_SETTINGS.draftType
    ),
    timestamp: `2026-06-01T12:${String(pickNumber).padStart(2, "0")}:00.000Z`,
    player: persistedPlayer(playerId),
    ...overrides,
  };
}

describe("useDraftState persisted-state loading", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads a smaller v3 blob missing lineup, undo history, teams, and draft id", async () => {
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
    expect(result.current.draftState.settings.lineup).toEqual({
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 1,
      K: 1,
      DST: 1,
    });

    // Teams rebuilt from picks keep roster consistency.
    expect(result.current.draftState.teams[0].picks).toHaveLength(1);
    expect(result.current.draftState.teams[0].positionCounts.RB).toBe(1);
  });

  it("migrates an active v2 draft into the lineup-aware state", async () => {
    const previousKey = FANTASY_DRAFT_STORAGE_KEY.replace("-v3-", "-v2-");
    localStorage.setItem(
      previousKey,
      JSON.stringify({
        settings: {
          totalTeams: 12,
          userTeam: 4,
          scoringFormat: "HALF_PPR",
          draftType: "snake",
          rounds: 15,
        },
        picks: [],
        currentPick: 1,
        currentRound: 1,
        isActive: true,
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.settings.userTeam).toBe(4);
    expect(result.current.draftState.settings.lineup.FLEX).toBe(1);
    expect(localStorage.getItem(previousKey)).toBeNull();
  });

  it("round-trips a drafted player without expert spread", async () => {
    const {
      standardDeviation: _spread,
      ...playerWithoutSpread
    } = persistedPlayer("no-expert-spread");
    const firstRender = renderHook(() => useDraftState());
    await waitFor(() => expect(firstRender.result.current.isLoaded).toBe(true));

    act(() => {
      firstRender.result.current.startDraft();
      firstRender.result.current.draftPlayer(playerWithoutSpread);
    });

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem(FANTASY_DRAFT_STORAGE_KEY) ?? "{}"
      ) as { picks?: Array<{ player?: Record<string, unknown> }> };
      expect(saved.picks).toHaveLength(1);
      expect(saved.picks?.[0].player).not.toHaveProperty("standardDeviation");
    });
    firstRender.unmount();

    const restoredRender = renderHook(() => useDraftState());
    await waitFor(() => expect(restoredRender.result.current.isLoaded).toBe(true));

    expect(restoredRender.result.current.draftState.picks).toHaveLength(1);
    expect(restoredRender.result.current.draftState.picks[0].player).toMatchObject({
      id: "no-expert-spread",
      position: "RB",
      averageRank: 1,
    });
    expect(
      restoredRender.result.current.draftState.picks[0].player
    ).not.toHaveProperty("standardDeviation");
    expect(restoredRender.result.current.draftState.teams[0].positionCounts.RB).toBe(1);
  });

  it("rebuilds null or malformed team entries and preserves only valid names", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: [persistedPick(1)],
        teams: [
          null,
          {
            teamNumber: 2,
            teamName: "  The Commish  ",
            picks: "not an array",
            positionCounts: null,
            totalValue: "wrong",
          },
          { teamNumber: 3, teamName: 42 },
          { teamNumber: 99, teamName: "Out of range" },
          null,
          null,
          null,
          null,
        ],
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.teams).toHaveLength(8);
    expect(result.current.draftState.teams.every(Boolean)).toBe(true);
    expect(result.current.draftState.teams[0]).toMatchObject({
      teamNumber: 1,
      teamName: "Team 1",
      totalValue: 22,
      projectedPoints: 250,
      positionCounts: { RB: 1 },
    });
    expect(result.current.draftState.teams[0].picks).toHaveLength(1);
    expect(result.current.draftState.teams[1].teamName).toBe("The Commish");
    expect(result.current.draftState.teams[2].teamName).toBe("Team 3");
  });

  it("stops at a pick whose player is missing instead of bridging the gap", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: [
          persistedPick(1),
          {
            pickNumber: 2,
            round: 1,
            teamNumber: 2,
            timestamp: "2026-06-01T12:02:00.000Z",
          },
          persistedPick(3),
        ],
        currentPick: 4,
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks.map((pick) => pick.pickNumber)).toEqual([1]);
    expect(result.current.draftState.currentPick).toBe(2);
    expect(result.current.draftState.teams[1].picks).toEqual([]);
  });

  it("keeps only the valid prefix when persisted pick numbers are duplicated", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: [
          persistedPick(1, "first"),
          persistedPick(1, "duplicate-number"),
          persistedPick(2, "after-duplicate"),
        ],
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks.map((pick) => pick.player.id)).toEqual(["first"]);
    expect(result.current.draftState.currentPick).toBe(2);
  });

  it("stops before a second pick for the same player", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: [persistedPick(1, "same-player"), persistedPick(2, "same-player")],
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks.map((pick) => pick.pickNumber)).toEqual([1]);
    expect(result.current.draftState.currentPick).toBe(2);
  });

  it("keeps only the valid prefix when persisted picks are noncontiguous", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: [persistedPick(1), persistedPick(3)],
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks.map((pick) => pick.pickNumber)).toEqual([1]);
    expect(result.current.draftState.currentPick).toBe(2);
  });

  it("rejects a persisted pick whose team or round does not match the snake slot", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: [persistedPick(1), persistedPick(2, "wrong-slot", { teamNumber: 8, round: 2 })],
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks.map((pick) => pick.pickNumber)).toEqual([1]);
    expect(result.current.draftState.currentPick).toBe(2);
  });

  it("clamps zero and out-of-range settings to supported room controls", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: {
          totalTeams: 0,
          userTeam: 999,
          scoringFormat: "POINTS_PER_FIRST_DOWN",
          draftType: "auction",
          rounds: 99,
          lineup: { QB: 99, RB: -5, WR: 99, TE: 0, FLEX: 99, K: 99, DST: -2 },
          timerSeconds: 999,
          leagueName: 42,
          draftDate: "not a date",
        },
        teams: [null],
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.settings).toMatchObject({
      totalTeams: 8,
      userTeam: 8,
      scoringFormat: "PPR",
      draftType: "snake",
      rounds: 18,
      timerSeconds: 180,
      leagueName: "My Fantasy League",
      lineup: { QB: 1, RB: 1, WR: 4, TE: 1, FLEX: 3, K: 1, DST: 0 },
    });
    expect(result.current.draftState.settings.draftDate).toBeInstanceOf(Date);
    expect(result.current.draftState.teams).toHaveLength(8);
  });

  it("derives counters and active state from the repaired pick history", async () => {
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: [persistedPick(1), persistedPick(2)],
        currentPick: 77,
        currentRound: 11,
        isActive: false,
        endTime: "2026-06-01T14:00:00.000Z",
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.currentPick).toBe(3);
    expect(result.current.draftState.currentRound).toBe(1);
    expect(result.current.draftState.isActive).toBe(true);
    expect(result.current.draftState.endTime).toBeUndefined();
  });

  it("restores a completed draft in the configured final round", async () => {
    const totalPicks = VALID_SETTINGS.totalTeams * VALID_SETTINGS.rounds;
    localStorage.setItem(
      FANTASY_DRAFT_STORAGE_KEY,
      JSON.stringify({
        settings: VALID_SETTINGS,
        picks: Array.from({ length: totalPicks }, (_, index) =>
          persistedPick(index + 1, `complete-player-${index + 1}`, {
            timestamp: "2026-06-01T12:00:00.000Z",
          })
        ),
        currentPick: totalPicks + 1,
        currentRound: VALID_SETTINGS.rounds + 1,
        isActive: true,
        endTime: "2026-06-01T14:00:00.000Z",
      })
    );

    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks).toHaveLength(totalPicks);
    expect(result.current.draftState.currentPick).toBe(totalPicks + 1);
    expect(result.current.draftState.currentRound).toBe(VALID_SETTINGS.rounds);
    expect(result.current.draftState.isActive).toBe(false);
  });

  it("still drops a corrupt blob and starts clean", async () => {
    localStorage.setItem(FANTASY_DRAFT_STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useDraftState());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.draftState.picks).toEqual([]);
    expect(result.current.draftState.undoHistory).toEqual([]);
  });

  it("rejects duplicate player picks at the state boundary", async () => {
    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const player = {
      id: "duplicate-player",
      name: "Duplicate Player",
      team: "SF",
      position: "RB" as const,
      rank: 1,
      averageRank: 1,
      standardDeviation: 0,
      tier: 1,
    };

    act(() => {
      result.current.startDraft();
      result.current.draftPlayer(player);
      result.current.draftPlayer(player);
    });

    expect(result.current.draftState.picks).toHaveLength(1);
    expect(result.current.draftState.currentPick).toBe(2);
  });

  it("uses renamed teams in the on-clock label", async () => {
    const { result } = renderHook(() => useDraftState());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => result.current.setTeamName(1, "Fourth and Long"));

    expect(result.current.currentTeamName).toBe("Fourth and Long (you)");
  });

  it("keeps working in memory when localStorage reads are blocked", async () => {
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    try {
      const { result } = renderHook(() => useDraftState());
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      expect(result.current.persistenceError).toMatch(/blocking local saves/i);
      expect(result.current.draftState.picks).toEqual([]);
    } finally {
      getItem.mockRestore();
    }
  });
});
