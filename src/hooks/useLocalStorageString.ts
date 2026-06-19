"use client";

import { useSyncExternalStore } from "react";

/**
 * Low-level glue for reading a single localStorage key reactively, shared by the
 * fantasy queue / notes / compare hooks. The browser `storage` event only fires
 * in *other* tabs, so same-tab writes notify through an explicit
 * `emitLocalStoreChange` call — the same module-level listener pattern as
 * `useWineCellar`, generalized to any key.
 */

const listenersByKey = new Map<string, Set<() => void>>();
let storageBound = false;

function ensureStorageListener() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      // A full clear() — wake every subscriber.
      listenersByKey.forEach((set) => set.forEach((listener) => listener()));
      return;
    }
    listenersByKey.get(event.key)?.forEach((listener) => listener());
  });
}

/** Notify same-tab subscribers after a write (cross-tab is handled by `storage`). */
export function emitLocalStoreChange(key: string) {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void) {
  ensureStorageListener();
  let set = listenersByKey.get(key);
  if (!set) {
    set = new Set();
    listenersByKey.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

export function useLocalStorageString(key: string, serverFallback = ""): string {
  return useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => {
      if (typeof window === "undefined") return serverFallback;
      try {
        return window.localStorage.getItem(key) ?? serverFallback;
      } catch {
        return serverFallback;
      }
    },
    () => serverFallback,
  );
}
