"use client";

import { useEffect, useState } from "react";

/**
 * True once `open` has been true, and true from the first render when it
 * starts that way, so an overlay a deep link opened still renders on the
 * server.
 *
 * It pairs with `next/dynamic` to keep an overlay's code out of first load.
 * The overlay mounts the first time it opens and stays mounted after that, so
 * its exit animation has something to run on and focus can return to whatever
 * opened it.
 *
 * `preload` is called once, when the browser is idle, so the first open does
 * not wait on the network. Pass a module-level function, since a new function
 * on every render would schedule it again.
 */
export function useMountOnFirstOpen(
  open: boolean,
  preload?: () => Promise<unknown>,
): boolean {
  const [hasOpened, setHasOpened] = useState(open);
  if (open && !hasOpened) setHasOpened(true);

  useEffect(() => {
    if (!preload) return;
    // A failed preload is not an error here. The overlay asks for the same
    // chunk again when it opens, and that request reports its own failure.
    const run = () => void preload().catch(() => undefined);

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(run, 2000);
    return () => window.clearTimeout(handle);
  }, [preload]);

  return hasOpened || open;
}
