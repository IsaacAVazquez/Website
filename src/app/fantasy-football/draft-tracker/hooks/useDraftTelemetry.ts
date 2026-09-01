"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DRAFT_TELEMETRY_STORAGE_PREFIX,
  decodeDraftTurnRecords,
  getDraftTelemetryStorageKey,
  type DraftTurnRecord,
} from "@/lib/draftTelemetry";

/**
 * Best-effort persistence for per-turn recommendation records, keyed by the
 * room's draft id. Storage failures stay silent because telemetry must never
 * take the draft room down with it; the worst case is an unscored turn.
 */
export function useDraftTelemetry(draftId: string | undefined) {
  const [records, setRecords] = useState<DraftTurnRecord[]>([]);

  useEffect(() => {
    if (!draftId || typeof window === "undefined") return;
    let stored: DraftTurnRecord[];
    try {
      const raw = localStorage.getItem(getDraftTelemetryStorageKey(draftId));
      stored = raw ? decodeDraftTurnRecords(JSON.parse(raw)) : [];
    } catch {
      stored = [];
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate once per room id
    setRecords(stored);
  }, [draftId]);

  const appendRecord = useCallback(
    (turnRecord: DraftTurnRecord) => {
      if (!draftId) return;
      setRecords((previous) => {
        // A re-logged turn replaces its old record and everything after it,
        // because an undo branched the timeline those later records described.
        const next = [
          ...previous.filter((entry) => entry.pick < turnRecord.pick),
          turnRecord,
        ];
        try {
          localStorage.setItem(
            getDraftTelemetryStorageKey(draftId),
            JSON.stringify(next)
          );
          // One active room per season is the tracker's model, so telemetry
          // left behind by any other room id is an orphan and gets swept.
          // Swept on write rather than on mount, because the draft id present
          // at first render is a pre-hydration placeholder, and a mount-time
          // sweep keyed to it deleted the restored room's own records on
          // every page load.
          for (let index = localStorage.length - 1; index >= 0; index -= 1) {
            const key = localStorage.key(index);
            if (
              key &&
              key.startsWith(DRAFT_TELEMETRY_STORAGE_PREFIX) &&
              key !== getDraftTelemetryStorageKey(draftId)
            ) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Best-effort only.
        }
        return next;
      });
    },
    [draftId]
  );

  return { records, appendRecord };
}
