"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { PersistenceStatus } from "@/lib/browserStorage";
import type { FantasyRouteScoring } from "@/lib/fantasy";
import { FANTASY_TRADE_MODEL_VERSION } from "@/lib/fantasyTrade";
import {
  createFantasyTradePersistenceState,
  getFantasyTradePersistenceSnapshot,
  getFantasyTradePersistenceStatus,
  parseFantasyTradePersistenceState,
  readFantasyTradePersistence,
  subscribeFantasyTradePersistence,
  writeFantasyTradePersistence,
  type FantasyTradePersistenceState,
} from "@/lib/fantasyTradePersistence";

interface UseFantasyTradeCalculatorResult {
  givePlayerIds: string[];
  getPlayerIds: string[];
  persistenceStatus: PersistenceStatus;
  addPlayer: (side: "give" | "get", playerId: string) => void;
  removePlayer: (side: "give" | "get", playerId: string) => void;
  swapSides: () => void;
  clear: () => void;
}

export function useFantasyTradeCalculator(
  season: number,
  scoring: FantasyRouteScoring
): UseFantasyTradeCalculatorResult {
  const context = useMemo(
    () => ({ season, scoring, modelVersion: FANTASY_TRADE_MODEL_VERSION }),
    [scoring, season]
  );
  const scope = useMemo(() => ({ season, scoring }), [scoring, season]);

  const subscribe = useCallback(
    (listener: () => void) => subscribeFantasyTradePersistence(scope, listener),
    [scope]
  );
  const rawState = useSyncExternalStore(
    subscribe,
    () => getFantasyTradePersistenceSnapshot(scope),
    () => ""
  );
  const persistenceStatus = useSyncExternalStore(
    subscribe,
    () => getFantasyTradePersistenceStatus(scope),
    (): PersistenceStatus => "persistent"
  );

  const state = useMemo(
    () =>
      parseFantasyTradePersistenceState(rawState, scope) ??
      createFantasyTradePersistenceState(context),
    [context, rawState, scope]
  );

  const commit = useCallback(
    (
      update: (
        latest: FantasyTradePersistenceState
      ) => Pick<FantasyTradePersistenceState, "givePlayerIds" | "getPlayerIds">
    ) => {
      const latest = readFantasyTradePersistence(context).state;
      writeFantasyTradePersistence(
        createFantasyTradePersistenceState(context, update(latest))
      );
    },
    [context]
  );

  const addPlayer = useCallback(
    (side: "give" | "get", playerId: string) => {
      commit((latest) => {
        const allIds = new Set([...latest.givePlayerIds, ...latest.getPlayerIds]);
        if (allIds.has(playerId)) return latest;
        return side === "give"
          ? { ...latest, givePlayerIds: [...latest.givePlayerIds, playerId] }
          : { ...latest, getPlayerIds: [...latest.getPlayerIds, playerId] };
      });
    },
    [commit]
  );

  const removePlayer = useCallback(
    (side: "give" | "get", playerId: string) => {
      commit((latest) =>
        side === "give"
          ? {
              ...latest,
              givePlayerIds: latest.givePlayerIds.filter((id) => id !== playerId),
            }
          : {
              ...latest,
              getPlayerIds: latest.getPlayerIds.filter((id) => id !== playerId),
            }
      );
    },
    [commit]
  );

  const swapSides = useCallback(() => {
    commit((latest) => ({
      givePlayerIds: latest.getPlayerIds,
      getPlayerIds: latest.givePlayerIds,
    }));
  }, [commit]);

  const clear = useCallback(() => {
    commit(() => ({ givePlayerIds: [], getPlayerIds: [] }));
  }, [commit]);

  return {
    givePlayerIds: state.givePlayerIds,
    getPlayerIds: state.getPlayerIds,
    persistenceStatus,
    addPlayer,
    removePlayer,
    swapSides,
    clear,
  };
}
