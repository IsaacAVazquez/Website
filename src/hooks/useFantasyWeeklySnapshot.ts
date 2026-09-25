"use client";

import { useCallback, useEffect, useState } from "react";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import {
  normalizeFantasyWeeklySnapshot,
  type FantasyWeeklySeed,
  type FantasyWeeklySnapshot,
} from "@/lib/fantasyWeeklySnapshot";

/**
 * Client entry point for the in-season weekly board.
 *
 * A missing snapshot is a state rather than a failure. The builder refuses to
 * publish before Week 1, so between now and kickoff the file legitimately does
 * not exist, and a 404 here means "not in season yet" rather than "broken".
 * Callers get `notPublished` for that and `error` only for a real fault.
 */

type WeeklyLoadResult =
  | { kind: "snapshot"; snapshot: FantasyWeeklySnapshot }
  | { kind: "not-published" };

let cachedResult: WeeklyLoadResult | null = null;
let inflightRequest: Promise<WeeklyLoadResult> | null = null;

async function loadWeeklySnapshot(): Promise<WeeklyLoadResult> {
  if (cachedResult) return cachedResult;
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(
        `/data/fantasy/weekly.json?v=${fantasySnapshotRevision}`,
        { cache: "force-cache", signal: controller.signal }
      );
      if (response.status === 404) {
        cachedResult = { kind: "not-published" };
        return cachedResult;
      }
      if (!response.ok) {
        throw new Error(`Weekly board fetch failed (${response.status}).`);
      }
      cachedResult = {
        kind: "snapshot",
        snapshot: normalizeFantasyWeeklySnapshot(await response.json()),
      };
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
  inflightRequest = null;
}

/**
 * `seed` is the server's copy of one scoring format (see loadFantasyWeeklySeed),
 * which puts the first rows in the HTML. The full file is still fetched for
 * the other formats, and a full result from earlier in the session wins.
 */
export function useFantasyWeeklySnapshot(seed: FantasyWeeklySeed | null = null) {
  const [snapshot, setSnapshot] = useState<FantasyWeeklySeed | null>(
    cachedResult?.kind === "snapshot" ? cachedResult.snapshot : seed
  );
  const [notPublished, setNotPublished] = useState(cachedResult?.kind === "not-published");
  const [isLoading, setIsLoading] = useState(cachedResult === null && seed === null);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    cachedResult = null;
    inflightRequest = null;
    setSnapshot(null);
    setNotPublished(false);
    setIsLoading(true);
    setError(null);
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadWeeklySnapshot()
      .then((result) => {
        if (cancelled) return;
        setNotPublished(result.kind === "not-published");
        setSnapshot(result.kind === "snapshot" ? result.snapshot : null);
      })
      .catch(() => {
        if (!cancelled) {
          // A seeded board still holds for its own format, so keep it; the
          // client shows the error only where a board is missing.
          if (!seed) setSnapshot(null);
          setError("The weekly board is unavailable right now.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestVersion, seed]);

  return { snapshot, notPublished, isLoading, error, retry };
}
