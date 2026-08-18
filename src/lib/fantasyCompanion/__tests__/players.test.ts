import {
  addFantasyCompanionPick,
  createFantasyCompanionState,
  createRedraftRoomConfig,
  getAvailablePlayerIds,
  getAvailablePlayers,
  matchAvailablePlayer,
  searchAvailablePlayers,
} from "@/lib/fantasyCompanion";
import type { Player, Position } from "@/types";

function player(
  id: string,
  name: string,
  team: string,
  position: Position,
  averageRank: number
): Player {
  return { id, name, team, position, averageRank };
}

const players: Player[] = [
  player("one", "Brian Thomas Jr.", "JAC", "WR", 12),
  player("two", "Josh Allen", "BUF", "QB", 25),
  player("three", "Josh Allen", "JAX", "RB", 300),
  player("four", "Washington Commanders", "WSH", "DST", 160),
  player("five", "Marvin Harrison Jr.", "ARI", "WR", 20),
  player("one", "Duplicate source row", "JAX", "WR", 999),
];

describe("fantasy companion available-player helpers", () => {
  it("filters drafted and ineligible players, preserving the first stable id", () => {
    const room = createRedraftRoomConfig({ season: 2026 });
    let state = createFantasyCompanionState(room);
    const drafted = addFantasyCompanionPick(state, players[1]);
    if (!drafted.ok) throw new Error("test setup failed");
    state = drafted.state;

    expect(getAvailablePlayers(players, state).map((entry) => entry.id)).toEqual([
      "one",
      "three",
      "four",
      "five",
    ]);
    expect([...getAvailablePlayerIds(players, state)]).toEqual([
      "one",
      "three",
      "four",
      "five",
    ]);
  });

  it("searches normalized names, team aliases, and positions without fuzzy spelling", () => {
    const state = createFantasyCompanionState(createRedraftRoomConfig({ season: 2026 }));
    expect(searchAvailablePlayers(players, state, "Brian Thomas").map((entry) => entry.id))
      .toEqual(["one"]);
    expect(searchAvailablePlayers(players, state, "JAX WR").map((entry) => entry.id))
      .toEqual(["one"]);
    expect(searchAvailablePlayers(players, state, "Bryan Tomas")).toEqual([]);
    expect(searchAvailablePlayers(players, state, "", 2).map((entry) => entry.id))
      .toEqual(["one", "five"]);
  });
});

describe("strict player matching", () => {
  const state = createFantasyCompanionState(createRedraftRoomConfig({ season: 2026 }));

  it("prefers a stable exact id", () => {
    expect(matchAvailablePlayer({ id: "five", name: "wrong" }, players, state)).toEqual({
      status: "matched",
      player: players[4],
      matchedBy: "id",
    });
  });

  it("normalizes suffixes and current team aliases", () => {
    expect(
      matchAvailablePlayer(
        { name: "Brian Thomas", team: "JAX", position: "WR" },
        players,
        state
      )
    ).toEqual({ status: "matched", player: players[0], matchedBy: "name-team-position" });
  });

  it("keeps unresolved exact-name collisions ambiguous", () => {
    const collisionPlayers = [
      player("a", "Chris Smith", "ATL", "WR", 100),
      player("b", "Chris Smith", "DAL", "WR", 101),
    ];
    expect(matchAvailablePlayer({ name: "Chris Smith", position: "WR" }, collisionPlayers, state))
      .toEqual({ status: "ambiguous", candidates: collisionPlayers });
    expect(matchAvailablePlayer({ name: "Cris Smith" }, collisionPlayers, state))
      .toEqual({ status: "not-found" });
  });

  it("matches DST by exact canonical team and position", () => {
    expect(matchAvailablePlayer({ team: "WAS", position: "DST" }, players, state)).toEqual({
      status: "matched",
      player: players[3],
      matchedBy: "team-position",
    });
  });
});
