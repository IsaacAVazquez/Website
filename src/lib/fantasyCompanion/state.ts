import type { Player } from "@/types";
import { isFantasyCompanionRoomConfig } from "./room";
import {
  FANTASY_COMPANION_SCHEMA_VERSION,
  type AddFantasyCompanionPickResult,
  type FantasyCompanionDraftOrder,
  type FantasyCompanionDraftState,
  type FantasyCompanionPick,
  type FantasyCompanionRoomConfig,
} from "./types";

const REDRAFT_POSITIONS: readonly Player["position"][] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DST",
];
const BEST_BALL_POSITIONS: readonly Player["position"][] = ["QB", "RB", "WR", "TE"];

function toIsoString(now: Date): string {
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new RangeError("now must be a valid Date.");
  return now.toISOString();
}

export function isFantasyCompanionPlayer(value: unknown): value is Player {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const player = value as Partial<Player>;
  return (
    typeof player.id === "string" &&
    player.id.trim().length > 0 &&
    typeof player.name === "string" &&
    player.name.trim().length > 0 &&
    typeof player.team === "string" &&
    REDRAFT_POSITIONS.includes(player.position as Player["position"]) &&
    typeof player.averageRank === "number" &&
    Number.isFinite(player.averageRank) &&
    player.averageRank > 0
  );
}

export function isPlayerEligibleForRoom(
  player: Player,
  room: FantasyCompanionRoomConfig
): boolean {
  const allowed = room.kind === "best-ball" ? BEST_BALL_POSITIONS : REDRAFT_POSITIONS;
  return allowed.includes(player.position);
}

/** Returns the one-indexed round for a one-indexed overall pick. */
export function getDraftRoundForPick(pickNumber: number, teams: number): number {
  if (!Number.isInteger(pickNumber) || pickNumber < 1) {
    throw new RangeError("pickNumber must be a positive integer.");
  }
  if (!Number.isInteger(teams) || teams < 2) {
    throw new RangeError("teams must be an integer of at least 2.");
  }
  return Math.floor((pickNumber - 1) / teams) + 1;
}

/** Returns the team on the clock for snake or linear draft order. */
export function getDraftTeamForPick(
  pickNumber: number,
  teams: number,
  draftOrder: FantasyCompanionDraftOrder = "snake"
): number {
  const round = getDraftRoundForPick(pickNumber, teams);
  const slot = ((pickNumber - 1) % teams) + 1;
  if (draftOrder === "linear") return slot;
  if (draftOrder !== "snake") {
    throw new RangeError('draftOrder must be either "snake" or "linear".');
  }
  return round % 2 === 1 ? slot : teams - slot + 1;
}

export function createFantasyCompanionState(
  room: FantasyCompanionRoomConfig,
  now: Date = new Date()
): FantasyCompanionDraftState {
  if (!isFantasyCompanionRoomConfig(room)) {
    throw new TypeError("room must be a valid fantasy companion room config.");
  }
  return {
    schemaVersion: FANTASY_COMPANION_SCHEMA_VERSION,
    room,
    picks: [],
    startedAt: null,
    updatedAt: toIsoString(now),
  };
}

export function getCurrentPickNumber(state: FantasyCompanionDraftState): number {
  return state.picks.length + 1;
}

export function getTotalDraftPicks(state: FantasyCompanionDraftState): number {
  return state.room.teams * state.room.rounds;
}

export function isFantasyCompanionDraftComplete(
  state: FantasyCompanionDraftState
): boolean {
  return state.picks.length >= getTotalDraftPicks(state);
}

export function getCurrentTeamNumber(state: FantasyCompanionDraftState): number | null {
  if (isFantasyCompanionDraftComplete(state)) return null;
  return getDraftTeamForPick(
    getCurrentPickNumber(state),
    state.room.teams,
    state.room.draftOrder
  );
}

export function getTeamPicks(
  state: FantasyCompanionDraftState,
  teamNumber: number
): FantasyCompanionPick[] {
  if (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > state.room.teams) {
    return [];
  }
  return state.picks.filter((pick) => pick.teamNumber === teamNumber);
}

export function addFantasyCompanionPick(
  state: FantasyCompanionDraftState,
  player: Player,
  now: Date = new Date()
): AddFantasyCompanionPickResult {
  if (isFantasyCompanionDraftComplete(state)) {
    return { ok: false, state, reason: "draft-complete" };
  }
  if (!isFantasyCompanionPlayer(player)) {
    return { ok: false, state, reason: "invalid-player" };
  }
  if (!isPlayerEligibleForRoom(player, state.room)) {
    return { ok: false, state, reason: "ineligible-position" };
  }
  if (state.picks.some((pick) => pick.player.id === player.id)) {
    return { ok: false, state, reason: "duplicate-player" };
  }

  const draftedAt = toIsoString(now);
  const pickNumber = getCurrentPickNumber(state);
  const pick: FantasyCompanionPick = {
    pickNumber,
    round: getDraftRoundForPick(pickNumber, state.room.teams),
    teamNumber: getDraftTeamForPick(
      pickNumber,
      state.room.teams,
      state.room.draftOrder
    ),
    player,
    draftedAt,
  };
  const next: FantasyCompanionDraftState = {
    ...state,
    picks: [...state.picks, pick],
    startedAt: state.startedAt ?? draftedAt,
    updatedAt: draftedAt,
  };
  return { ok: true, state: next, pick };
}

export function undoFantasyCompanionPick(
  state: FantasyCompanionDraftState,
  now: Date = new Date()
): FantasyCompanionDraftState {
  if (state.picks.length === 0) return state;
  const picks = state.picks.slice(0, -1);
  return {
    ...state,
    picks,
    startedAt: picks.length === 0 ? null : state.startedAt,
    updatedAt: toIsoString(now),
  };
}

export function resetFantasyCompanionDraft(
  state: FantasyCompanionDraftState,
  now: Date = new Date()
): FantasyCompanionDraftState {
  return {
    ...state,
    picks: [],
    startedAt: null,
    updatedAt: toIsoString(now),
  };
}
