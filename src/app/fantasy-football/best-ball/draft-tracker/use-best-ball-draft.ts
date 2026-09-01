"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Player } from "@/types";
import {
  addBestBallDraftPick,
  createBestBallDraftState,
  getBestBallDraftBackupKey,
  getBestBallDraftStorageKey,
  getBestBallTeamForPick,
  parseBestBallDraftState,
  redoBestBallDraftPick,
  startBestBallDraft,
  undoBestBallDraftPick,
  undoBestBallDraftPickTo,
  type BestBallDraftState,
  type BestBallRoomRules,
} from "./best-ball-draft-state";

export function useBestBallDraft({
  season,
  rules,
  initialSlot = 1,
}: {
  season: number;
  rules: BestBallRoomRules;
  initialSlot?: number;
}) {
  const storageKey = useMemo(
    () => getBestBallDraftStorageKey(season, rules.contestId),
    [rules.contestId, season]
  );
  const [state, setState] = useState<BestBallDraftState>(() =>
    createBestBallDraftState(season, rules, initialSlot)
  );
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  useEffect(() => {
    let nextState = createBestBallDraftState(season, rules, initialSlot);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const restored = parseBestBallDraftState(raw, season, rules);
        if (restored) {
          nextState = restored;
        } else {
          window.localStorage.setItem(
            getBestBallDraftBackupKey(season, rules.contestId),
            raw
          );
          // The backup is a second localStorage key and nothing in this
          // interface opens it, so the notice says the save still exists and
          // stops short of implying a way to get it back.
          // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is read only after hydration
          setRestoreNotice(
            "I started a new room because the saved draft did not match the current contest rules. I kept the prior save as a local backup in this browser, and there is no way to open it from this page."
          );
        }
      }
    } catch {
      setPersistenceError(
        "This room still works in this tab, but your browser is blocking local saves."
      );
    }
    // The key identifies a different contest-specific room and should replace the prior room in memory.
    setState(nextState);
    setLoadedKey(storageKey);
  }, [initialSlot, rules, season, storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- this reports an external storage failure
      setPersistenceError(
        "This room still works in this tab, but changes cannot be saved locally."
      );
    }
  }, [loadedKey, state, storageKey]);

  const setUserSlot = useCallback((slot: number) => {
    setState((current) => {
      if (current.startedAt !== null) return current;
      return createBestBallDraftState(
        current.season,
        current.rules,
        Math.min(current.rules.teams, Math.max(1, slot))
      );
    });
  }, []);

  const startDraft = useCallback(() => {
    setState((current) => startBestBallDraft(current));
  }, []);

  const draftPlayer = useCallback((player: Player) => {
    setState((current) => addBestBallDraftPick(current, player));
  }, []);

  const undoLastPick = useCallback(() => {
    setState((current) => undoBestBallDraftPick(current));
  }, []);

  const undoToPick = useCallback((targetPickNumber: number) => {
    setState((current) => undoBestBallDraftPickTo(current, targetPickNumber));
  }, []);

  const redoLastPick = useCallback(() => {
    setState((current) => redoBestBallDraftPick(current));
  }, []);

  const resetDraft = useCallback(() => {
    setState((current) =>
      createBestBallDraftState(current.season, current.rules, current.userSlot)
    );
  }, []);

  const currentPick = state.picks.length + 1;
  const totalPicks = state.rules.teams * state.rules.rounds;
  const isComplete = currentPick > totalPicks;
  const currentTeamNumber = isComplete
    ? null
    : getBestBallTeamForPick(currentPick, state.rules.teams);
  const userPicks = state.picks.filter((pick) => pick.teamNumber === state.userSlot);
  const nextRedoPick = state.undoHistory[state.undoHistory.length - 1] ?? null;

  return {
    state,
    isLoaded: loadedKey === storageKey,
    isRoomOpen: state.startedAt !== null,
    persistenceError,
    restoreNotice,
    currentPick,
    currentRound: Math.min(state.rules.rounds, Math.ceil(currentPick / state.rules.teams)),
    currentTeamNumber,
    totalPicks,
    isComplete,
    isUserPick: currentTeamNumber === state.userSlot,
    userPicks,
    canRedo: nextRedoPick !== null && !isComplete,
    nextRedoPick,
    setUserSlot,
    startDraft,
    draftPlayer,
    undoLastPick,
    undoToPick,
    redoLastPick,
    resetDraft,
  };
}
