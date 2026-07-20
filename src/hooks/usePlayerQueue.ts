"use client";

import { useCallback, useMemo } from "react";

import {
  FANTASY_QUEUE_STORAGE_KEY,
  loadIdList,
  parseIdList,
  reorderIds,
  saveIdList,
  toggleId,
} from "@/lib/fantasyLocal";
import { emitLocalStoreChange, useLocalStoragePersistenceStatus, useLocalStorageString } from "@/hooks/useLocalStorageString";

/**
 * A single browser-local watchlist of player ids, shared by the rankings board
 * and the draft assistant (player ids are stable across both surfaces, so
 * starring a player on one page flags him on the other for free).
 */
export function usePlayerQueue() {
  const raw = useLocalStorageString(FANTASY_QUEUE_STORAGE_KEY, "[]");
  const persistenceStatus = useLocalStoragePersistenceStatus(FANTASY_QUEUE_STORAGE_KEY);
  const queue = useMemo(() => parseIdList(raw), [raw]);
  const queuedSet = useMemo(() => new Set(queue), [queue]);

  const commit = useCallback((updater: (current: string[]) => string[]) => {
    const next = updater(loadIdList(FANTASY_QUEUE_STORAGE_KEY));
    saveIdList(FANTASY_QUEUE_STORAGE_KEY, next);
    emitLocalStoreChange(FANTASY_QUEUE_STORAGE_KEY);
  }, []);

  const isQueued = useCallback((id: string) => queuedSet.has(id), [queuedSet]);

  const toggle = useCallback(
    (id: string) => commit((current) => toggleId(current, id)),
    [commit],
  );

  const remove = useCallback(
    (id: string) => commit((current) => current.filter((entry) => entry !== id)),
    [commit],
  );

  const reorder = useCallback(
    (from: number, to: number) => commit((current) => reorderIds(current, from, to)),
    [commit],
  );

  const clear = useCallback(() => commit(() => []), [commit]);

  return { queue, queuedSet, isQueued, toggle, remove, reorder, clear, persistenceStatus };
}
