"use client";

import { useCallback, useMemo } from "react";

import {
  FANTASY_COMPARE_LIMIT,
  FANTASY_COMPARE_STORAGE_KEY,
  loadIdList,
  parseIdList,
  saveIdList,
  toggleIdCapped,
} from "@/lib/fantasyLocal";
import { emitLocalStoreChange, useLocalStoragePersistenceStatus, useLocalStorageString } from "@/hooks/useLocalStorageString";

/**
 * The compare tray: up to three player ids pinned for a side-by-side look.
 * Browser-local and shared across surfaces like the queue.
 */
export function useCompareTray() {
  const raw = useLocalStorageString(FANTASY_COMPARE_STORAGE_KEY, "[]");
  const persistenceStatus = useLocalStoragePersistenceStatus(FANTASY_COMPARE_STORAGE_KEY);
  const compareIds = useMemo(() => parseIdList(raw).slice(0, FANTASY_COMPARE_LIMIT), [raw]);
  const compareSet = useMemo(() => new Set(compareIds), [compareIds]);

  const commit = useCallback((updater: (current: string[]) => string[]) => {
    const next = updater(loadIdList(FANTASY_COMPARE_STORAGE_KEY)).slice(0, FANTASY_COMPARE_LIMIT);
    saveIdList(FANTASY_COMPARE_STORAGE_KEY, next);
    emitLocalStoreChange(FANTASY_COMPARE_STORAGE_KEY);
  }, []);

  const inCompare = useCallback((id: string) => compareSet.has(id), [compareSet]);
  const isFull = compareIds.length >= FANTASY_COMPARE_LIMIT;

  const toggle = useCallback(
    (id: string) => commit((current) => toggleIdCapped(current, id, FANTASY_COMPARE_LIMIT)),
    [commit],
  );

  const remove = useCallback(
    (id: string) => commit((current) => current.filter((entry) => entry !== id)),
    [commit],
  );

  const clear = useCallback(() => commit(() => []), [commit]);

  return { compareIds, compareSet, inCompare, isFull, limit: FANTASY_COMPARE_LIMIT, toggle, remove, clear, persistenceStatus };
}
