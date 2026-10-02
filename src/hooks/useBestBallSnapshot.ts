"use client";

import { useCallback, useEffect, useState } from "react";
import {
  normalizeBestBallSnapshot,
  type BestBallSnapshot,
} from "@/lib/bestBallSnapshot";

let cachedSnapshot: BestBallSnapshot | null = null;
let inflightRequest: Promise<BestBallSnapshot> | null = null;

async function loadBestBallSnapshot(): Promise<BestBallSnapshot> {
  if (cachedSnapshot) return cachedSnapshot;
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    try {
      // No version parameter and no cache mode. The only revision the site
      // generates belongs to the redraft boards, and force-cache never asks
      // how old a stored copy is, so the response's cache headers decide.
      const response = await fetch("/data/fantasy/best-ball.json", {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new Error(`Best ball snapshot fetch failed (${response.status}).`);
      }
      cachedSnapshot = normalizeBestBallSnapshot(await response.json());
      return cachedSnapshot;
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

export function useBestBallSnapshot() {
  const [snapshot, setSnapshot] = useState<BestBallSnapshot | null>(cachedSnapshot);
  const [isLoading, setIsLoading] = useState(cachedSnapshot === null);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    cachedSnapshot = null;
    inflightRequest = null;
    setSnapshot(null);
    setIsLoading(true);
    setError(null);
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadBestBallSnapshot()
      .then((nextSnapshot) => {
        if (!cancelled) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot(null);
          setError("Best ball rankings are unavailable right now.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestVersion]);

  return { snapshot, isLoading, error, retry };
}
