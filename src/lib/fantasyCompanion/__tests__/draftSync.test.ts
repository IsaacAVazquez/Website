import type { Player } from "@/types";
import {
  addFantasyCompanionPick,
  createFantasyCompanionState,
  createRedraftRoomConfig,
  findFantasyDraftSyncPlayer,
  reconcileFantasyDraftSync,
} from "@/lib/fantasyCompanion";

function player(
  id: string,
  name: string,
  position: Player["position"],
  team: string,
  averageRank: number,
  adp?: number
): Player {
  return { id, name, position, team, averageRank, adp };
}

const PLAYERS = [
  player("gibbs", "Jahmyr Gibbs", "RB", "DET", 1),
  player("bijan", "Bijan Robinson", "RB", "ATL", 2),
  player("amon-ra", "Amon-Ra St. Brown", "WR", "DET", 3),
  player("aj-brown", "A.J. Brown", "WR", "NE", 4),
];

describe("fantasy draft pick sync", () => {
  it("matches provider abbreviations and appends a contiguous room log", () => {
    const state = createFantasyCompanionState(
      createRedraftRoomConfig({ season: 2026, teams: 2, rounds: 2 }),
      new Date("2026-09-01T10:00:00.000Z")
    );
    const result = reconcileFantasyDraftSync(
      state,
      [
        { pickNumber: 1, name: "J. Gibbs", position: "RB", team: "DET" },
        { pickNumber: 2, name: "B. Robinson", position: "RB", team: "ATL" },
        { pickNumber: 3, name: "A. St. Brown", position: "WR", team: "DET" },
      ],
      PLAYERS,
      new Date("2026-09-01T10:03:00.000Z")
    );

    expect(result.status).toBe("updated");
    expect(result.state.picks.map((pick) => pick.player.id)).toEqual([
      "gibbs",
      "bijan",
      "amon-ra",
    ]);
    expect(result.state.picks.map((pick) => pick.teamNumber)).toEqual([1, 2, 2]);
  });

  it("keeps a matching manual prefix and adds only new provider picks", () => {
    const empty = createFantasyCompanionState(
      createRedraftRoomConfig({ season: 2026, teams: 2, rounds: 2 })
    );
    const first = addFantasyCompanionPick(empty, PLAYERS[0]);
    if (!first.ok) throw new Error("test setup failed");

    const result = reconcileFantasyDraftSync(
      first.state,
      [
        { pickNumber: 1, name: "J. Gibbs", position: "RB", team: "DET" },
        { pickNumber: 2, name: "B. Robinson", position: "RB", team: "ATL" },
      ],
      PLAYERS
    );

    expect(result).toMatchObject({ status: "updated", added: 1 });
    expect(result.state.picks.map((pick) => pick.player.id)).toEqual(["gibbs", "bijan"]);
  });

  it("pauses when the provider conflicts with a manual pick", () => {
    const empty = createFantasyCompanionState(
      createRedraftRoomConfig({ season: 2026, teams: 2, rounds: 2 })
    );
    const first = addFantasyCompanionPick(empty, PLAYERS[1]);
    if (!first.ok) throw new Error("test setup failed");

    const result = reconcileFantasyDraftSync(
      first.state,
      [{ pickNumber: 1, name: "J. Gibbs", position: "RB", team: "DET" }],
      PLAYERS
    );

    expect(result).toMatchObject({ status: "conflict", pickNumber: 1, state: first.state });
  });

  it("uses team and position to resolve short names and rejects a gap", () => {
    const moores = [
      player("dj", "D.J. Moore", "WR", "BUF", 10),
      player("david", "David Moore", "WR", "CAR", 90),
    ];
    expect(
      findFantasyDraftSyncPlayer(
        { pickNumber: 1, name: "D. Moore", position: "WR", team: "BUF" },
        moores
      )?.id
    ).toBe("dj");

    const state = createFantasyCompanionState(
      createRedraftRoomConfig({ season: 2026, teams: 2, rounds: 2 })
    );
    expect(
      reconcileFantasyDraftSync(
        state,
        [{ pickNumber: 2, name: "J. Gibbs", position: "RB", team: "DET" }],
        PLAYERS
      )
    ).toMatchObject({ status: "invalid", pickNumber: 1 });
  });

  it("uses a clearly separated ADP only when provider abbreviations still collide", () => {
    const robinsons = [
      player("bijan", "Bijan Robinson", "RB", "ATL", 2, 2),
      player("brian", "Brian Robinson Jr.", "RB", "ATL", 154, 183.6),
    ];
    expect(
      findFantasyDraftSyncPlayer(
        { pickNumber: 2, name: "B. Robinson", position: "RB", team: "ATL" },
        robinsons
      )?.id
    ).toBe("bijan");

    const closeRobinsons = [
      player("one", "Brandon Robinson", "RB", "ATL", 50, 48),
      player("two", "Bryce Robinson", "RB", "ATL", 55, 56),
    ];
    expect(
      findFantasyDraftSyncPlayer(
        { pickNumber: 52, name: "B. Robinson", position: "RB", team: "ATL" },
        closeRobinsons
      )
    ).toBeNull();
  });

  it("matches a defense by nickname or by team and position", () => {
    const defenses = [
      player("hou", "Houston Texans", "DST", "HOU", 120),
      player("den", "Denver Broncos", "DST", "DEN", 121),
    ];
    expect(
      findFantasyDraftSyncPlayer(
        { pickNumber: 97, name: "Texans", position: "DST", team: "HOU" },
        defenses
      )?.id
    ).toBe("hou");
    expect(
      findFantasyDraftSyncPlayer(
        { pickNumber: 98, name: "Denver", position: "D/ST", team: "DEN" },
        defenses
      )?.id
    ).toBe("den");
  });

  it("accepts a trailing window of the provider log and reports an empty read as behind", () => {
    const empty = createFantasyCompanionState(
      createRedraftRoomConfig({ season: 2026, teams: 2, rounds: 2 })
    );
    const first = addFantasyCompanionPick(empty, PLAYERS[0]);
    const second = first.ok ? addFantasyCompanionPick(first.state, PLAYERS[1]) : first;
    if (!second.ok) throw new Error("test setup failed");

    const windowed = reconcileFantasyDraftSync(
      second.state,
      [
        { pickNumber: 2, name: "B. Robinson", position: "RB", team: "ATL" },
        { pickNumber: 3, name: "A. St. Brown", position: "WR", team: "DET" },
      ],
      PLAYERS
    );
    expect(windowed.status).toBe("updated");
    expect(windowed.state.picks.map((pick) => pick.player.id)).toEqual([
      "gibbs",
      "bijan",
      "amon-ra",
    ]);

    expect(
      reconcileFantasyDraftSync(
        second.state,
        [{ pickNumber: 4, name: "A.J. Brown", position: "WR", team: "NE" }],
        PLAYERS
      )
    ).toMatchObject({ status: "invalid", pickNumber: 3 });

    expect(reconcileFantasyDraftSync(second.state, [], PLAYERS).status).toBe("behind");
    expect(reconcileFantasyDraftSync(empty, [], PLAYERS).status).toBe("unchanged");
  });
});
