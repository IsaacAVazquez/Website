"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserMuseumState, UserVisit } from "@/types/museum";

const STORAGE_KEY = "museum_log_user_state_v1";

const EMPTY_STATE: UserMuseumState = {
  visited: [],
  watchlist: [],
  liked: [],
};

function safeRead(): UserMuseumState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<UserMuseumState>;
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function safeWrite(state: UserMuseumState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private mode — fail silently and keep working in memory.
  }
}

export function useMuseumLog() {
  const [state, setState] = useState<UserMuseumState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(safeRead());
    setHydrated(true);
  }, []);

  const update = useCallback((mutator: (prev: UserMuseumState) => UserMuseumState) => {
    setState((prev) => {
      const next = mutator(prev);
      safeWrite(next);
      return next;
    });
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
