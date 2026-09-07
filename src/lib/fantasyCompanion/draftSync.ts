import { normalizeAdpPlayerName, normalizeAdpTeam } from "@/lib/fantasyAdpMatcher";
import type { Player } from "@/types";
import { addFantasyCompanionPick } from "./state";
import type { FantasyCompanionDraftState } from "./types";

export type FantasyDraftSyncProvider = "espn" | "sleeper" | "underdog";

export interface FantasyDraftObservedPick {
  pickNumber: number;
  name: string;
  position?: string;
  team?: string;
}

export interface FantasyDraftSyncMessage {
  type: "FANTASY_DRAFT_SYNC";
  provider: FantasyDraftSyncProvider;
  picks: FantasyDraftObservedPick[];
  observedAt: string;
}

export type FantasyDraftSyncResult =
  | {
      status: "updated";
      state: FantasyCompanionDraftState;
      added: number;
    }
  | {
      status: "unchanged" | "behind";
      state: FantasyCompanionDraftState;
      added: 0;
    }
  | {
      status: "ambiguous" | "conflict" | "invalid";
      state: FantasyCompanionDraftState;
      added: 0;
      pickNumber: number;
      reason: string;
    };

/** One hostname rule for every surface that has to name the open draft room. */
export function detectFantasyDraftProvider(
  hostname: string
): FantasyDraftSyncProvider | null {
  const normalized = hostname.toLowerCase();
  if (normalized === "fantasy.espn.com" || normalized.endsWith(".espn.com")) {
    return "espn";
  }
  if (normalized === "sleeper.com" || normalized.endsWith(".sleeper.com")) {
    return "sleeper";
  }
  if (normalized === "app.underdogsports.com") return "underdog";
  return null;
}

function normalizePosition(value: string | undefined): string {
  return (value ?? "").toUpperCase().replace("D/ST", "DST").replace("DEF", "DST");
}

function abbreviatedNameMatches(playerName: string, observedName: string): boolean {
  const playerTokens = normalizeAdpPlayerName(playerName).split(" ").filter(Boolean);
  const observedTokens = normalizeAdpPlayerName(observedName).split(" ").filter(Boolean);
  if (playerTokens.length === 0 || observedTokens.length < 2) return false;

  const [observedFirst, ...observedSurname] = observedTokens;
  if (observedFirst.length !== 1 || playerTokens[0][0] !== observedFirst) return false;
  const playerSurname = playerTokens.slice(-observedSurname.length);
  return playerSurname.join(" ") === observedSurname.join(" ");
}

function resolveByDraftPosition(
  candidates: readonly Player[],
  pickNumber: number
): Player | null {
  const ranked = candidates
    .filter((player) => Number.isFinite(player.adp))
    .map((player) => ({
      player,
      distance: Math.abs(Number(player.adp) - pickNumber),
    }))
    .sort((left, right) => left.distance - right.distance);

  if (ranked.length !== candidates.length || ranked.length < 2) return null;
  const [closest, nextClosest] = ranked;
  if (closest.distance > 24 || nextClosest.distance - closest.distance < 20) {
    return null;
  }
  return closest.player;
}

export function findFantasyDraftSyncPlayer(
  observed: FantasyDraftObservedPick,
  players: readonly Player[],
  excludedPlayerIds: ReadonlySet<string> = new Set()
): Player | null {
  const observedName = normalizeAdpPlayerName(observed.name);
  const position = normalizePosition(observed.position);
  const team = normalizeAdpTeam(observed.team);
  const eligible = players.filter((player) => {
    if (excludedPlayerIds.has(player.id)) return false;
    if (position && normalizePosition(player.position) !== position) return false;
    const playerName = normalizeAdpPlayerName(player.name);
    return (
      playerName === observedName ||
      abbreviatedNameMatches(player.name, observed.name) ||
      // Providers label a defense by nickname ("Texans D/ST") while the
      // snapshot carries the full team name ("Houston Texans").
      (position === "DST" && playerName.endsWith(` ${observedName}`))
    );
  });

  if (eligible.length === 1) return eligible[0];
  if (team) {
    const teamMatches = eligible.filter(
      (player) => normalizeAdpTeam(player.team) === team
    );
    if (teamMatches.length === 1) return teamMatches[0];
    if (teamMatches.length > 1) {
      return resolveByDraftPosition(teamMatches, observed.pickNumber);
    }
    if (position === "DST") {
      // A team fields one defense, so team plus position is already unique.
      const byTeam = players.filter(
        (player) =>
          !excludedPlayerIds.has(player.id) &&
          normalizePosition(player.position) === "DST" &&
          normalizeAdpTeam(player.team) === team
      );
      if (byTeam.length === 1) return byTeam[0];
    }
  }
  return resolveByDraftPosition(eligible, observed.pickNumber);
}

export function isFantasyDraftSyncMessage(
  value: unknown
): value is FantasyDraftSyncMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<FantasyDraftSyncMessage>;
  return (
    message.type === "FANTASY_DRAFT_SYNC" &&
    (message.provider === "espn" ||
      message.provider === "sleeper" ||
      message.provider === "underdog") &&
    typeof message.observedAt === "string" &&
    Array.isArray(message.picks) &&
    message.picks.every(
      (pick) =>
        pick &&
        Number.isInteger(pick.pickNumber) &&
        pick.pickNumber > 0 &&
        typeof pick.name === "string" &&
        pick.name.trim().length > 0
    )
  );
}

/**
 * Appends provider picks the companion has not recorded yet. The observed
 * log may be a trailing window (a virtualized pick list only mounts recent
 * cells), so it only has to be contiguous and overlap or abut what the
 * companion already holds. An empty observation reports "behind" when the
 * companion has picks, never "synced".
 */
export function reconcileFantasyDraftSync(
  state: FantasyCompanionDraftState,
  observedPicks: readonly FantasyDraftObservedPick[],
  players: readonly Player[],
  now: Date = new Date()
): FantasyDraftSyncResult {
  const totalPicks = state.room.teams * state.room.rounds;
  const ordered = [...observedPicks]
    .filter((pick) => pick.pickNumber <= totalPicks)
    .sort((left, right) => left.pickNumber - right.pickNumber);

  const offset = ordered.length > 0 ? ordered[0].pickNumber - 1 : 0;
  if (offset > state.picks.length) {
    return {
      status: "invalid",
      state,
      added: 0,
      pickNumber: state.picks.length + 1,
      reason: `The provider draft log is missing pick ${state.picks.length + 1}.`,
    };
  }

  const matched: Player[] = [];
  const usedPlayerIds = new Set(
    state.picks.slice(0, offset).map((pick) => pick.player.id)
  );
  for (let index = 0; index < ordered.length; index += 1) {
    const observed = ordered[index];
    const expectedPickNumber = offset + index + 1;
    if (observed.pickNumber !== expectedPickNumber) {
      return {
        status: "invalid",
        state,
        added: 0,
        pickNumber: expectedPickNumber,
        reason: `The provider draft log is missing pick ${expectedPickNumber}.`,
      };
    }
    const player = findFantasyDraftSyncPlayer(observed, players, usedPlayerIds);
    if (!player) {
      return {
        status: "ambiguous",
        state,
        added: 0,
        pickNumber: observed.pickNumber,
        reason: `${observed.name} could not be matched to exactly one player.`,
      };
    }
    matched.push(player);
    usedPlayerIds.add(player.id);
  }

  const observedThrough = offset + matched.length;
  const sharedLength = Math.min(state.picks.length, observedThrough);
  for (let index = offset; index < sharedLength; index += 1) {
    if (state.picks[index].player.id !== matched[index - offset].id) {
      return {
        status: "conflict",
        state,
        added: 0,
        pickNumber: index + 1,
        reason: `The provider and companion have different players at pick ${index + 1}.`,
      };
    }
  }

  if (observedThrough < state.picks.length) {
    return { status: "behind", state, added: 0 };
  }
  if (observedThrough === state.picks.length) {
    return { status: "unchanged", state, added: 0 };
  }

  let nextState = state;
  for (const player of matched.slice(state.picks.length - offset)) {
    const result = addFantasyCompanionPick(nextState, player, now);
    if (!result.ok) {
      return {
        status: "invalid",
        state,
        added: 0,
        pickNumber: nextState.picks.length + 1,
        reason: `The provider pick could not be recorded because ${result.reason.replaceAll("-", " ")}.`,
      };
    }
    nextState = result.state;
  }

  return {
    status: "updated",
    state: nextState,
    added: nextState.picks.length - state.picks.length,
  };
}
