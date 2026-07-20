/**
 * Browser-local stores shared by the fantasy rankings board and the draft
 * assistant. Both surfaces read the same FantasyPros snapshot, so a player id
 * is stable across them — which lets a single watchlist, a single notes map,
 * and a single compare tray power both pages at once.
 *
 * The storage glue mirrors `src/lib/wineCellar.ts`: pure parse/serialize plus
 * best-effort read/write here, with the React `useSyncExternalStore` wiring in
 * the matching hooks. Keeping the list math pure makes it unit-testable without
 * a DOM.
 */

import { readBrowserStorageString, writeBrowserStorageString } from "@/lib/browserStorage";

export const FANTASY_QUEUE_STORAGE_KEY = "fantasy-player-queue-v1";
export const FANTASY_NOTES_STORAGE_KEY = "fantasy-player-notes-v1";
export const FANTASY_COMPARE_STORAGE_KEY = "fantasy-compare-v1";

/** A player can sit in the compare tray alongside at most two others. */
export const FANTASY_COMPARE_LIMIT = 3;
/** Notes stay short on purpose — a draft-day reminder, not an essay. */
export const FANTASY_NOTE_MAX_LENGTH = 280;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

/**
 * Parses a persisted ordered id list (queue or compare tray). Tolerates any
 * malformed payload by returning an empty list, and de-duplicates while
 * preserving first-seen order so a corrupted write can never wedge the UI.
 */
export function parseIdList(raw: string | null | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!isStringArray(parsed)) return [];
    return dedupe(parsed);
  } catch {
    return [];
  }
}

/**
 * Parses the persisted notes map (player id → note). Drops any entry whose
 * value is not a string and trims notes to the max length.
 */
export function parseNotes(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const result: Record<string, string> = {};
    for (const [id, note] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof note === "string" && note.trim().length > 0) {
        result[id] = note.slice(0, FANTASY_NOTE_MAX_LENGTH);
      }
    }
    return result;
  } catch {
    return {};
  }
}

function dedupe(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

/** Adds the id if absent, removes it if present. Returns a new array. */
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
}

/**
 * Toggles an id within a capped list (used by the compare tray). Adding when
 * the list is already full is a no-op so the cap is never exceeded.
 */
export function toggleIdCapped(ids: string[], id: string, limit: number): string[] {
  if (ids.includes(id)) {
    return ids.filter((entry) => entry !== id);
  }
  if (ids.length >= limit) {
    return ids;
  }
  return [...ids, id];
}

/**
 * Moves the item at `from` to `to`, clamping both indices into range. Returns
 * the original array reference when the move is a no-op so callers can skip a
 * write.
 */
export function reorderIds(ids: string[], from: number, to: number): string[] {
  if (from === to) return ids;
  if (from < 0 || from >= ids.length) return ids;

  const next = [...ids];
  const [moved] = next.splice(from, 1);
  const target = Math.max(0, Math.min(to, next.length));
  next.splice(target, 0, moved);
  return next;
}

/** Sets or clears a single note, trimming to the max length. Returns a new map. */
export function setNoteEntry(
  notes: Record<string, string>,
  id: string,
  text: string,
): Record<string, string> {
  const trimmed = text.trim().slice(0, FANTASY_NOTE_MAX_LENGTH);
  const next = { ...notes };
  if (trimmed.length === 0) {
    delete next[id];
  } else {
    next[id] = trimmed;
  }
  return next;
}

function readRaw(key: string): string | null {
  return readBrowserStorageString(key).value;
}

function writeRaw(key: string, value: string): void {
  // Mirror the value in memory before attempting localStorage so the current
  // tab remains usable when durable browser storage is blocked or full.
  writeBrowserStorageString(key, value);
}

export function loadIdList(key: string): string[] {
  return parseIdList(readRaw(key));
}

export function saveIdList(key: string, ids: string[]): void {
  writeRaw(key, JSON.stringify(ids));
}

export function loadNotes(): Record<string, string> {
  return parseNotes(readRaw(FANTASY_NOTES_STORAGE_KEY));
}

export function saveNotes(notes: Record<string, string>): void {
  writeRaw(FANTASY_NOTES_STORAGE_KEY, JSON.stringify(notes));
}
