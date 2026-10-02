import {
  addFantasyCompanionPick,
  createFantasyCompanionState,
  createRedraftRoomConfig,
  getAvailablePlayers,
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
  });
});
