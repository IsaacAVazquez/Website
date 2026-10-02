"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { emitBrowserStorageChange, subscribeBrowserStorage } from "@/lib/browserStorage";
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

  const stateRef = useRef(state);
  const knownRawRef = useRef<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);
  const unsavedRef = useRef(false);
  const conflictRef = useRef(false);
  const conflictWarning = "This tab has unsaved draft changes, and another tab saved a different draft. I kept this tab's picks. Resetting the draft will clear them and resolve the conflict.";

  const restoreRaw = useCallback((raw: string | null) => {
    if (unsavedRef.current && raw !== knownRawRef.current) {
      conflictRef.current = true;
      setPersistenceError(conflictWarning);
      return;
    }
    const restored = raw ? parseBestBallDraftState(raw, season, rules) : null;
    if (raw && !restored) {
      try {
        window.localStorage.setItem(getBestBallDraftBackupKey(season, rules.contestId), raw);
        setRestoreNotice(
          "I started a new room because the saved draft did not match the current contest rules. I kept the prior save as a local backup in this browser, and there is no way to open it from this page."
        );
      } catch {
        setPersistenceError("This room still works in this tab, but changes cannot be saved locally.");
      }
    }
    const next = restored ?? createBestBallDraftState(season, rules, initialSlot);
    knownRawRef.current = raw;
    stateRef.current = next;
    setState(next);
  }, [initialSlot, rules, season]);

  const persist = useCallback((next: BestBallDraftState) => {
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(storageKey, raw);
      knownRawRef.current = raw;
      unsavedRef.current = false;
      emitBrowserStorageChange(storageKey);
      return true;
    } catch {
      unsavedRef.current = true;
      setPersistenceError("This room still works in this tab, but changes cannot be saved locally.");
      return false;
    }
  }, [storageKey]);

  useEffect(() => {
    let nextState = createBestBallDraftState(season, rules, initialSlot);
    knownRawRef.current = null;
    unsavedRef.current = false;
    conflictRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- replace a contest-specific room after hydration
    setPersistenceError(null);
    setRestoreNotice(null);
    try {
      const raw = window.localStorage.getItem(storageKey);
      knownRawRef.current = raw;
      if (raw) {
        const restored = parseBestBallDraftState(raw, season, rules);
        if (restored) {
          nextState = restored;
        } else {
          window.localStorage.setItem(getBestBallDraftBackupKey(season, rules.contestId), raw);
          setRestoreNotice(
            "I started a new room because the saved draft did not match the current contest rules. I kept the prior save as a local backup in this browser, and there is no way to open it from this page."
          );
        }
      }
    } catch {
      setPersistenceError("This room still works in this tab, but your browser is blocking local saves.");
    }
    stateRef.current = nextState;
    setState(nextState);
    loadedKeyRef.current = storageKey;
    persist(nextState);
    setLoadedKey(storageKey);
    return subscribeBrowserStorage(storageKey, () => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw !== knownRawRef.current) restoreRaw(raw);
      } catch { /* Keep the current room in memory when storage is blocked. */ }
    });
  }, [initialSlot, persist, restoreRaw, rules, season, storageKey]);

  const commitState = useCallback((update: (current: BestBallDraftState) => BestBallDraftState, discardUnsaved = false) => {
    if (loadedKeyRef.current !== storageKey) return;
    if (conflictRef.current && !discardUnsaved) {
      setPersistenceError(conflictWarning);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (discardUnsaved) {
        knownRawRef.current = raw;
      } else if (raw !== knownRawRef.current) {
        restoreRaw(raw);
        if (!conflictRef.current) setPersistenceError("This draft changed in another tab. I loaded the latest save. Try that action again.");
        return;
      }
    } catch {
      // Browser restrictions do not prevent drafting in this tab.
    }
    if (discardUnsaved) conflictRef.current = false;
    const next = update(stateRef.current);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
    if (persist(next)) setPersistenceError(null);
  }, [persist, restoreRaw, storageKey]);

  const setUserSlot = useCallback((slot: number) => {
    commitState((current) => {
      if (current.startedAt !== null) return current;
      return createBestBallDraftState(
        current.season,
        current.rules,
        Math.min(current.rules.teams, Math.max(1, slot))
      );
    });
  }, [commitState]);

  const startDraft = useCallback(() => {
    commitState((current) => startBestBallDraft(current));
  }, [commitState]);

  const draftPlayer = useCallback((player: Player) => {
    commitState((current) => addBestBallDraftPick(current, player));
  }, [commitState]);

  const undoLastPick = useCallback(() => {
    commitState((current) => undoBestBallDraftPick(current));
  }, [commitState]);

  const undoToPick = useCallback((targetPickNumber: number) => {
    commitState((current) => undoBestBallDraftPickTo(current, targetPickNumber));
  }, [commitState]);

  const redoLastPick = useCallback(() => {
    commitState((current) => redoBestBallDraftPick(current));
  }, [commitState]);

  const resetDraft = useCallback(() => {
    commitState((current) =>
      createBestBallDraftState(current.season, current.rules, current.userSlot), true
    );
  }, [commitState]);

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
