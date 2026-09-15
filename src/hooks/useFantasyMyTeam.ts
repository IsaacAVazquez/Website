"use client";

import { useCallback, useMemo } from "react";
import { useLocalStoragePersistenceStatus, useLocalStorageString } from "@/hooks/useLocalStorageString";
import { readBrowserStorageString, writeBrowserStorageJson } from "@/lib/browserStorage";
import { getMyTeamStorageKey, parseMyTeam, type FantasyMyTeam } from "@/lib/fantasyMyTeam";

export function useFantasyMyTeam(season: number) {
  const key = getMyTeamStorageKey(season);
  const raw = useLocalStorageString(key);
  const persistenceStatus = useLocalStoragePersistenceStatus(key);
  const team = useMemo(() => parseMyTeam(raw, season), [raw, season]);
  const update = useCallback((change: (current: FantasyMyTeam) => FantasyMyTeam) => {
    const current = parseMyTeam(readBrowserStorageString(key).value, season);
    const next = change(current);
    writeBrowserStorageJson(key, parseMyTeam(JSON.stringify(next), season));
  }, [key, season]);
  return { team, update, persistenceStatus, hasSavedTeam: raw.length > 0 };
}
