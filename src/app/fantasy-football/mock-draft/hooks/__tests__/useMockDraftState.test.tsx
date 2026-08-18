import { act, renderHook } from "@testing-library/react";
import type { Player } from "@/types";
import {
  useMockDraftState,
  getMockDraftStorageKey,
  type MockDraftSettings,
} from "../useMockDraftState";

let nextId = 0;

function makePlayer(overrides: Partial<Player> = {}): Player {
  nextId += 1;
  return {
    id: `mock-${nextId}`,
    name: `Player ${nextId}`,
    team: "FA",
    position: "WR",
    averageRank: nextId,
    rankEcr: nextId,
    ...overrides,
  } as Player;
}

function makeBoard(): Player[] {
  nextId = 0;
  const board: Player[] = [];
  const add = (position: Player["position"], count: number, rankOf: (i: number) => number) => {
    for (let i = 0; i < count; i += 1) {
      const rank = rankOf(i);
      board.push(makePlayer({ position, rankEcr: rank, averageRank: rank }));
    }
  };
  add("RB", 45, (i) => 1 + i * 3);
  add("WR", 50, (i) => 2 + i * 3);
  add("TE", 25, (i) => 6 + i * 6);
  add("QB", 20, (i) => 12 + i * 7);
  add("K", 12, (i) => 130 + i * 3);
  add("DST", 12, (i) => 132 + i * 3);
  return board.sort((a, b) => (a.rankEcr as number) - (b.rankEcr as number));
}

const SETTINGS: MockDraftSettings = {
  totalTeams: 10,
  rounds: 15,
  userTeam: 3,
  scoringFormat: "PPR",
};

const SEED = 42;

async function flush() {
  await act(async () => {});
}

describe("useMockDraftState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("simulates opponent picks up to the user's slot when the draft starts", async () => {
    const board = makeBoard();
    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    expect(result.current.state.status).toBe("setup");

    act(() => result.current.startDraft(SETTINGS, SEED));

    expect(result.current.state.status).toBe("on-clock");
    expect(result.current.state.picks).toHaveLength(2);
    expect(result.current.currentPick).toBe(3);
    expect(result.current.availablePlayers).toHaveLength(board.length - 2);
  });

  it("applies the user's pick and simulates ahead to their next turn", async () => {
    const board = makeBoard();
    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    act(() => result.current.startDraft(SETTINGS, SEED));

    let accepted = false;
    act(() => {
      accepted = result.current.makeUserPick(result.current.availablePlayers[0]);
    });

    expect(accepted).toBe(true);
    // Snake order: slot 3 of 10 picks again at pick 18.
    expect(result.current.currentPick).toBe(18);
    expect(result.current.state.picks).toHaveLength(17);
    expect(result.current.state.status).toBe("on-clock");
    expect(result.current.state.picks[2].teamNumber).toBe(3);
  });

  it("rejects a pick of a player who is no longer available", async () => {
    const board = makeBoard();
    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    act(() => result.current.startDraft(SETTINGS, SEED));

    const alreadyDrafted = result.current.state.picks[0].player;
    let accepted = true;
    act(() => {
      accepted = result.current.makeUserPick(alreadyDrafted);
    });

    expect(accepted).toBe(false);
    expect(result.current.state.picks).toHaveLength(2);
    expect(result.current.currentPick).toBe(3);
  });

  it("runs to completion and fills every roster", async () => {
    const board = makeBoard();
    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    act(() => result.current.startDraft(SETTINGS, SEED));

    let guard = 0;
    while (result.current.state.status === "on-clock" && guard < 20) {
      guard += 1;
      act(() => {
        result.current.makeUserPick(result.current.availablePlayers[0]);
      });
    }

    expect(result.current.state.status).toBe("complete");
    expect(result.current.state.picks).toHaveLength(150);
    for (const team of result.current.teams) {
      expect(team.picks).toHaveLength(15);
      // The engine only constrains simulated teams; the user is free to draft
      // whatever they want, which is the point of a practice room.
      if (team.teamNumber !== SETTINGS.userTeam) {
        expect(team.positionCounts.K).toBe(1);
        expect(team.positionCounts.DST).toBe(1);
      }
    }
  });

  it("resumes an in-progress draft from storage", async () => {
    const board = makeBoard();
    const first = renderHook(() => useMockDraftState(board, "PPR"));
    act(() => first.result.current.startDraft(SETTINGS, SEED));
    act(() => {
      first.result.current.makeUserPick(first.result.current.availablePlayers[0]);
    });
    const savedPickIds = first.result.current.state.picks.map((p) => p.player.id);
    first.unmount();

    const second = renderHook(() => useMockDraftState(board, "PPR"));
    await flush();

    expect(second.result.current.state.status).toBe("on-clock");
    expect(second.result.current.currentPick).toBe(18);
    expect(second.result.current.state.picks.map((p) => p.player.id)).toEqual(savedPickIds);
  });

  it("defers resuming a saved room until the board scoring matches", async () => {
    const board = makeBoard();
    const saved = renderHook(() => useMockDraftState(board, "STANDARD"));
    act(() => saved.result.current.startDraft({ ...SETTINGS, scoringFormat: "STANDARD" }, SEED));
    act(() => {
      saved.result.current.makeUserPick(saved.result.current.availablePlayers[0]);
    });
    saved.unmount();

    // Same player ids, wrong scoring board: the save must not resume here.
    const { result, rerender } = renderHook(
      ({ scoring }: { scoring: "PPR" | "STANDARD" }) => useMockDraftState(board, scoring),
      { initialProps: { scoring: "PPR" as "PPR" | "STANDARD" } }
    );
    await flush();
    expect(result.current.state.status).toBe("setup");
    expect(result.current.state.picks).toHaveLength(0);

    rerender({ scoring: "STANDARD" });
    await flush();
    expect(result.current.state.status).toBe("on-clock");
    expect(result.current.state.picks).toHaveLength(17);
  });

  it("discards a saved draft whose players are missing from the board", async () => {
    const board = makeBoard();
    localStorage.setItem(
      getMockDraftStorageKey(),
      JSON.stringify({
        version: 1,
        settings: SETTINGS,
        seed: SEED,
        picks: [{ pickNumber: 1, teamNumber: 1, playerId: "ghost-1" }],
      })
    );

    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    await flush();

    expect(result.current.state.status).toBe("setup");
    expect(result.current.state.picks).toHaveLength(0);
  });

  it("resumes a zero-pick slot-one room instead of deleting it", async () => {
    const board = makeBoard();
    const first = renderHook(() => useMockDraftState(board, "PPR"));
    act(() => first.result.current.startDraft({ ...SETTINGS, userTeam: 1 }, SEED));
    expect(first.result.current.state.status).toBe("on-clock");
    expect(first.result.current.state.picks).toHaveLength(0);
    first.unmount();

    const second = renderHook(() => useMockDraftState(board, "PPR"));
    await flush();

    expect(second.result.current.state.status).toBe("on-clock");
    expect(second.result.current.state.seed).toBe(SEED);
    expect(second.result.current.state.picks).toHaveLength(0);
    expect(localStorage.getItem(getMockDraftStorageKey())).not.toBeNull();
  });

  it("resumes a board-exhausted room as complete instead of soft-locking it on-clock", async () => {
    const board = makeBoard();
    localStorage.setItem(
      getMockDraftStorageKey(),
      JSON.stringify({
        version: 1,
        status: "complete",
        settings: SETTINGS,
        seed: SEED,
        picks: board.slice(0, 5).map((player, index) => ({
          pickNumber: index + 1,
          teamNumber: (index % SETTINGS.totalTeams) + 1,
          playerId: player.id,
        })),
      })
    );

    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    await flush();

    expect(result.current.state.status).toBe("complete");
    expect(result.current.state.picks).toHaveLength(5);
  });

  it("discards a tampered save with absurd settings before allocating teams", async () => {
    const board = makeBoard();
    localStorage.setItem(
      getMockDraftStorageKey(),
      JSON.stringify({
        version: 1,
        settings: { ...SETTINGS, totalTeams: 1e8 },
        seed: SEED,
        picks: [],
      })
    );

    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    await flush();

    expect(result.current.state.status).toBe("setup");
    expect(localStorage.getItem(getMockDraftStorageKey())).toBeNull();
  });

  it("returns the user to their previous pick on undo", async () => {
    const board = makeBoard();
    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    act(() => result.current.startDraft(SETTINGS, SEED));
    act(() => {
      result.current.makeUserPick(result.current.availablePlayers[0]);
    });
    act(() => {
      result.current.makeUserPick(result.current.availablePlayers[0]);
    });
    // Snake order: slot 3 picks at 3, 18, then 23.
    expect(result.current.currentPick).toBe(23);
    const firstUserPickId = result.current.state.picks[2].player.id;

    let undone = false;
    act(() => {
      undone = result.current.undoUserPick();
    });

    expect(undone).toBe(true);
    expect(result.current.state.status).toBe("on-clock");
    expect(result.current.currentPick).toBe(18);
    expect(result.current.state.picks).toHaveLength(17);
    expect(result.current.state.picks[2].player.id).toBe(firstUserPickId);
  });

  it("clears the room back to setup on reset", async () => {
    const board = makeBoard();
    const { result } = renderHook(() => useMockDraftState(board, "PPR"));
    act(() => result.current.startDraft(SETTINGS, SEED));
    act(() => result.current.resetDraft());

    expect(result.current.state.status).toBe("setup");
    expect(result.current.state.picks).toHaveLength(0);
    expect(localStorage.getItem(getMockDraftStorageKey())).toBeNull();
  });
});
