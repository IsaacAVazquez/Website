"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

function subscribe(onChange: () => void): () => void {
  const id = window.setInterval(onChange, MINUTE_MS);
  return () => window.clearInterval(id);
}

// Coarsened to the minute so repeated reads between ticks return the same value.
function getSnapshot(): number {
  return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

function getServerSnapshot(): null {
  return null;
}

/**
 * The current time on the client, ticking each minute, or `null` on the
 * server and during hydration. Text that depends on "now" ("14m ago", a
 * countdown, days left) renders a now-free fallback while this is `null`, so
 * the server HTML and the first client render always match.
 */
export function useClientNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
