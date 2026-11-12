"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import {
  BLACKJACK_PROGRESS_STORAGE_KEY,
  emptyProgress,
  loadBlackjackProgress,
  parseBlackjackProgress,
  saveBlackjackProgress,
  type BlackjackProgress,
} from "@/lib/blackjack/progress";

/**
 * The trainer's saved progress, read reactively from localStorage. Every edit
 * is applied to the latest validated save at commit time, so a hand played in
 * another tab is not overwritten by a value this tab rendered earlier.
 */
export function useBlackjackProgress() {
  const stored = useLocalStorageString(BLACKJACK_PROGRESS_STORAGE_KEY, "");
  const progress = useMemo(() => parseBlackjackProgress(stored), [stored]);

  const update = useCallback((updater: (current: BlackjackProgress) => BlackjackProgress) => {
    saveBlackjackProgress(updater(loadBlackjackProgress()));
  }, []);

  const reset = useCallback(() => {
    // The chosen table is a setting, so a reset keeps it.
    saveBlackjackProgress({ ...emptyProgress(), rulesId: loadBlackjackProgress().rulesId });
  }, []);

  return { progress, update, reset };
}
