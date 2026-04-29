"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  applyWineDraft,
  calculateWineSummary,
  createWineEntry,
  DEFAULT_WINE_FILTERS,
  filterAndSortWines,
  loadWineEntries,
  parseWineEntries,
  saveWineEntries,
  WINE_CELLAR_STORAGE_KEY,
  type WineDraft,
  type WineFilters,
} from "@/lib/wineCellar";
import type { WineEntry } from "@/types/wine";

const wineCellarListeners = new Set<() => void>();

function emitWineCellarChange() {
  wineCellarListeners.forEach((listener) => listener());
}

function subscribeWineCellarChange(listener: () => void) {
  wineCellarListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === WINE_CELLAR_STORAGE_KEY) {
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    wineCellarListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getWineCellarSnapshot() {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(WINE_CELLAR_STORAGE_KEY) ?? "[]";
}

export function useWineCellar() {
  const storedSnapshot = useSyncExternalStore(
    subscribeWineCellarChange,
    getWineCellarSnapshot,
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
    const current = loadWineEntries();
    const next = updater(current);
    saveWineEntries(next);
    emitWineCellarChange();
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
