"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  emitBrowserStorageChange,
  getBrowserStorageSnapshot,
  getBrowserStorageStatusSnapshot,
  subscribeBrowserStorage,
  type PersistenceStatus,
} from "@/lib/browserStorage";

/**
 * Low-level glue for reading a single localStorage key reactively, shared by the
 * fantasy queue / notes / compare hooks. The browser `storage` event only fires
 * in *other* tabs, so same-tab writes notify through an explicit
 * `emitLocalStoreChange` call — the same module-level listener pattern as
 * `useWineCellar`, generalized to any key.
 */

/** Notify same-tab subscribers after a write (cross-tab is handled by `storage`). */
export function emitLocalStoreChange(key: string) {
  emitBrowserStorageChange(key);
}

export function useLocalStorageString(key: string, serverFallback = ""): string {
  const subscribe = useCallback(
    (listener: () => void) => subscribeBrowserStorage(key, listener),
    [key],
  );
  return useSyncExternalStore(
    subscribe,
    () => getBrowserStorageSnapshot(key, serverFallback),
    () => serverFallback,
  );
}

/** Whether writes for this key are durable or only retained in this tab. */
export function useLocalStoragePersistenceStatus(key: string): PersistenceStatus {
  const subscribe = useCallback(
    (listener: () => void) => subscribeBrowserStorage(key, listener),
    [key],
  );
  return useSyncExternalStore(
    subscribe,
    () => getBrowserStorageStatusSnapshot(key),
    () => "persistent",
  );
}
