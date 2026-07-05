"use client";

import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";

// What the hero's "Now" line cycles through, one line per page load. Kept as
// short, generic activity notes (no invented numbers or claims) so rotating
// them never risks stating something untrue.
const NOW_ITEMS = [
  "Decision memo for AI workflows",
  "Prototyping Interchange IQ v2",
  "Refining the investment research platform",
  "Reading up on positional value in fantasy drafts",
  "A QA-to-product case study",
  "Mapping the fintech tool roadmap",
  "Notes on restraint in product work",
];

const STORAGE_KEY = "wi-now-idx";

/**
 * Rotates the hero's "Now" line one step per page load, persisting the next
 * index in localStorage (mirrors the design kit's home.jsx behavior). Renders
 * item 0 on the server and on first client paint — deterministic, so no
 * hydration mismatch — then swaps in the real (possibly different) index
 * from localStorage once mounted. The swap fades in; that fade is gated
 * behind prefers-reduced-motion in CSS.
 */
export function NowLine() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let next: number;
    try {
      const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? "", 10);
      next = Number.isNaN(stored)
        ? 0
        : ((stored % NOW_ITEMS.length) + NOW_ITEMS.length) % NOW_ITEMS.length;
    } catch {
      next = 0;
    }
    // One-time sync from localStorage on mount, same shape as resetting
    // pagination elsewhere in the app — there's no external-system
    // subscription to hang this off of, just a single read.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage read on mount
    setIndex(next);
    try {
      localStorage.setItem(STORAGE_KEY, String((next + 1) % NOW_ITEMS.length));
    } catch {
      // localStorage unavailable (private mode, etc.) — rotation just resets each load.
    }
  }, []);

  return (
    <p className={styles.nowLine}>
      <span className={styles.nowLead}>Now ·</span>
      <span key={index} className={styles.nowText}>
        {NOW_ITEMS[index]}
      </span>
    </p>
  );
}
