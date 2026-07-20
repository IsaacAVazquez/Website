"use client";

import { useCallback, useMemo } from "react";

import {
  FANTASY_NOTE_MAX_LENGTH,
  FANTASY_NOTES_STORAGE_KEY,
  loadNotes,
  parseNotes,
  saveNotes,
  setNoteEntry,
} from "@/lib/fantasyLocal";
import { emitLocalStoreChange, useLocalStoragePersistenceStatus, useLocalStorageString } from "@/hooks/useLocalStorageString";

/**
 * Short, browser-local notes keyed by player id ("handcuff for Hall", "avoid",
 * "target round 6"). Shared by the rankings board and the draft assistant.
 */
export function usePlayerNotes() {
  const raw = useLocalStorageString(FANTASY_NOTES_STORAGE_KEY, "{}");
  const persistenceStatus = useLocalStoragePersistenceStatus(FANTASY_NOTES_STORAGE_KEY);
  const notes = useMemo(() => parseNotes(raw), [raw]);
  const notedIds = useMemo(() => new Set(Object.keys(notes)), [notes]);

  const getNote = useCallback((id: string) => notes[id] ?? "", [notes]);
  const hasNote = useCallback((id: string) => notedIds.has(id), [notedIds]);

  const setNote = useCallback((id: string, text: string) => {
    const next = setNoteEntry(loadNotes(), id, text);
    saveNotes(next);
    emitLocalStoreChange(FANTASY_NOTES_STORAGE_KEY);
  }, []);

  return { notes, notedIds, getNote, hasNote, setNote, maxLength: FANTASY_NOTE_MAX_LENGTH, persistenceStatus };
}
