"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

/**
 * Whether the viewer asked for reduced motion. `false` on the server and
 * during hydration, so the server HTML and the first client render match.
 * CSS transitions are already held to 0.01ms by the guard in `catalog97.css`;
 * this is for motion that JavaScript drives (smooth scroll, D3 transitions).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
