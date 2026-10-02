"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FANTASY_WEEKLY_SNAPSHOT_URL,
  normalizeFantasyWeeklySnapshot,
  type FantasyWeeklySeed,
  type FantasyWeeklySnapshot,
} from "@/lib/fantasyWeeklySnapshot";

// A missing file before Week 1 is a not-published state. Both that result and
// successful reads expire so an open tab can pick up the next published board.
type WeeklyLoadResult =
  | { kind: "snapshot"; snapshot: FantasyWeeklySnapshot }
  | { kind: "not-published" };

const CACHE_TTL_MS = 60 * 60 * 1000;
let cachedResult: WeeklyLoadResult | null = null;
let cachedAt = 0;
let inflightRequest: Promise<WeeklyLoadResult> | null = null;

function newestSnapshot(
  first: FantasyWeeklySeed | null,
  second: FantasyWeeklySeed | null,
): FantasyWeeklySeed | null {
  if (!first) return second;
  if (!second) return first;
  const difference =
    first.season - second.season ||
    first.week - second.week ||
    Date.parse(first.generatedAt) - Date.parse(second.generatedAt);
  // A full client board fills the other formats when its revision matches.
  return difference > 0 ? first : second;
}

function cacheIsFresh(): boolean {
  return cachedResult !== null && Date.now() - cachedAt < CACHE_TTL_MS;
}

async function loadWeeklySnapshot(seed: FantasyWeeklySeed | null): Promise<WeeklyLoadResult> {
  if (cacheIsFresh() && cachedResult) {
    if (
      !seed ||
      (cachedResult.kind === "snapshot" &&
        newestSnapshot(seed, cachedResult.snapshot) === cachedResult.snapshot)
    ) {
      return cachedResult;
    }
  }
  if (inflightRequest) return inflightRequest;

  // An expired or superseded module cache needs an HTTP revalidation too.
  // Otherwise stale-while-revalidate can return the old file immediately and
  // give it another full hour in the module cache.
  const revalidateHttpCache = cachedResult !== null;
  inflightRequest = (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(FANTASY_WEEKLY_SNAPSHOT_URL, {
        signal: controller.signal,
        ...(revalidateHttpCache ? { cache: "no-cache" as const } : {}),
      });
      if (response.status === 404) {
        cachedResult = { kind: "not-published" };
      } else {
        if (!response.ok) {
          throw new Error(`Weekly board fetch failed (${response.status}).`);
        }
        cachedResult = {
          kind: "snapshot",
          snapshot: normalizeFantasyWeeklySnapshot(await response.json()),
        };
      }
      cachedAt = Date.now();
      return cachedResult;
    } finally {
      window.clearTimeout(timer);
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

/** Test-only: forgets the module-level result so each test starts cold. */
export function resetFantasyWeeklySnapshotCacheForTests() {
  cachedResult = null;
  cachedAt = 0;
  inflightRequest = null;
}

/** The server seeds one format; a matching or newer full file fills the others. */
export function useFantasyWeeklySnapshot(seed: FantasyWeeklySeed | null = null) {
  const [loadedSnapshot, setSnapshot] = useState<FantasyWeeklySeed | null>(() =>
    cachedResult?.kind === "snapshot" ? cachedResult.snapshot : null
  );
  // Derive this on every render so a new server seed also wins on prop changes.
  const snapshot = newestSnapshot(seed, loadedSnapshot);
  const [missing, setNotPublished] = useState(cachedResult?.kind === "not-published");
  const notPublished = snapshot === null && missing;
  const [loading, setIsLoading] = useState(cachedResult === null && seed === null);
  const isLoading = snapshot === null && loading;
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    cachedResult = null;
    setNotPublished(false);
    setIsLoading(true);
    setError(null);
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadWeeklySnapshot(seed)
      .then((result) => {
        if (cancelled) return;
        setNotPublished(result.kind === "not-published");
        if (result.kind === "snapshot") {
          setSnapshot((previous) => newestSnapshot(previous, result.snapshot));
        }
        // Keep the seeded format readable, and let missing formats expose a
        // retry if the CDN has not caught up to the server's revision yet.
        const seedIsNewer = seed && (
          result.kind === "not-published" || newestSnapshot(seed, result.snapshot) === seed
        );
        setError(seedIsNewer ? "The weekly board is unavailable right now." : null);
      })
      .catch(() => {
        if (!cancelled) setError("The weekly board is unavailable right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestVersion, seed]);

  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState === "hidden" || inflightRequest || cacheIsFresh()) return;
      setRequestVersion((version) => version + 1);
    };
    const timer = window.setInterval(revalidate, 60_000);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, []);

  return { snapshot, notPublished, isLoading, error, retry };
}
