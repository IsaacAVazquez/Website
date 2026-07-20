"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  getBrowserStorageSnapshot,
  subscribeBrowserStorage,
} from "@/lib/browserStorage";
import {
  applyWineDraft,
  calculateWineSummary,
  createWineEntry,
  DEFAULT_WINE_FILTERS,
  filterAndSortWines,
  parseWineEntries,
  saveWineEntries,
  WINE_CELLAR_STORAGE_KEY,
  type WineDraft,
  type WineFilters,
} from "@/lib/wineCellar";
import type { WineEntry } from "@/types/wine";

export function useWineCellar() {
  const storedSnapshot = useSyncExternalStore(
    (listener) => subscribeBrowserStorage(WINE_CELLAR_STORAGE_KEY, listener),
    () => getBrowserStorageSnapshot(WINE_CELLAR_STORAGE_KEY, "[]"),
    () => "[]"
  );

  const entries = useMemo(() => parseWineEntries(storedSnapshot), [storedSnapshot]);
  const [filters, setFilters] = useState<WineFilters>(DEFAULT_WINE_FILTERS);

  const summary = useMemo(() => calculateWineSummary(entries), [entries]);
  const visibleEntries = useMemo(
    () => filterAndSortWines(entries, filters),
    [entries, filters]
  );

  function updateFilters(updater: (filters: WineFilters) => WineFilters) {
    setFilters((current) => updater(current));
  }

  function resetFilters() {
    setFilters(DEFAULT_WINE_FILTERS);
  }

  function commitEntries(updater: (current: WineEntry[]) => WineEntry[]) {
    // `entries` reflects the current shared-store snapshot; saveWineEntries
    // writes through the guarded store, which notifies subscribers itself.
    const next = updater(entries);
    saveWineEntries(next);
  }

  function addEntry(draft: WineDraft) {
    commitEntries((current) => [...current, createWineEntry(draft)]);
  }

  function updateEntry(id: string, draft: WineDraft) {
    commitEntries((current) =>
      current.map((entry) => (entry.id === id ? applyWineDraft(entry, draft) : entry))
    );
  }

  function removeEntry(id: string) {
    commitEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function findEntry(id: string): WineEntry | undefined {
    return entries.find((entry) => entry.id === id);
  }

  return {
    entries,
    visibleEntries,
    summary,
    filters,
    updateFilters,
    resetFilters,
    addEntry,
    updateEntry,
    removeEntry,
    findEntry,
  };
}
