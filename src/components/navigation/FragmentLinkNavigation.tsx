"use client";

import { useEffect } from "react";

/**
 * Follows same-page links (`href="#section"`) from the address the page has
 * now. Renders nothing.
 *
 * Firefox stores each link's resolved address when the document finishes
 * loading, because its DNS prefetch for anchors calls `Link::GetURI()`. When a
 * page rewrites its own URL before the link first registers, which can take a
 * second, Firefox does not refresh that stored address. The dashboards rewrite
 * their query string on mount, so a click on `#research-section` went to the
 * old URL plus the fragment, which is a different document, and the page
 * loaded again at the top instead of scrolling.
 *
 * Firefox prefetches for anchors on http pages by default and on https pages
 * only with `dom.prefetch_dns_for_anchor_https_document` on, so localhost and
 * CI show this before production does.
 *
 * `location.assign` with only the fragment changed is still a fragment
 * navigation, so the history entry, `:target`, scroll margin, smooth
 * scrolling, and focus all behave as they do for a followed link.
 */
export function FragmentLinkNavigation() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link =
        event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
      if (!link || link.hasAttribute("download")) return;

      const target = link.getAttribute("target");
      if (target && target !== "_self") return;

      event.preventDefault();
      const url = new URL(window.location.href);
      url.hash = link.getAttribute("href") ?? "";
      window.location.assign(url);
    };

    // On window, so it runs after React's handlers on the document and can
    // tell when one of them already took the click.
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return null;
}
