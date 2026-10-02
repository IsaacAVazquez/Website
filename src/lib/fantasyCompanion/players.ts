import type { Player } from "@/types";
import { isPlayerEligibleForRoom } from "./state";
import type { FantasyCompanionDraftState } from "./types";

/** Returns eligible players whose stable snapshot id has not been drafted, first copy of each id. */
export function getAvailablePlayers(
  players: readonly Player[],
  state: FantasyCompanionDraftState
): Player[] {
  const draftedIds = new Set(state.picks.map((pick) => pick.player.id));
  const seen = new Set<string>();
  return players.filter((player) => {
    if (
      draftedIds.has(player.id) ||
      seen.has(player.id) ||
      !isPlayerEligibleForRoom(player, state.room)
    ) {
      return false;
    }
    seen.add(player.id);
    return true;
  });
}
