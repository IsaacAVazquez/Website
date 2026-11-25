"use client";

import { useMemo, useState } from "react";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import {
  applyWineDraft,
  calculateWineSummary,
  createWineEntry,
  DEFAULT_WINE_FILTERS,
  filterAndSortWines,
  parseWineEntries,
  WINE_CELLAR_STORAGE_KEY,
  type WineDraft,
  type WineFilters,
} from "@/lib/wineCellar";
import type { WineEntry } from "@/types/wine";

export function useWineCellar() {
  // Each edit is applied to the latest save, so another tab's write is kept.
  const { value: entries, update: commitEntries } = useBrowserRecord(
    WINE_CELLAR_STORAGE_KEY,
    parseWineEntries,
  );
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
