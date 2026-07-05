"use client";

import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function readClock(): string {
  try {
    return clockFormatter.format(new Date());
  } catch {
    return new Date().toTimeString().slice(0, 8);
  }
}

/**
 * Ticking Pacific-time readout for the live-index panel cap. The server (and
 * first client paint) render whatever time it is at that instant; the effect
 * then re-reads the clock every second. That first read is almost certainly
 * stale by the time React hydrates, so the readout carries
 * `suppressHydrationWarning` — the standard escape hatch for a value that's
 * expected to differ between server and client (see React docs on dates).
 * This is a plain digit tick, not a decorative animation, so it isn't gated
 * behind prefers-reduced-motion.
 */
export function PanelClock() {
  const [time, setTime] = useState(readClock);

  useEffect(() => {
    // The lazy initializer above already covers the very first paint; this
    // interval just keeps it ticking every second after that.
    const id = setInterval(() => setTime(readClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={styles.panelClock}>
      <span suppressHydrationWarning>{time}</span>
      <span className={styles.panelClockZone}>PT</span>
    </span>
  );
}
