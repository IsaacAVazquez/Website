"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FANTASY_SNAPSHOT_SCHEMA_VERSION,
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
}

const snapshotCache = new Map<FantasyRouteScoring, FantasySnapshot>();
const inflightSnapshotRequests = new Map<FantasyRouteScoring, Promise<FantasySnapshot>>();

export function resetFantasySnapshotCacheForTests() {
  snapshotCache.clear();
  inflightSnapshotRequests.clear();
}

function cacheNormalizedFantasySnapshot(
  scoring: FantasyRouteScoring,
  snapshot: FantasySnapshot | unknown
): FantasySnapshot {
  const normalizedSnapshot = normalizeFantasySnapshot(snapshot, scoring);
  snapshotCache.set(scoring, normalizedSnapshot);
  return normalizedSnapshot;
}

async function loadFantasySnapshot(scoring: FantasyRouteScoring): Promise<FantasySnapshot> {
  const cachedSnapshot = snapshotCache.get(scoring);
  if (cachedSnapshot) {
    return cacheNormalizedFantasySnapshot(scoring, cachedSnapshot);
  }

  const inflightRequest = inflightSnapshotRequests.get(scoring);
  if (inflightRequest) {
    return inflightRequest;
  }

  const request = fetch(`/data/fantasy/${scoring}.json?v=${FANTASY_SNAPSHOT_SCHEMA_VERSION}`, {
    cache: "force-cache",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Fantasy rankings are unavailable right now.");
      }

      return cacheNormalizedFantasySnapshot(scoring, await response.json());
    })
    .finally(() => {
      inflightSnapshotRequests.delete(scoring);
    });

  inflightSnapshotRequests.set(scoring, request);
  return request;
}

export function useFantasySnapshot({
  position = "overall",
  scoring,
  all = false,
}: UseFantasySnapshotOptions): UseFantasySnapshotResult {
  const [snapshot, setSnapshot] = useState<FantasySnapshot | null>(() => {
    const cachedSnapshot = snapshotCache.get(scoring);
    return cachedSnapshot ? cacheNormalizedFantasySnapshot(scoring, cachedSnapshot) : null;
  });
  const [isLoading, setIsLoading] = useState(snapshotCache.get(scoring) === undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      const cachedSnapshot = snapshotCache.get(scoring);
      if (cachedSnapshot) {
        setSnapshot(cacheNormalizedFantasySnapshot(scoring, cachedSnapshot));
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
  }, [scoring]);

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
      scoringFormat: snapshot.scoringFormat,
      source: snapshot.source,
      position: all ? "all" : position,
      playerCount: players.length,
      slice,
      slices: snapshot.sliceMetadata,
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
  };
}
