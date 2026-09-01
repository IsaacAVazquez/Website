import type { Player } from "@/types";

/**
 * A small rolling history of consensus rank and ADP per player, kept by the
 * snapshot build as its own committed artifact so the published boards can
 * carry 7 and 14-day movement without adding another provider. The builder
 * appends one dated reading per run, trims the window, and stamps the derived
 * movement onto the overall board's players before the snapshot is written.
 *
 * Movement is past value minus current value, so a positive number means the
 * player moved up the board (ranked higher, or drafted earlier).
 */

export const FANTASY_RANK_HISTORY_VERSION = 1;
/** The longest movement window; the windows list below derives from it. */
export const FANTASY_RANK_HISTORY_WINDOW_DAYS = 14;
/**
 * Days of readings to keep. Three days of grace past the longest window keeps
 * a gapped refresh cadence resolvable: a 15-day-old reading still answers the
 * 14-day question when no exact 14-day-old reading exists.
 */
export const FANTASY_RANK_HISTORY_RETENTION_DAYS = FANTASY_RANK_HISTORY_WINDOW_DAYS + 3;

export interface FantasyRankHistoryReading {
  ecr?: number;
  adp?: number;
}

export interface FantasyRankHistoryDay {
  /** UTC calendar day, YYYY-MM-DD. */
  date: string;
  players: Record<string, FantasyRankHistoryReading>;
}

export interface FantasyRankHistory {
  version: typeof FANTASY_RANK_HISTORY_VERSION;
  formats: Partial<Record<string, FantasyRankHistoryDay[]>>;
}

export interface FantasyRankMovement {
  rankMove7d?: number;
  rankMove14d?: number;
  adpMove7d?: number;
  adpMove14d?: number;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function dayValue(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function createEmptyFantasyRankHistory(): FantasyRankHistory {
  return { version: FANTASY_RANK_HISTORY_VERSION, formats: {} };
}

/** Tolerant reader: a malformed file restarts the window instead of failing the build. */
export function decodeFantasyRankHistory(value: unknown): FantasyRankHistory {
  if (!isRecord(value) || value.version !== FANTASY_RANK_HISTORY_VERSION || !isRecord(value.formats)) {
    return createEmptyFantasyRankHistory();
  }
  const formats: FantasyRankHistory["formats"] = {};
  for (const [format, days] of Object.entries(value.formats)) {
    if (!Array.isArray(days)) continue;
    const decodedDays: FantasyRankHistoryDay[] = [];
    const seenDates = new Set<string>();
    for (const day of days) {
      if (!isRecord(day) || typeof day.date !== "string" || !DATE_PATTERN.test(day.date)) continue;
      if (seenDates.has(day.date) || !Number.isFinite(dayValue(day.date))) continue;
      if (!isRecord(day.players)) continue;
      const players: Record<string, FantasyRankHistoryReading> = {};
      for (const [playerId, reading] of Object.entries(day.players)) {
        if (!playerId || !isRecord(reading)) continue;
        const entry: FantasyRankHistoryReading = {};
        if (isFiniteNumber(reading.ecr)) entry.ecr = reading.ecr;
        if (isFiniteNumber(reading.adp)) entry.adp = reading.adp;
        if (entry.ecr !== undefined || entry.adp !== undefined) {
          players[playerId] = entry;
        }
      }
      decodedDays.push({ date: day.date, players });
      seenDates.add(day.date);
    }
    decodedDays.sort((left, right) => dayValue(left.date) - dayValue(right.date));
    if (decodedDays.length > 0) formats[format] = decodedDays;
  }
  return { version: FANTASY_RANK_HISTORY_VERSION, formats };
}

/**
 * Records one dated reading per player from a built overall board, replacing
 * any same-date reading (a re-run on the same day overwrites, never doubles)
 * and trimming everything older than the retention window.
 */
export function appendFantasyRankHistory(
  history: FantasyRankHistory,
  format: string,
  date: string,
  players: readonly Player[]
): FantasyRankHistory {
  if (!DATE_PATTERN.test(date) || !Number.isFinite(dayValue(date))) return history;
  const readings: Record<string, FantasyRankHistoryReading> = {};
  for (const player of players) {
    const reading: FantasyRankHistoryReading = {};
    if (isFiniteNumber(player.rankEcr)) reading.ecr = player.rankEcr;
    if (isFiniteNumber(player.adp)) reading.adp = player.adp;
    if (reading.ecr !== undefined || reading.adp !== undefined) {
      readings[player.id] = reading;
    }
  }

  const cutoff = dayValue(date) - FANTASY_RANK_HISTORY_RETENTION_DAYS * DAY_MS;
  const days = [
    ...(history.formats[format] ?? []).filter(
      (day) => day.date !== date && dayValue(day.date) >= cutoff
    ),
    { date, players: readings },
  ].sort((left, right) => dayValue(left.date) - dayValue(right.date));

  return {
    version: FANTASY_RANK_HISTORY_VERSION,
    formats: { ...history.formats, [format]: days },
  };
}

/**
 * Movement for one player against the most recent reading at least 7 and at
 * least 14 days older than the given date, within a three-day grace so a
 * gapped cadence still resolves. Past the grace the figure is omitted rather
 * than stamped from a much older reading and labeled as the window: there is
 * no interpolation and no claim beyond what was recorded.
 */
export function resolveFantasyRankMovement(
  history: FantasyRankHistory,
  format: string,
  date: string,
  playerId: string
): FantasyRankMovement {
  const days = history.formats[format] ?? [];
  const current = days.find((day) => day.date === date)?.players[playerId];
  if (!current) return {};

  const movement: FantasyRankMovement = {};
  const windows = [
    { days: 7, rankKey: "rankMove7d", adpKey: "adpMove7d" },
    { days: FANTASY_RANK_HISTORY_WINDOW_DAYS, rankKey: "rankMove14d", adpKey: "adpMove14d" },
  ] as const;
  for (const window of windows) {
    const cutoff = dayValue(date) - window.days * DAY_MS;
    const windowFloor = cutoff - 3 * DAY_MS;
    const pastDay = [...days].reverse().find((day) => {
      const value = dayValue(day.date);
      return value <= cutoff && value >= windowFloor && Boolean(day.players[playerId]);
    });
    const past = pastDay?.players[playerId];
    if (!past) continue;
    if (isFiniteNumber(past.ecr) && isFiniteNumber(current.ecr)) {
      movement[window.rankKey] = roundOne(past.ecr - current.ecr);
    }
    if (isFiniteNumber(past.adp) && isFiniteNumber(current.adp)) {
      movement[window.adpKey] = roundOne(past.adp - current.adp);
    }
  }
  return movement;
}

/** Writes derived movement onto the given players in place; boards without history stay untouched. */
export function stampFantasyRankMovement(
  players: Player[],
  history: FantasyRankHistory,
  format: string,
  date: string
): void {
  for (const player of players) {
    const movement = resolveFantasyRankMovement(history, format, date, player.id);
    if (movement.rankMove7d !== undefined) player.rankMove7d = movement.rankMove7d;
    if (movement.rankMove14d !== undefined) player.rankMove14d = movement.rankMove14d;
    if (movement.adpMove7d !== undefined) player.adpMove7d = movement.adpMove7d;
    if (movement.adpMove14d !== undefined) player.adpMove14d = movement.adpMove14d;
  }
}
