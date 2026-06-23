"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isAnalyticsEnabled, trackScrollDepth } from "@/lib/analytics";

const MILESTONES = [25, 50, 75, 100] as const;

// A page only counts as "long" once it is meaningfully taller than the
// viewport — otherwise a slightly-overflowing short page would fire every
// milestone the moment it loads. 1.5 screens is the floor.
const LONG_PAGE_FACTOR = 1.5;

/**
 * Global scroll-depth tracking. Fires a `scroll_depth` event once per milestone
 * (25 / 50 / 75 / 100) on long pages, resetting on client-side navigation.
 *
 * Renders nothing and does no work when analytics is disabled.
 */
export function ScrollDepthTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    const fired = new Set<number>();
    let frame = 0;

    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const viewport = window.innerHeight;
      const scrollable = doc.scrollHeight - viewport;

      // Skip pages that don't scroll far enough to count as "long".
      if (scrollable <= 0 || doc.scrollHeight < viewport * LONG_PAGE_FACTOR) {
        return;
      }

      const percent = Math.min(100, (window.scrollY / scrollable) * 100);

      for (const milestone of MILESTONES) {
        if (percent >= milestone && !fired.has(milestone)) {
          fired.add(milestone);
          trackScrollDepth({ percent_scrolled: milestone, page_path: pathname });
        }
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Catch pages that load already-scrolled (e.g. anchored deep links).
    measure();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
