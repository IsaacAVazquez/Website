import {
  addFantasyCompanionPick,
  createBestBallRoomConfig,
  createFantasyCompanionState,
  createRedraftRoomConfig,
  getCurrentPickNumber,
  getCurrentTeamNumber,
  getDraftRoundForPick,
  getDraftTeamForPick,
  getTeamPicks,
  isFantasyCompanionDraftComplete,
  resetFantasyCompanionDraft,
  undoFantasyCompanionPick,
} from "@/lib/fantasyCompanion";
import type { Player, Position } from "@/types";

function player(id: string, position: Position = "WR"): Player {
  return {
    id,
    name: `Player ${id}`,
    team: "SF",
    position,
    averageRank: Number(id.replace(/\D/g, "")) || 1,
  };
}

describe("fantasy companion room config", () => {
  it("creates typed redraft and preset-backed best-ball rooms", () => {
    expect(
      createRedraftRoomConfig({
        season: 2026,
        teams: 10,
        rounds: 16,
        userTeam: 4,
        draftType: "linear",
        scoring: "HALF_PPR",
        lineup: { WR: 3, K: 0, DST: 0 },
      })
    ).toEqual({
      kind: "redraft",
      season: 2026,
      teams: 10,
      rounds: 16,
      userTeam: 4,
      draftOrder: "linear",
      scoring: "HALF_PPR",
      lineup: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 0, DST: 0 },
    });

    expect(createBestBallRoomConfig({ season: 2026, contestId: "puppy", userTeam: 7 }))
      .toMatchObject({
        kind: "best-ball",
        season: 2026,
        contestId: "puppy",
        teams: 12,
        rounds: 18,
        userTeam: 7,
        draftOrder: "snake",
        scoring: "HALF_PPR",
      });
  });

  it("rejects invalid and conflicting room inputs", () => {
    expect(() => createRedraftRoomConfig({ season: 2026, teams: 1 })).toThrow(RangeError);
    expect(() =>
      createRedraftRoomConfig({ season: 2026, draftOrder: "snake", draftType: "linear" })
    ).toThrow("cannot disagree");
    expect(() =>
      createBestBallRoomConfig({ season: 2026, contestId: "bbm-vii", userTeam: 13 })
    ).toThrow(RangeError);
  });
});

describe("fantasy companion draft state", () => {
  it("calculates snake and linear teams across round turns", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((pick) => getDraftTeamForPick(pick, 4)))
      .toEqual([1, 2, 3, 4, 4, 3, 2, 1]);
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((pick) => getDraftTeamForPick(pick, 4, "linear")))
      .toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
    expect(getDraftRoundForPick(9, 4)).toBe(3);
    expect(() => getDraftTeamForPick(0, 4)).toThrow(RangeError);
  });

  it("records only contiguous picks and derives the current team", () => {
    const room = createRedraftRoomConfig({ season: 2026, teams: 4, rounds: 2 });
    let state = createFantasyCompanionState(room, new Date("2026-08-12T10:00:00.000Z"));

    for (let index = 1; index <= 5; index += 1) {
      const result = addFantasyCompanionPick(
        state,
        player(String(index)),
        new Date(`2026-08-12T10:0${index}:00.000Z`)
      );
      expect(result.ok).toBe(true);
      if (result.ok) state = result.state;
    }

    expect(state.picks.map(({ pickNumber, round, teamNumber }) => ({
      pickNumber,
      round,
      teamNumber,
    }))).toEqual([
      { pickNumber: 1, round: 1, teamNumber: 1 },
      { pickNumber: 2, round: 1, teamNumber: 2 },
      { pickNumber: 3, round: 1, teamNumber: 3 },
      { pickNumber: 4, round: 1, teamNumber: 4 },
      { pickNumber: 5, round: 2, teamNumber: 4 },
    ]);
    expect(getCurrentPickNumber(state)).toBe(6);
    expect(getCurrentTeamNumber(state)).toBe(3);
    expect(getTeamPicks(state, 4).map((pick) => pick.pickNumber)).toEqual([4, 5]);
  });

  it("rejects duplicate, ineligible, invalid, and post-completion picks", () => {
    const room = createBestBallRoomConfig({ season: 2026, contestId: "bbm-vii" });
    let state = createFantasyCompanionState(room);
    const first = addFantasyCompanionPick(state, player("one", "WR"));
    expect(first.ok).toBe(true);
    if (first.ok) state = first.state;

    expect(addFantasyCompanionPick(state, player("one", "WR"))).toMatchObject({
      ok: false,
      reason: "duplicate-player",
      state,
    });
    expect(addFantasyCompanionPick(state, player("kicker", "K"))).toMatchObject({
      ok: false,
      reason: "ineligible-position",
    });
    expect(addFantasyCompanionPick(state, { ...player("bad"), averageRank: 0 })).toMatchObject({
      ok: false,
      reason: "invalid-player",
    });

    const shortRoom = createRedraftRoomConfig({ season: 2026, teams: 2, rounds: 1 });
    let complete = createFantasyCompanionState(shortRoom);
    for (const id of ["1", "2"]) {
      const result = addFantasyCompanionPick(complete, player(id));
      if (result.ok) complete = result.state;
    }
    expect(isFantasyCompanionDraftComplete(complete)).toBe(true);
    expect(getCurrentTeamNumber(complete)).toBeNull();
    expect(addFantasyCompanionPick(complete, player("3"))).toMatchObject({
      ok: false,
      reason: "draft-complete",
    });
  });

  it("undoes the last pick and resets the room without changing config", () => {
    const room = createRedraftRoomConfig({ season: 2026 });
    const empty = createFantasyCompanionState(room);
    expect(undoFantasyCompanionPick(empty)).toBe(empty);

    const added = addFantasyCompanionPick(
      empty,
      player("1"),
      new Date("2026-08-12T10:01:00.000Z")
    );
    if (!added.ok) throw new Error("test setup failed");
    const undone = undoFantasyCompanionPick(
      added.state,
      new Date("2026-08-12T10:02:00.000Z")
    );
    expect(undone.picks).toEqual([]);
    expect(undone.startedAt).toBeNull();

    const reset = resetFantasyCompanionDraft(
      added.state,
      new Date("2026-08-12T10:03:00.000Z")
    );
    expect(reset).toMatchObject({
      room,
      picks: [],
      startedAt: null,
      updatedAt: "2026-08-12T10:03:00.000Z",
    });
  });
});
