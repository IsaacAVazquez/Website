"use client";

import type { ReactNode } from "react";
import styles from "./InstrumentTape.module.css";

export interface InstrumentTapeItem {
  key: string;
  content: ReactNode;
}

interface InstrumentTapeProps {
  /** Leading mono tag rendered before the scrolling track, e.g. "Latest · Flight 412". */
  label?: ReactNode;
  items: InstrumentTapeItem[];
  /** Accessible label for the scrolling region (role="status"). */
  ariaLabel: string;
  className?: string;
  /** Rendered instead of the track when `items` is empty. Pass nothing to render nothing. */
  emptyFallback?: ReactNode;
}

/**
 * Shared horizontal mono readout strip — a "tape" — for live-instrument
 * ticker devices (recent outcomes, quote lines, results feeds). A thin
 * layout shell only: callers supply fully rendered items, so the same
 * primitive can back the investments quote tape, dashboard results tapes,
 * and the SpaceX launch tape without duplicating the scroll/hairline chrome.
 *
 * Deliberately has NO auto-scrolling/marquee animation — the motion rules
 * forbid looping animation. Horizontal overflow is a plain scroll container
 * that clips gracefully instead of wrapping or truncating.
 */
export function InstrumentTape({
  label,
  items,
  ariaLabel,
  className = "",
  emptyFallback = null,
}: InstrumentTapeProps) {
  if (items.length === 0) {
    return emptyFallback ? <div className={className}>{emptyFallback}</div> : null;
  }

  return (
    <div className={`${styles.band} ${className}`}>
      {label ? <span className={styles.tag}>{label}</span> : null}
      <div className={styles.track} role="status" aria-label={ariaLabel}>
        {items.map((item) => (
          <span key={item.key} className={styles.item}>
            {item.content}
          </span>
        ))}
      </div>
    </div>
  );
}
