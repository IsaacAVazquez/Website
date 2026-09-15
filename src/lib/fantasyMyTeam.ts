import { normalizeFantasyRouteScoring, type FantasyRouteScoring } from "@/lib/fantasy";
import { DEFAULT_REDRAFT_LINEUP, normalizeRedraftLineup } from "@/lib/redraftLineup";
import type { FantasyWeeklyBoard, FantasyWeeklyPlayer } from "@/lib/fantasyWeeklySnapshot";
import type { RedraftLineupSettings } from "@/types";

export interface MyTeamPlayer {
  id: string;
  name: string;
  team: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
  byeWeek?: number;
}

export interface FantasyMyTeam {
  version: 1;
  season: number;
  scoring: FantasyRouteScoring;
  leagueSize: number;
  lineup: RedraftLineupSettings;
  players: MyTeamPlayer[];
  availableIds: string[];
}

export const getMyTeamStorageKey = (season: number) => `fantasy-my-team-v1-${season}`;
export const emptyMyTeam = (season: number): FantasyMyTeam => ({
  version: 1, season, scoring: "ppr", leagueSize: 12,
  lineup: { ...DEFAULT_REDRAFT_LINEUP }, players: [], availableIds: [],
});

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readMyTeamPlayer(value: unknown): MyTeamPlayer | null {
  if (!record(value) || typeof value.id !== "string" || !value.id.trim() ||
      typeof value.name !== "string" || !value.name.trim() ||
      !["QB", "RB", "WR", "TE", "K", "DST"].includes(String(value.position))) return null;
  return {
    id: value.id.slice(0, 100), name: value.name.trim().slice(0, 100),
    team: typeof value.team === "string" ? value.team.slice(0, 20) : "",
    position: value.position as MyTeamPlayer["position"],
    ...(Number.isInteger(value.byeWeek) && Number(value.byeWeek) >= 1 && Number(value.byeWeek) <= 18
      ? { byeWeek: Number(value.byeWeek) } : {}),
  };
}

export function uniqueTeamPlayers(players: MyTeamPlayer[]): MyTeamPlayer[] {
  return Array.from(new Map(players.map(player => [player.id, player])).values()).slice(0, 50);
}

export function parseMyTeam(raw: string | null, season: number): FantasyMyTeam {
  const fallback = emptyMyTeam(season);
  try {
    const data: unknown = JSON.parse(raw ?? "null");
    if (!record(data) || data.version !== 1 || data.season !== season) return fallback;
    const players = uniqueTeamPlayers(Array.isArray(data.players)
      ? data.players.map(readMyTeamPlayer).filter((p): p is MyTeamPlayer => p !== null) : []);
    return {
      ...fallback, players,
      scoring: normalizeFantasyRouteScoring(typeof data.scoring === "string" ? data.scoring : null),
      leagueSize: [8, 10, 12, 14, 16].includes(Number(data.leagueSize)) ? Number(data.leagueSize) : 12,
      lineup: normalizeRedraftLineup(record(data.lineup) ? data.lineup : undefined),
      availableIds: Array.isArray(data.availableIds)
        ? Array.from(new Set(data.availableIds.filter((id): id is string =>
          typeof id === "string" && id.length > 0 && id.length <= 100 && !players.some(p => p.id === id)))).slice(0, 1000) : [],
    };
  } catch { return fallback; }
}

/** The key selects the season. Read only actual picks for the user's redraft team. */
export function importMyTeamDraft(raw: string | null): {
  players: MyTeamPlayer[]; leagueSize: number; scoring: FantasyRouteScoring; lineup: RedraftLineupSettings;
} | null {
  try {
    const data: unknown = JSON.parse(raw ?? "null");
    if (!record(data) || !record(data.settings) || !Array.isArray(data.picks)) return null;
    const settings = data.settings;
    if (!Number.isInteger(settings.userTeam) || ![8, 10, 12, 14, 16].includes(Number(settings.totalTeams)) ||
        Number(settings.userTeam) < 1 || Number(settings.userTeam) > Number(settings.totalTeams)) return null;
    const players = uniqueTeamPlayers(data.picks.flatMap(pick => {
      if (!record(pick) || pick.teamNumber !== settings.userTeam) return [];
      const player = readMyTeamPlayer(pick.player);
      return player ? [player] : [];
    }));
    if (!players.length) return null;
    return { players, leagueSize: Number(settings.totalTeams),
      scoring: settings.scoringFormat === "HALF_PPR" ? "half_ppr" : settings.scoringFormat === "STANDARD" ? "standard" : "ppr",
      lineup: normalizeRedraftLineup(record(settings.lineup) ? settings.lineup : undefined) };
  } catch { return null; }
}

export function weeklyPlayerMap(board: FantasyWeeklyBoard): Map<string, FantasyWeeklyPlayer> {
  return new Map([...board.flex, ...board.quarterbacks].map(player => [player.id, player]));
}

export interface WeeklyLineupSlot { slot: string; player: MyTeamPlayer | null; rank: number | null }

/** Fill required positions first, then flex. Ranks are only ordered inside their source board. */
export function buildMyTeamLineup(team: FantasyMyTeam, board: FantasyWeeklyBoard): WeeklyLineupSlot[] {
  const weekly = weeklyPlayerMap(board);
  const used = new Set<string>();
  const slots: WeeklyLineupSlot[] = [];
  for (const position of ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"] as const) {
    const candidates = team.players.filter(player => !used.has(player.id) &&
      (position === "FLEX" ? ["RB", "WR", "TE"].includes(player.position) : player.position === position) &&
      weekly.has(player.id)).sort((a, b) => weekly.get(a.id)!.rank - weekly.get(b.id)!.rank || a.id.localeCompare(b.id));
    for (let index = 0; index < team.lineup[position]; index++) {
      const player = candidates[index] ?? null;
      if (player) used.add(player.id);
      slots.push({ slot: `${position} ${index + 1}`, player, rank: player ? weekly.get(player.id)!.rank : null });
    }
  }
  return slots;
}

export function compareMyTeamWaiver(team: FantasyMyTeam, board: FantasyWeeklyBoard, add: MyTeamPlayer, dropId: string) {
  const before = buildMyTeamLineup(team, board);
  const after = buildMyTeamLineup({ ...team, players: [...team.players.filter(p => p.id !== dropId), add] }, board);
  const weekly = weeklyPlayerMap(board);
  const drop = team.players.find(p => p.id === dropId);
  const addRank = weekly.get(add.id)?.rank;
  const dropRank = drop ? weekly.get(drop.id)?.rank : undefined;
  const sameBoard = drop && (add.position === "QB") === (drop.position === "QB") &&
    !["K", "DST"].includes(add.position) && !["K", "DST"].includes(drop.position);
  return { before, after,
    startingSlot: after.find(slot => slot.player?.id === add.id)?.slot ?? null,
    rankGain: sameBoard && addRank !== undefined && dropRank !== undefined ? dropRank - addRank : null,
    missing: team.players.filter(p => !weekly.has(p.id)),
    newGaps: after.filter(slot => !slot.player && before.some(previous => previous.slot === slot.slot && previous.player)),
  };
}
