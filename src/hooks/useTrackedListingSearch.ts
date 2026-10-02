"use client";

import { useEffect, useRef } from "react";
import { trackListingSearch } from "@/lib/analytics";

/**
 * Reports completed listing searches to GA4 without coupling to a component's
 * existing input handlers. Debounces the term so a `listing_search` event
 * represents a finished query rather than one event per keystroke, and skips
 * empty terms and repeats of the last reported term.
 *
 * Drop-in: call it alongside the component's own search state.
 */
export function useTrackedListingSearch(term: string, resultsCount?: number) {
  const lastReported = useRef<string>("");
  const resultsRef = useRef<number | undefined>(resultsCount);

  useEffect(() => {
    resultsRef.current = resultsCount;
  }, [resultsCount]);

  useEffect(() => {
    const trimmed = term.trim();
    if (!trimmed) {
      // Reset so returning to the same term later still reports.
      lastReported.current = "";
      return;
    }

    const handle = window.setTimeout(() => {
      if (trimmed === lastReported.current) return;
      lastReported.current = trimmed;
      trackListingSearch({
        listing_id: "site_search",
        search_term: trimmed,
        results_count: resultsRef.current,
      });
    }, 700);

    return () => window.clearTimeout(handle);
  }, [term]);
}
