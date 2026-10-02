import type { Player } from "@/types";
import { isPlayerEligibleForRoom } from "./state";
import type { FantasyCompanionDraftState } from "./types";

function dedupeById(players: readonly Player[]): Player[] {
  const seen = new Set<string>();
  const result: Player[] = [];
  for (const player of players) {
    if (seen.has(player.id)) continue;
    seen.add(player.id);
    result.push(player);
  }
  return result;
}

/** Returns eligible players whose stable snapshot id has not been drafted. */
export function getAvailablePlayers(
  players: readonly Player[],
  state: FantasyCompanionDraftState
): Player[] {
  const draftedIds = new Set(state.picks.map((pick) => pick.player.id));
  return dedupeById(
    players.filter(
      (player) => !draftedIds.has(player.id) && isPlayerEligibleForRoom(player, state.room)
    )
  );
}
