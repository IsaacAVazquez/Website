"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UserMuseumState, UserVisit } from "@/types/museum";
import {
  readValidatedBrowserStorage,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";
import { isLocalDateKey } from "@/lib/date-formatters";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";

const STORAGE_KEY = "museum_log_user_state_v1";

const EMPTY_STATE: UserMuseumState = {
  visited: [],
  watchlist: [],
  liked: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function decodeIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function decodeVisit(value: unknown): UserVisit | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value.museumId !== "string" ||
    value.museumId.trim().length === 0 ||
    !isLocalDateKey(value.date) ||
    typeof value.rating !== "number" ||
    !Number.isFinite(value.rating) ||
    value.rating < 0 ||
    value.rating > 5
  ) {
    return undefined;
  }
  return {
    museumId: value.museumId.trim(),
    date: value.date,
    rating: value.rating,
    ...(typeof value.note === "string" && value.note.trim()
      ? { note: value.note.trim() }
      : {}),
  };
}

function decodeMuseumState(value: unknown): UserMuseumState | undefined {
  if (!isRecord(value)) return undefined;
  const visitsByMuseum = new Map<string, UserVisit>();
  if (Array.isArray(value.visited)) {
    for (const entry of value.visited) {
      const visit = decodeVisit(entry);
      if (visit) visitsByMuseum.set(visit.museumId, visit);
    }
  }
  return {
    visited: Array.from(visitsByMuseum.values()).sort((a, b) => b.date.localeCompare(a.date)),
    watchlist: decodeIdList(value.watchlist),
    liked: decodeIdList(value.liked),
  };
}

function safeRead(): UserMuseumState {
  return readValidatedBrowserStorage(STORAGE_KEY, decodeMuseumState, () => ({
    visited: [],
    watchlist: [],
    liked: [],
  })).value;
}

function safeWrite(state: UserMuseumState): void {
  writeBrowserStorageJson(STORAGE_KEY, state);
}

export function useMuseumLog() {
  const persistenceStatus = useLocalStoragePersistenceStatus(STORAGE_KEY);
  const [state, setState] = useState<UserMuseumState>(EMPTY_STATE);
  const stateRef = useRef<UserMuseumState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = safeRead();
    stateRef.current = stored;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(stored);
    setHydrated(true);
  }, []);

  const update = useCallback((mutator: (prev: UserMuseumState) => UserMuseumState) => {
    const next = mutator(stateRef.current);
    stateRef.current = next;
    safeWrite(next);
    setState(next);
  }, []);

  const isWatchlisted = useCallback(
    (museumId: string) => state.watchlist.includes(museumId),
    [state.watchlist],
  );
  const isLiked = useCallback(
    (museumId: string) => state.liked.includes(museumId),
    [state.liked],
  );
  const findVisit = useCallback(
    (museumId: string): UserVisit | undefined =>
      state.visited.find((v) => v.museumId === museumId),
    [state.visited],
  );

  const toggleWatchlist = useCallback(
    (museumId: string) => {
      update((prev) => {
        const exists = prev.watchlist.includes(museumId);
        return {
          ...prev,
          watchlist: exists
            ? prev.watchlist.filter((id) => id !== museumId)
            : [...prev.watchlist, museumId],
        };
      });
    },
    [update],
  );

  const toggleLiked = useCallback(
    (museumId: string) => {
      update((prev) => {
        const exists = prev.liked.includes(museumId);
        return {
          ...prev,
          liked: exists ? prev.liked.filter((id) => id !== museumId) : [...prev.liked, museumId],
        };
      });
    },
    [update],
  );

  const logVisit = useCallback(
    (visit: UserVisit) => {
      update((prev) => {
        const filtered = prev.visited.filter((v) => v.museumId !== visit.museumId);
        return {
          ...prev,
          visited: [...filtered, visit].sort((a, b) => b.date.localeCompare(a.date)),
          // logging a visit clears the watchlist intent — same as Letterboxd
          watchlist: prev.watchlist.filter((id) => id !== visit.museumId),
        };
      });
    },
    [update],
  );

  const removeVisit = useCallback(
    (museumId: string) => {
      update((prev) => ({
        ...prev,
        visited: prev.visited.filter((v) => v.museumId !== museumId),
      }));
    },
    [update],
  );

  const reset = useCallback(() => {
    update(() => EMPTY_STATE);
  }, [update]);

  return {
    state,
    hydrated,
    persistenceStatus,
    isWatchlisted,
    isLiked,
    findVisit,
    toggleWatchlist,
    toggleLiked,
    logVisit,
    removeVisit,
    reset,
  };
}
