"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * How many children of a list sit on its first row. The kit's last picks strip
 * (`ffb-picks-list`) shows one row of whole stickers and clips the rest, and a
 * clipped button still takes focus where nobody can see it. A room that makes
 * its stickers buttons hides the ones past this count (`visibility: hidden`),
 * so the tab order matches what is on screen.
 *
 * Returns null until the first measurement, so the server render and the first
 * client render agree. Pass the item count as `itemCount` so a new pick is
 * measured.
 */
export function useFirstRowCount(listRef: RefObject<HTMLElement | null>, itemCount: number): number | null {
  const [fit, setFit] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    // The observer reports once when it starts, so the first count comes from it too.
    const observer = new ResizeObserver(() => {
      const items = Array.from(list.children) as HTMLElement[];
      const firstRowTop = items[0]?.offsetTop ?? 0;
      setFit(items.filter((item) => item.offsetTop === firstRowTop).length);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef, itemCount]);

  return fit;
}
