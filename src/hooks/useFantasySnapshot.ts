"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import { logger } from "@/lib/logger";
import {
  FantasyRoutePosition,
  FantasyRouteScoring,
  FantasySnapshot,
  FantasySnapshotMetadata,
  FantasySnapshotSliceMap,
  FantasySnapshotSliceMetadata,
  getFantasySliceMetadata,
  getFantasyPlayersForPosition,
  normalizeFantasySnapshot,
} from "@/lib/fantasy";
import { Player } from "@/types";

interface UseFantasySnapshotOptions {
  position?: FantasyRoutePosition;
  scoring: FantasyRouteScoring;
  all?: boolean;
}

interface UseFantasySnapshotResult {
  players: Player[];
  snapshot: FantasySnapshot | null;
  metadata: FantasySnapshotMetadata | null;
  sliceMetadata: FantasySnapshotSliceMetadata | null;
  sliceMetadataMap: FantasySnapshotSliceMap | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const snapshotCache = new Map<string, FantasySnapshot>();
const inflightSnapshotRequests = new Map<string, Promise<FantasySnapshot>>();

function getFantasySnapshotCacheKey(scoring: FantasyRouteScoring): string {
  return `${scoring}:${fantasySnapshotRevision}`;
}

export function resetFantasySnapshotCacheForTests() {
  snapshotCache.clear();
  inflightSnapshotRequests.clear();
}

function cacheNormalizedFantasySnapshot(
  scoring: FantasyRouteScoring,
  snapshot: FantasySnapshot | unknown
): FantasySnapshot {
  const normalizedSnapshot = normalizeFantasySnapshot(snapshot, scoring);
  snapshotCache.set(getFantasySnapshotCacheKey(scoring), normalizedSnapshot);
  return normalizedSnapshot;
}

// A stalled (never-settling) fetch previously hung the rankings board on its
// loading skeleton forever and kept the API fallback from ever firing. Abort
// hard so the static -> API chain always makes progress.
const STATIC_SNAPSHOT_TIMEOUT_MS = 8_000;
const API_SNAPSHOT_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStaticFantasySnapshot(scoring: FantasyRouteScoring): Promise<unknown> {
  const response = await fetchWithTimeout(
    `/data/fantasy/${scoring}.json?v=${fantasySnapshotRevision}`,
    { cache: "force-cache" },
    STATIC_SNAPSHOT_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`Static fantasy snapshot fetch failed (${response.status})`);
  }

  return response.json();
}

async function fetchApiFantasySnapshot(scoring: FantasyRouteScoring): Promise<unknown> {
  const response = await fetchWithTimeout(
    `/api/fantasy-data?scoring=${scoring}&all=true`,
    { cache: "no-store" },
    API_SNAPSHOT_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`API fantasy snapshot fetch failed (${response.status})`);
  }

  const payload = (await response.json()) as { success?: boolean; data?: unknown };
  if (!payload?.success || !payload.data) {
    throw new Error("API fantasy snapshot returned no data");
  }

  return payload.data;
}

async function loadFantasySnapshot(scoring: FantasyRouteScoring): Promise<FantasySnapshot> {
  const cacheKey = getFantasySnapshotCacheKey(scoring);
  const cachedSnapshot = snapshotCache.get(cacheKey);
  if (cachedSnapshot) {
    // The cache only ever holds normalized snapshots (the sole writer is
    // cacheNormalizedFantasySnapshot), so return the hit directly instead of
    // re-normalizing it on every read.
    return cachedSnapshot;
  }

  const inflightRequest = inflightSnapshotRequests.get(cacheKey);
  if (inflightRequest) {
    return inflightRequest;
  }

  // Try the static JSON first (cheap, CDN-cacheable). On any failure — typically
  // a missing snapshot file during a botched deploy — fall back to the API
  // route, which reads the same files server-side and so should agree on shape.
  // Only surface a user-visible error when both paths fail.
  const request = fetchStaticFantasySnapshot(scoring)
    .catch(async (staticError) => {
      try {
        return await fetchApiFantasySnapshot(scoring);
      } catch (apiError) {
        logger.warn("Fantasy snapshot static fetch failed", staticError);
        logger.warn("Fantasy snapshot API fallback failed", apiError);
        throw new Error("Fantasy rankings are unavailable right now.", { cause: apiError });
      }
    })
    .then((rawSnapshot) => cacheNormalizedFantasySnapshot(scoring, rawSnapshot))
    .finally(() => {
      inflightSnapshotRequests.delete(cacheKey);
    });

  inflightSnapshotRequests.set(cacheKey, request);
  return request;
}

export function useFantasySnapshot({
  position = "overall",
  scoring,
  all = false,
}: UseFantasySnapshotOptions): UseFantasySnapshotResult {
  const cacheKey = getFantasySnapshotCacheKey(scoring);
  const [snapshot, setSnapshot] = useState<FantasySnapshot | null>(() => {
    return snapshotCache.get(cacheKey) ?? null;
  });
  const [isLoading, setIsLoading] = useState(snapshotCache.get(cacheKey) === undefined);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = useCallback(() => {
    snapshotCache.delete(cacheKey);
    inflightSnapshotRequests.delete(cacheKey);
    setRequestVersion((version) => version + 1);
  }, [cacheKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      const cachedSnapshot = snapshotCache.get(cacheKey);
      if (cachedSnapshot) {
        setSnapshot(cachedSnapshot);
        setIsLoading(false);
        setError(null);
        return;
      }

      setSnapshot(null);
      setError(null);
      setIsLoading(true);

      try {
        const nextSnapshot = await loadFantasySnapshot(scoring);
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setSnapshot(null);
          setError(caughtError instanceof Error ? caughtError.message : "Fantasy rankings are unavailable right now.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, requestVersion, scoring]);

  const players = useMemo<Player[]>(() => {
    if (!snapshot) {
      return [];
    }

    return all ? snapshot.overall : getFantasyPlayersForPosition(snapshot, position);
  }, [all, position, snapshot]);

  const metadata = useMemo<FantasySnapshotMetadata | null>(() => {
    if (!snapshot) {
      return null;
    }

    const slice = all ? null : getFantasySliceMetadata(snapshot, position);

    return {
      season: snapshot.season,
      week: snapshot.week,
      generatedAt: snapshot.generatedAt,
      upstreamUpdatedAt: snapshot.upstreamUpdatedAt,
      scoringFormat: snapshot.scoringFormat,
      source: snapshot.source,
      position: all ? "all" : position,
      playerCount: players.length,
      slice,
      slices: snapshot.sliceMetadata,
      adpSource: snapshot.adpSource,
    };
  }, [all, players.length, position, snapshot]);

  const sliceMetadata = useMemo<FantasySnapshotSliceMetadata | null>(() => {
    if (!snapshot || all) {
      return null;
    }

    return getFantasySliceMetadata(snapshot, position);
  }, [all, position, snapshot]);

  return {
    players,
    snapshot,
    metadata,
    sliceMetadata,
    sliceMetadataMap: snapshot?.sliceMetadata ?? null,
    isLoading,
    error,
    retry,
  };
}
