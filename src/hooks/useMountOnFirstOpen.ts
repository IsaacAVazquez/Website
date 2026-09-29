"use client";

import { useEffect, useState } from "react";

/**
 * True once `open` has been true, and true from the first render when it
 * starts that way, so an overlay a deep link opened still renders on the
 * server.
 *
 * It pairs with `next/dynamic` to keep an overlay's code out of first load.
 * The overlay stays mounted once it has mounted, so its exit animation has
 * something to run on and focus can return to whatever opened it.
 *
 * `preload` is called once, when the browser is idle, and the overlay mounts
 * closed as soon as that code is in. React shows a lazy component's fallback
 * the first time it renders and then holds the real content for 300 ms, so an
 * overlay that first rendered on the click opened that much later. Pass a
 * module-level function, since a new function on every render would schedule
 * the load again.
 */
export function useMountOnFirstOpen(
  open: boolean,
  preload?: () => Promise<unknown>,
): boolean {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (!preload || mounted) return;
    let cancelled = false;
    const run = () =>
      void preload().then(
        () => {
          if (!cancelled) setMounted(true);
        },
        // A failed preload is not an error here. The overlay asks for the
        // same chunk again when it opens, and that request reports its own
        // failure.
        () => undefined,
      );

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(run, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
      };
    }
    const handle = window.setTimeout(run, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [preload, mounted]);

  return mounted || open;
}
