"use client";

// React binding for the score-pools store: pools, submissions, rivals, and
// per-fixture flags in localStorage, synced across tabs via the shared
// browser-storage helpers. All mutation goes through commit() so every
// caller reads the freshest stored value before writing.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  getBrowserStorageSnapshot,
  readValidatedBrowserStorage,
  subscribeBrowserStorage,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";
import {
  createPool,
  createRival,
  decodeScorePoolsStore,
  emptyScorePoolsStore,
  SCORE_POOLS_STORAGE_KEY,
  type ScorePoolsStore,
  type StoredManualOdds,
  type StoredManualResult,
  type StoredPool,
} from "@/lib/scorePools/persistence";
import type { ContextFlags, Scoreline } from "@/lib/scorePools";

const EMPTY_SNAPSHOT = "";

function loadStore(): ScorePoolsStore {
  return readValidatedBrowserStorage(
    SCORE_POOLS_STORAGE_KEY,
    decodeScorePoolsStore,
    emptyScorePoolsStore,
  ).value;
}

function subscribe(listener: () => void): () => void {
  return subscribeBrowserStorage(SCORE_POOLS_STORAGE_KEY, listener);
}

function getSnapshot(): string {
  return getBrowserStorageSnapshot(SCORE_POOLS_STORAGE_KEY, EMPTY_SNAPSHOT);
}

export function useScorePools() {
  const rawSnapshot = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);

  const store = useMemo(() => {
    if (rawSnapshot === EMPTY_SNAPSHOT) return emptyScorePoolsStore();
    try {
      return decodeScorePoolsStore(JSON.parse(rawSnapshot)) ?? emptyScorePoolsStore();
    } catch {
      return emptyScorePoolsStore();
    }
  }, [rawSnapshot]);

  const commit = useCallback((updater: (current: ScorePoolsStore) => ScorePoolsStore) => {
    writeBrowserStorageJson(SCORE_POOLS_STORAGE_KEY, updater(loadStore()));
  }, []);

  const updatePool = useCallback(
    (poolId: string, updater: (pool: StoredPool) => StoredPool) => {
      commit((current) => ({
        ...current,
        pools: current.pools.map((pool) => (pool.id === poolId ? updater(pool) : pool)),
      }));
    },
    [commit],
  );

  const addPool = useCallback(
    (leagueKey: string, name: string): string => {
      const pool = createPool(leagueKey, name);
      commit((current) => ({
        ...current,
        pools: [...current.pools, pool],
        activePoolId: pool.id,
      }));
      return pool.id;
    },
    [commit],
  );

  const removePool = useCallback(
    (poolId: string) => {
      commit((current) => {
        const pools = current.pools.filter((pool) => pool.id !== poolId);
        return {
          ...current,
          pools,
          activePoolId:
            current.activePoolId === poolId ? (pools[0]?.id ?? null) : current.activePoolId,
        };
      });
    },
    [commit],
  );

  const setActivePool = useCallback(
    (poolId: string) => {
      commit((current) => ({ ...current, activePoolId: poolId }));
    },
    [commit],
  );

  const setSubmission = useCallback(
    (poolId: string, fixtureId: string, score: Scoreline, submittedAt: string) => {
      updatePool(poolId, (pool) => ({
        ...pool,
        submissions: {
          ...pool.submissions,
          [fixtureId]: { score, submittedAt },
        },
      }));
    },
    [updatePool],
  );

  const setSubmissions = useCallback(
    (
      poolId: string,
      entries: Array<{ fixtureId: string; score: Scoreline }>,
      submittedAt: string,
    ) => {
      updatePool(poolId, (pool) => ({
        ...pool,
        submissions: {
          ...pool.submissions,
          ...Object.fromEntries(
            entries.map(({ fixtureId, score }) => [fixtureId, { score, submittedAt }]),
          ),
        },
      }));
    },
    [updatePool],
  );

  const clearSubmission = useCallback(
    (poolId: string, fixtureId: string) => {
      updatePool(poolId, (pool) => {
        const submissions = { ...pool.submissions };
        delete submissions[fixtureId];
        return { ...pool, submissions };
      });
    },
    [updatePool],
  );

  const setFixtureFlags = useCallback(
    (poolId: string, fixtureId: string, flags: ContextFlags | null) => {
      updatePool(poolId, (pool) => {
        const nextFlags = { ...pool.flags };
        if (flags && Object.values(flags).some(Boolean)) nextFlags[fixtureId] = flags;
        else delete nextFlags[fixtureId];
        return { ...pool, flags: nextFlags };
      });
    },
    [updatePool],
  );

  const setManualResult = useCallback(
    (poolId: string, fixtureId: string, result: StoredManualResult | null) => {
      updatePool(poolId, (pool) => {
        const manualResults = { ...pool.manualResults };
        if (result) manualResults[fixtureId] = result;
        else delete manualResults[fixtureId];
        return { ...pool, manualResults };
      });
    },
    [updatePool],
  );

  const setManualOdds = useCallback(
    (poolId: string, fixtureId: string, odds: StoredManualOdds | null) => {
      updatePool(poolId, (pool) => {
        const manualOdds = { ...pool.manualOdds };
        if (odds) manualOdds[fixtureId] = odds;
        else delete manualOdds[fixtureId];
        return { ...pool, manualOdds };
      });
    },
    [updatePool],
  );

  const addRival = useCallback(
    (poolId: string, name: string) => {
      updatePool(poolId, (pool) => ({ ...pool, rivals: [...pool.rivals, createRival(name)] }));
    },
    [updatePool],
  );

  const updateRival = useCallback(
    (
      poolId: string,
      rivalId: string,
      updater: (rival: StoredPool["rivals"][number]) => StoredPool["rivals"][number],
    ) => {
      updatePool(poolId, (pool) => ({
        ...pool,
        rivals: pool.rivals.map((rival) => (rival.id === rivalId ? updater(rival) : rival)),
      }));
    },
    [updatePool],
  );

  const removeRival = useCallback(
    (poolId: string, rivalId: string) => {
      updatePool(poolId, (pool) => ({
        ...pool,
        rivals: pool.rivals.filter((rival) => rival.id !== rivalId),
      }));
    },
    [updatePool],
  );

  const activePool = store.pools.find((pool) => pool.id === store.activePoolId) ?? null;

  return {
    store,
    pools: store.pools,
    activePool,
    addPool,
    removePool,
    setActivePool,
    updatePool,
    setSubmission,
    setSubmissions,
    clearSubmission,
    setFixtureFlags,
    setManualResult,
    setManualOdds,
    addRival,
    updateRival,
    removeRival,
  };
}
