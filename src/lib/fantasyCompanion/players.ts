import {
  normalizeAdpPlayerName,
  normalizeAdpTeam,
} from "@/lib/fantasyAdpMatcher";
import type { Player } from "@/types";
import { isPlayerEligibleForRoom } from "./state";
import type {
  FantasyCompanionDraftState,
  PlayerMatchInput,
  PlayerMatchResult,
} from "./types";

function playerBoardRank(player: Player): number {
  const candidates = [player.averageRank, player.rankEcr, player.adp, player.positionRank];
  return candidates.find((rank) => typeof rank === "number" && Number.isFinite(rank) && rank > 0)
    ?? Number.POSITIVE_INFINITY;
}

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

export function getAvailablePlayerIds(
  players: readonly Player[],
  state: FantasyCompanionDraftState
): Set<string> {
  return new Set(getAvailablePlayers(players, state).map((player) => player.id));
}

/**
 * Tokenized search only. It intentionally avoids spelling distance or guessed
 * aliases because a false match records the wrong player as drafted.
 */
export function searchAvailablePlayers(
  players: readonly Player[],
  state: FantasyCompanionDraftState,
  query: string,
  limit = 50
): Player[] {
  const available = getAvailablePlayers(players, state);
  const normalizedQuery = normalizeAdpPlayerName(query);
  const boundedLimit = Math.max(0, Math.floor(limit));
  if (!normalizedQuery) {
    return available
      .sort((left, right) => playerBoardRank(left) - playerBoardRank(right))
      .slice(0, boundedLimit);
  }

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  return available
    .map((player, sourceIndex) => {
      const name = normalizeAdpPlayerName(player.name);
      const haystack = `${name} ${normalizeAdpTeam(player.team).toLowerCase()} ${player.position.toLowerCase()}`;
      const matches = queryTokens.every((token) => haystack.includes(token));
      const matchOrder = name === normalizedQuery ? 0 : name.startsWith(normalizedQuery) ? 1 : 2;
      return { player, sourceIndex, matches, matchOrder };
    })
    .filter((entry) => entry.matches)
    .sort(
      (left, right) =>
        left.matchOrder - right.matchOrder ||
        playerBoardRank(left.player) - playerBoardRank(right.player) ||
        left.sourceIndex - right.sourceIndex
    )
    .slice(0, boundedLimit)
    .map((entry) => entry.player);
}

/**
 * Matches only exact normalized fields. A tie stays ambiguous, and a missing
 * player stays missing, so callers can ask the user instead of guessing.
 */
export function matchAvailablePlayer(
  input: PlayerMatchInput,
  players: readonly Player[],
  state: FantasyCompanionDraftState
): PlayerMatchResult {
  const available = getAvailablePlayers(players, state);
  const id = input.id?.trim();
  if (id) {
    const idMatches = available.filter((player) => player.id === id);
    if (idMatches.length === 1) {
      return { status: "matched", player: idMatches[0], matchedBy: "id" };
    }
    if (idMatches.length > 1) return { status: "ambiguous", candidates: idMatches };
  }

  const name = normalizeAdpPlayerName(input.name ?? "");
  const team = input.team === undefined ? "" : normalizeAdpTeam(input.team);
  const position = input.position;
  if (!name && !(team && position === "DST")) return { status: "not-found" };

  let candidates = available;
  if (name) {
    candidates = candidates.filter(
      (player) => normalizeAdpPlayerName(player.name) === name
    );
  }
  if (team) {
    candidates = candidates.filter(
      (player) => normalizeAdpTeam(player.team) === team
    );
  }
  if (position) {
    candidates = candidates.filter((player) => player.position === position);
  }

  if (candidates.length === 0) return { status: "not-found" };
  if (candidates.length > 1) return { status: "ambiguous", candidates };

  const matchedBy = name
    ? team && position
      ? "name-team-position"
      : team
        ? "name-team"
        : position
          ? "name-position"
          : "name"
    : "team-position";
  return { status: "matched", player: candidates[0], matchedBy };
}
