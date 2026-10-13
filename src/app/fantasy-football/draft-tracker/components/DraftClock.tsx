"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DraftScorebugCell } from "@/components/fantasy/DraftRoomParts";
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

/**
 * The scorebug's clock cell. It reads the pick clock itself, so a tick renders
 * this cell and not the room around it. The clock is advisory and nothing
 * fires at zero, so it is muted while other teams pick and takes the
 * highlighter only in the last 15 seconds of the user's own pick.
 */
export function DraftClockCell({
  secondsPerPick,
  mine,
  canBeUrgent,
}: {
  secondsPerPick: number;
  mine: boolean;
  canBeUrgent: boolean;
}) {
  const clock = useDraftClock();
  const urgent = canBeUrgent && !clock.isExpired && clock.secondsLeft <= 15;
  const tone = urgent ? " ffb-is-urgent" : mine ? "" : " ffb-is-quiet";

  return (
    <DraftScorebugCell
      label="Clock"
      className={`ffb-dt-clock${tone}`}
      role="timer"
      aria-live="off"
      aria-label={
        clock.isExpired ? "Pick clock expired" : `${clock.secondsLeft} seconds left on the pick clock`
      }
    >
      {formatClock(Math.max(0, clock.secondsLeft))}{" "}
      <small>
        <span className="ffb-bug-short">{secondsPerPick}s advisory</span>
        <span className="ffb-bug-long">advisory · {secondsPerPick}s per pick</span>
      </small>
    </DraftScorebugCell>
  );
}
