"use client";

import { useEffect, useState } from "react";

interface UseDraftTimerOptions {
  /** Resets the countdown whenever this changes — i.e. each new pick. */
  currentPick: number;
  durationSeconds: number;
  enabled: boolean;
  isActive: boolean;
}

/**
 * An advisory per-pick countdown for the draft assistant. It resets on every
 * pick, ticks down once a second, and pauses while the tab is hidden so a
 * backgrounded draft doesn't burn the clock. It never auto-picks — this is a
 * manual tracker; the timer is just a nudge.
 */
export function useDraftTimer({ currentPick, durationSeconds, enabled, isActive }: UseDraftTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  // Reset on each new pick (or when the duration / enabled state changes).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the countdown when the pick changes
    setSecondsLeft(durationSeconds);
  }, [currentPick, durationSeconds, enabled, isActive]);

  useEffect(() => {
    if (!enabled || !isActive || typeof window === "undefined") return;

    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [enabled, isActive, currentPick, durationSeconds]);

  return {
    secondsLeft,
    isExpired: enabled && isActive && secondsLeft <= 0,
    isRunning: enabled && isActive,
  };
}
