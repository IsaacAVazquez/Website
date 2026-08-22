import {
  addFantasyCompanionPick,
  createFantasyCompanionState,
  createRedraftRoomConfig,
  parseFantasyCompanionState,
  serializeFantasyCompanionState,
  undoFantasyCompanionPick,
} from "@/lib/fantasyCompanion";
import type { Player } from "@/types";

const first: Player = {
  id: "first",
  name: "First Player",
  team: "BUF",
  position: "QB",
  averageRank: 10,
  adp: 11.2,
};
const second: Player = {
  id: "second",
  name: "Second Player",
  team: "SF",
  position: "WR",
  averageRank: 15,
};

function persistedState() {
  const room = createRedraftRoomConfig({ season: 2026, teams: 10, userTeam: 3 });
  let state = createFantasyCompanionState(room, new Date("2026-08-12T09:00:00.000Z"));
  for (const [player, time] of [
    [first, "2026-08-12T09:01:00.000Z"],
    [second, "2026-08-12T09:02:00.000Z"],
  ] as const) {
    const result = addFantasyCompanionPick(state, player, new Date(time));
    if (!result.ok) throw new Error("test setup failed");
    state = result.state;
  }
  return { room, state };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("fantasy companion persistence", () => {
  it("round-trips a validated state and enforces an expected room", () => {
    const { room, state } = persistedState();
    const raw = serializeFantasyCompanionState(state);
    expect(parseFantasyCompanionState(raw, room)).toEqual(state);
    expect(
      parseFantasyCompanionState(
        raw,
        createRedraftRoomConfig({ season: 2026, teams: 12, userTeam: 3 })
      )
    ).toBeNull();
  });

  it("round-trips an empty state after undoing its only pick", () => {
    const room = createRedraftRoomConfig({ season: 2026 });
    const empty = createFantasyCompanionState(room, new Date("2026-08-12T09:00:00.000Z"));
    const added = addFantasyCompanionPick(
      empty,
      first,
      new Date("2026-08-12T09:01:00.000Z")
    );
    if (!added.ok) throw new Error("test setup failed");
    const undone = undoFantasyCompanionPick(
      added.state,
      new Date("2026-08-12T09:02:00.000Z")
    );
    expect(parseFantasyCompanionState(serializeFantasyCompanionState(undone), room))
      .toEqual(undone);
  });

  it("rejects malformed JSON, schema drift, invalid dates, and invalid rooms", () => {
    expect(parseFantasyCompanionState("{")).toBeNull();
    expect(parseFantasyCompanionState(null)).toBeNull();
    const { state } = persistedState();
    expect(parseFantasyCompanionState(JSON.stringify({ ...state, schemaVersion: 99 })))
      .toBeNull();
    expect(parseFantasyCompanionState(JSON.stringify({ ...state, updatedAt: "yesterday" })))
      .toBeNull();
    expect(
      parseFantasyCompanionState(JSON.stringify({
        ...state,
        room: { ...state.room, teams: 1 },
      }))
    ).toBeNull();
  });

  it("rejects gaps, wrong order, duplicate players, and incompatible positions", () => {
    const { state } = persistedState();
    const base = JSON.parse(serializeFantasyCompanionState(state));

    const gap = clone(base);
    gap.picks[1].pickNumber = 3;
    expect(parseFantasyCompanionState(JSON.stringify(gap))).toBeNull();

    const wrongTeam = clone(base);
    wrongTeam.picks[1].teamNumber = 7;
    expect(parseFantasyCompanionState(JSON.stringify(wrongTeam))).toBeNull();

    const duplicate = clone(base);
    duplicate.picks[1].player = duplicate.picks[0].player;
    expect(parseFantasyCompanionState(JSON.stringify(duplicate))).toBeNull();

    const reversedTime = clone(base);
    reversedTime.picks[1].draftedAt = "2026-08-12T08:59:00.000Z";
    expect(parseFantasyCompanionState(JSON.stringify(reversedTime))).toBeNull();

    const incompatible = clone(base);
    incompatible.room = {
      kind: "best-ball",
      season: 2026,
      teams: 12,
      rounds: 18,
      userTeam: 1,
      draftOrder: "snake",
      contestId: "bbm-vii",
      scoring: "HALF_PPR",
    };
    incompatible.picks = [{
      pickNumber: 1,
      round: 1,
      teamNumber: 1,
      player: { ...first, position: "K" },
      draftedAt: "2026-08-12T09:01:00.000Z",
    }];
    incompatible.startedAt = incompatible.picks[0].draftedAt;
    expect(parseFantasyCompanionState(JSON.stringify(incompatible))).toBeNull();
  });

  it("throws when asked to serialize an invalid in-memory shape", () => {
    const room = createRedraftRoomConfig({ season: 2026 });
    const invalid = {
      ...createFantasyCompanionState(room),
      updatedAt: "invalid",
    };
    expect(() => serializeFantasyCompanionState(invalid)).toThrow(TypeError);
  });
});
