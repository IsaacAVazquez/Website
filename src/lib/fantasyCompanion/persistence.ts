import {
  fantasyCompanionRoomConfigsEqual,
  isFantasyCompanionRoomConfig,
} from "./room";
import {
  getDraftRoundForPick,
  getDraftTeamForPick,
  isFantasyCompanionPlayer,
  isPlayerEligibleForRoom,
} from "./state";
import {
  FANTASY_COMPANION_SCHEMA_VERSION,
  type FantasyCompanionDraftState,
  type FantasyCompanionPick,
  type FantasyCompanionRoomConfig,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCanonicalIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function decodePick(
  value: unknown,
  expectedPickNumber: number,
  room: FantasyCompanionRoomConfig
): FantasyCompanionPick | null {
  if (!isRecord(value) || !isFantasyCompanionPlayer(value.player)) return null;
  if (!isPlayerEligibleForRoom(value.player, room)) return null;

  const expectedRound = getDraftRoundForPick(expectedPickNumber, room.teams);
  const expectedTeam = getDraftTeamForPick(
    expectedPickNumber,
    room.teams,
    room.draftOrder
  );
  if (
    value.pickNumber !== expectedPickNumber ||
    value.round !== expectedRound ||
    value.teamNumber !== expectedTeam ||
    !isCanonicalIsoDate(value.draftedAt)
  ) {
    return null;
  }

  return {
    pickNumber: expectedPickNumber,
    round: expectedRound,
    teamNumber: expectedTeam,
    player: value.player,
    draftedAt: value.draftedAt,
  };
}

function decodeFantasyCompanionState(
  value: unknown,
  expectedRoom?: FantasyCompanionRoomConfig
): FantasyCompanionDraftState | null {
  if (!isRecord(value) || value.schemaVersion !== FANTASY_COMPANION_SCHEMA_VERSION) {
    return null;
  }
  if (!isFantasyCompanionRoomConfig(value.room)) return null;
  const room = value.room;
  if (expectedRoom && !fantasyCompanionRoomConfigsEqual(room, expectedRoom)) return null;
  if (!Array.isArray(value.picks) || !isCanonicalIsoDate(value.updatedAt)) return null;
  if (value.startedAt !== null && !isCanonicalIsoDate(value.startedAt)) return null;

  const totalPicks = room.teams * room.rounds;
  if (value.picks.length > totalPicks) return null;

  const picks: FantasyCompanionPick[] = [];
  const playerIds = new Set<string>();
  let previousDraftedAt = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < value.picks.length; index += 1) {
    const pick = decodePick(value.picks[index], index + 1, room);
    if (!pick || playerIds.has(pick.player.id)) return null;
    const draftedAt = Date.parse(pick.draftedAt);
    if (draftedAt < previousDraftedAt) return null;
    previousDraftedAt = draftedAt;
    playerIds.add(pick.player.id);
    picks.push(pick);
  }

  if (picks.length === 0 && value.startedAt !== null) return null;
  if (picks.length > 0 && value.startedAt !== picks[0].draftedAt) return null;
  if (picks.length > 0 && Date.parse(value.updatedAt) < previousDraftedAt) return null;
  if (value.startedAt !== null && Date.parse(value.updatedAt) < Date.parse(value.startedAt)) {
    return null;
  }

  return {
    schemaVersion: FANTASY_COMPANION_SCHEMA_VERSION,
    room: expectedRoom ?? room,
    picks,
    startedAt: value.startedAt,
    updatedAt: value.updatedAt,
  };
}

export function parseFantasyCompanionState(
  raw: string | null | undefined,
  expectedRoom?: FantasyCompanionRoomConfig
): FantasyCompanionDraftState | null {
  if (!raw) return null;
  try {
    return decodeFantasyCompanionState(JSON.parse(raw), expectedRoom);
  } catch {
    return null;
  }
}

export function serializeFantasyCompanionState(
  state: FantasyCompanionDraftState
): string {
  const serialized = JSON.stringify(state);
  if (!decodeFantasyCompanionState(JSON.parse(serialized))) {
    throw new TypeError("state must satisfy the fantasy companion persistence schema.");
  }
  return serialized;
}
