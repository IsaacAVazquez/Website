"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDraftTimer } from "../hooks/useDraftTimer";

type DraftClock = ReturnType<typeof useDraftTimer>;
type DraftClockOptions = Parameters<typeof useDraftTimer>[0];

const DraftClockContext = createContext<DraftClock>({
  secondsLeft: 0,
  isExpired: false,
  isRunning: false,
});

/**
 * Runs the pick clock for everything inside it. The clock ticks once a second,
 * so it is held here and not in the draft room's root. A tick renders this
 * provider and the components that read the clock. The room arrives as
 * `children`, and React skips it because that element has not changed.
 */
export function DraftClockProvider({
  children,
  ...options
}: DraftClockOptions & { children: ReactNode }) {
  const clock = useDraftTimer(options);
  return <DraftClockContext.Provider value={clock}>{children}</DraftClockContext.Provider>;
}

export function useDraftClock(): DraftClock {
  return useContext(DraftClockContext);
}

export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** The clock as it reads inside a sentence, as in "Pick #4 of 180 · 1:12 advisory". */
export function DraftClockInline() {
  const { secondsLeft } = useDraftClock();
  return <>{` · ${formatClock(Math.max(0, secondsLeft))} advisory`}</>;
}
